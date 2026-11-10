import { parseDeckImport } from '~/utils/deckTransfer';
import {
  computed,
  inject,
  provide,
  shallowRef,
  watch,
  type InjectionKey,
} from 'vue';
import type { ScryfallCard } from '~/models/cardModel';
import type {
  DecklistSummary,
  BulkEditRequest,
  CardListFormatType,
} from '~/models/cardListModel';
import type { Database } from '~/database.types';
import {
  emptyGuestDeck,
  setGuestCopies,
  type GuestBoard,
} from '~/utils/guestDeck';
import { getPartnerType, getValidPartners } from '~/utils/partnerCommanders';

export const BROWSER_DECK_ID = 'browser-draft';
const browserDeckKey: InjectionKey<ReturnType<typeof createBrowserDeckSource>> =
  Symbol('browser-deck');
export function useBrowserDeckSource() {
  return inject(browserDeckKey, null);
}
export function provideBrowserDeckSource() {
  const source = createBrowserDeckSource();
  provide(browserDeckKey, source);
  return source;
}

/** Adapt the shared editor to browser storage. Only card lookups leave the browser. */
function createBrowserDeckSource() {
  const guest = useGuestDeck();
  const { draft, edit } = guest;
  const config = useRuntimeConfig();
  const { data: partners } = usePartnerCommanders();
  const { data: commanderNames } = useCommanders();
  const names = computed(() => [
    ...new Set(draft.value.cards.map((card) => card.name)),
  ]);
  const query = useCardsByName(names);
  const catalog = shallowRef(new Map<string, ScryfallCard>());
  function remember(cards: ScryfallCard[]) {
    const next = new Map(catalog.value);
    for (const card of cards) {
      next.set(card.name.toLowerCase(), card);
      for (const alias of card.name_aliases ?? [])
        next.set(alias.toLowerCase(), card);
      for (const face of card.card_faces ?? [])
        next.set(face.name.toLowerCase(), card);
    }
    catalog.value = next;
  }
  watch(
    query.cards,
    (cards) => remember((cards ?? []).map((card) => card.card_data)),
    { immediate: true },
  );
  const cards = computed(() =>
    names.value.flatMap((name) => {
      const card = catalog.value.get(name.toLowerCase());
      return card ? [{ card_name: card.name, card_data: card }] : [];
    }),
  );
  const loading = computed(() => !guest.ready.value || query.isLoading.value);
  const items = computed<
    Database['public']['Tables']['card_list_items']['Row'][]
  >(() =>
    draft.value.cards.flatMap((entry) => {
      const card = catalog.value.get(entry.name.toLowerCase());
      return card
        ? [
            {
              id: `${entry.board}:${card.oracle_id}`,
              list_id: BROWSER_DECK_ID,
              oracle_id: card.oracle_id,
              card_id: card.oracle_id,
              board: entry.board,
              num_copies: entry.quantity,
              is_commander:
                entry.board === 'Mainboard' &&
                draft.value.commanders.includes(entry.name),
              created_at: '',
            },
          ]
        : [];
    }),
  );
  const list = computed<DecklistSummary>(() => {
    const color_ratios = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
    for (const entry of draft.value.cards) {
      if (entry.board !== 'Mainboard') continue;
      const card = catalog.value.get(entry.name.toLowerCase());
      for (const color of card?.color_identity?.length
        ? card.color_identity
        : ['C']) {
        if (color in color_ratios)
          color_ratios[color as keyof typeof color_ratios] += entry.quantity;
      }
    }
    const total = Object.values(color_ratios).reduce((a, b) => a + b, 0);
    if (total)
      for (const color of Object.keys(
        color_ratios,
      ) as (keyof typeof color_ratios)[])
        color_ratios[color] /= total;
    return {
      id: BROWSER_DECK_ID,
      kind: 'deck',
      folder_id: null,
      name: draft.value.name,
      description: draft.value.description,
      format: draft.value.format,
      bracket: draft.value.bracket,
      avatar_card_name: draft.value.avatarCardName,
      commanders: draft.value.commanders,
      color_ratios,
      visibility: 'private',
      user_id: '',
      username: null,
      created_at: '',
      updated_at: null,
      like_count: 0,
      save_count: 0,
      comment_count: 0,
      view_count: 0,
    };
  });
  async function resolve(cardNames: string[]) {
    const missing = [...new Set(cardNames)].filter(
      (name) => !catalog.value.has(name.toLowerCase()),
    );
    for (let start = 0; start < missing.length; start += 500) {
      remember(
        await $fetch<ScryfallCard[]>(
          `${config.public.backendPath}/cards/cards-by-names`,
          {
            method: 'POST',
            body: { cardNames: missing.slice(start, start + 500) },
          },
        ),
      );
    }
    const invalid = cardNames.filter(
      (name) => !catalog.value.has(name.toLowerCase()),
    );
    if (invalid.length)
      throw new Error(
        `Could not find: ${invalid.join(', ')}. Your draft has not changed.`,
      );
    return cardNames.map((name) => catalog.value.get(name.toLowerCase())!);
  }
  async function addNames(
    cardNames: string[],
    board: GuestBoard = 'Mainboard',
  ) {
    const entries = parseDeckImport(cardNames.join('\n'), 'text');
    const resolved = await resolve(entries.map((entry) => entry.name));
    let addedCount = 0,
      updatedCount = 0;
    edit((next) => {
      for (const [index, card] of resolved.entries()) {
        const entry = next.cards.find(
          (entry) => entry.name === card.name && entry.board === board,
        );
        if (board === 'Mainboard' && next.commanders.includes(card.name))
          continue;
        if (entry) updatedCount++;
        else addedCount++;
        setGuestCopies(
          next,
          card.name,
          board,
          (entry?.quantity ?? 0) + entries[index].quantity,
        );
      }
    });
    return { addedCount, updatedCount, invalidCardNames: [] as string[] };
  }
  async function addIds(ids: string[], board?: GuestBoard) {
    const resolved = await $fetch<ScryfallCard[]>(
      `${config.public.backendPath}/cards/cards-by-oracle-ids`,
      {
        method: 'POST',
        body: { oracleIds: ids },
      },
    );
    if (ids.some((id) => !resolved.some((card) => card.oracle_id === id)))
      throw new Error(
        'Some cards could not be loaded. Your draft has not changed.',
      );
    remember(resolved);
    const result = await addNames(
      ids.map((id) => resolved.find((card) => card.oracle_id === id)!.name),
      board,
    );
    return { ...result, invalidOracleIds: [] as string[] };
  }
  function remove(ids: string | string[], board?: GuestBoard) {
    const selected = new Set(Array.isArray(ids) ? ids : [ids]);
    let removedCount = 0;
    edit((next) => {
      for (const entry of [...next.cards]) {
        const card = catalog.value.get(entry.name.toLowerCase());
        if (
          card &&
          selected.has(card.oracle_id) &&
          (!board || entry.board === board)
        ) {
          removedCount++;
          setGuestCopies(next, entry.name, entry.board, 0);
        }
      }
    });
    return { removedCount };
  }
  async function bulkEdit(request: BulkEditRequest) {
    await resolve(
      request.entries.flatMap((entry) => entry.cards.map((card) => card.name)),
    );
    const before = new Set(
      draft.value.cards.map((card) => `${card.board}:${card.name}`),
    );
    edit((next) => {
      const boards = new Set(request.entries.map((entry) => entry.board));
      next.cards = next.cards.filter(
        (card) =>
          !boards.has(card.board) ||
          (card.board === 'Mainboard' && next.commanders.includes(card.name)),
      );
      for (const entry of request.entries)
        for (const card of entry.cards) {
          const name = catalog.value.get(card.name.toLowerCase())!.name;
          setGuestCopies(
            next,
            name,
            entry.board,
            entry.board === 'Mainboard' && next.commanders.includes(name)
              ? 1
              : card.num_copies,
          );
        }
    });
    const after = new Set(
      draft.value.cards.map((card) => `${card.board}:${card.name}`),
    );
    return {
      addedCount: [...after].filter((key) => !before.has(key)).length,
      removedCount: [...before].filter((key) => !after.has(key)).length,
      invalidCardNames: [] as string[],
    };
  }
  function copies(
    name: string,
    count: number,
    board: GuestBoard = 'Mainboard',
  ) {
    edit((next) => {
      if (board === 'Mainboard' && next.commanders.includes(name) && count > 1)
        throw new Error('Commanders can only have one copy.');
      setGuestCopies(next, name, board, count);
    });
    return { cardName: name, numCopies: count };
  }
  function move(
    name: string,
    board: GuestBoard,
    fromBoard: GuestBoard = 'Mainboard',
  ) {
    edit((next) => {
      if (board === fromBoard) return;
      const source = next.cards.find(
        (card) => card.name === name && card.board === fromBoard,
      );
      if (!source) throw new Error('Card not found in this board.');
      const quantity =
        source.quantity +
        (next.cards.find((card) => card.name === name && card.board === board)
          ?.quantity ?? 0);
      if (board === 'Mainboard' && next.commanders.includes(name))
        throw new Error('Commanders can only have one copy.');
      setGuestCopies(next, name, fromBoard, 0);
      setGuestCopies(next, name, board, quantity);
    });
    return { cardName: name, board };
  }
  async function setCommander(name: string) {
    const [card] = await resolve([name]);
    name = card.name;
    if (!commanderNames.value?.includes(name))
      throw new Error(
        'Choose a valid commander. The commander catalog may still be loading.',
      );
    edit((next) => {
      if (next.format !== 'Commander')
        throw new Error('Choose Commander format first.');
      if (!next.commanders.includes(name)) {
        const first = next.commanders[0];
        const type =
          first && partners.value && getPartnerType(first, partners.value);
        const pair =
          next.commanders.length === 1 &&
          type &&
          partners.value &&
          getValidPartners(type, partners.value, first).includes(name);
        next.commanders = pair ? [first, name] : [name];
      }
      setGuestCopies(next, name, 'Mainboard', 1);
    });
  }
  function clearCommander(id?: string) {
    edit((next) => {
      next.commanders = id
        ? next.commanders.filter(
            (name) => catalog.value.get(name.toLowerCase())?.oracle_id !== id,
          )
        : [];
    });
  }
  function updateFormat(format: CardListFormatType) {
    const commandersCleared =
      format !== 'Commander' && draft.value.commanders.length > 0;
    edit((next) => {
      next.format = format;
      if (commandersCleared) next.commanders = [];
    });
    return { format, commandersCleared };
  }
  function update(updates: {
    name?: string;
    description?: string;
    bracket?: number | null;
  }) {
    edit((next) => Object.assign(next, updates));
  }
  function avatar(name: string) {
    edit((next) => {
      next.avatarCardName = name;
    });
  }
  function reset() {
    edit((next) => Object.assign(next, emptyGuestDeck()));
  }
  return {
    ...guest,
    list,
    items,
    cards,
    loading,
    error: query.error,
    retry: query.refetch,
    addNames,
    addIds,
    remove,
    bulkEdit,
    copies,
    move,
    setCommander,
    clearCommander,
    updateFormat,
    update,
    avatar,
    reset,
  };
}
