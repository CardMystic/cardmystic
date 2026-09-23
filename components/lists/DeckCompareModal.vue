<template>
  <UModal
    v-model:open="open"
    title="Compare decks"
    description="Compare card names and copy counts on the selected board."
    :dismissible="!busy"
    :close="{ disabled: busy }"
    :ui="{ content: 'sm:max-w-3xl lg:max-w-5xl' }"
  >
    <template #body>
      <div class="space-y-4">
        <label class="flex items-center gap-2 text-sm"
          >Board
          <USelect
            v-model="board"
            :items="boards"
            aria-label="Comparison board"
            :disabled="busy"
          />
        </label>
        <UTextarea
          v-model="input"
          aria-label="Decklist or CardMystic URL"
          class="w-full"
          :rows="5"
          :disabled="busy"
          placeholder="Paste a decklist or a public CardMystic deck URL"
        />
        <UButton
          label="Compare"
          icon="i-lucide-scale"
          :loading="comparing"
          :disabled="busy || catalogLoading || !input.trim()"
          @click="compare"
        />
        <p v-if="catalogLoading" class="text-sm text-muted">
          Loading card names…
        </p>
        <p v-if="error" role="alert" class="text-sm text-error">{{ error }}</p>
        <p v-if="parseWarning" role="alert" class="text-sm text-warning">
          {{ parseWarning }}
        </p>
        <template v-if="reference">
          <p class="text-sm text-muted">
            {{ sourceName }} · {{ board }}. Add uses the compared count. Remove
            deletes all copies from this board.
          </p>
          <div class="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
            <aside
              aria-label="Card preview"
              class="hidden lg:flex items-center justify-center"
            >
              <div class="w-full max-w-56 text-center">
                <div
                  class="flex aspect-[5/7] items-center justify-center overflow-hidden rounded-lg bg-muted"
                >
                  <img
                    v-if="
                      previewCard && imageUrl(previewCard.oracleId, 'normal')
                    "
                    :src="imageUrl(previewCard.oracleId, 'normal')"
                    :alt="previewCard.name + ' preview'"
                    width="488"
                    height="680"
                    class="block h-full w-full object-contain"
                    @error="imageFailed"
                  />
                  <p v-else class="p-4 text-center text-sm text-muted">
                    {{
                      previewCard
                        ? 'Image unavailable.'
                        : 'Hover a card to preview it.'
                    }}
                  </p>
                </div>
                <p class="mt-2 h-10 line-clamp-2 text-sm font-medium">
                  {{ previewCard?.name }}
                </p>
              </div>
            </aside>
            <div
              class="min-w-0 space-y-4 rounded-xl bg-black/5 p-3 dark:bg-black/20"
            >
              <label class="flex w-full items-center gap-2 text-sm font-medium">
                <span class="shrink-0">Show:</span>
                <USelect
                  v-model="show"
                  :items="showOptions"
                  aria-label="Show cards"
                  class="min-w-0 flex-1"
                />
              </label>
              <div class="flex flex-wrap justify-between gap-4">
                <section
                  v-for="section in sections.filter(
                    (section) => section.kind !== 'both',
                  )"
                  :key="section.kind"
                  :aria-label="section.title"
                  class="min-w-0 space-y-2"
                  :class="
                    section.kind === 'extra'
                      ? 'order-1'
                      : section.kind === 'count'
                        ? 'order-2'
                        : 'order-3'
                  "
                >
                  <h3 class="text-sm font-semibold">
                    {{ section.title }} ({{ section.cards.length }})
                  </h3>
                  <div
                    v-if="section.kind !== 'count'"
                    class="flex flex-wrap gap-2"
                  >
                    <UButton
                      icon="i-lucide-copy"
                      label="Copy names"
                      :aria-label="'Copy ' + section.title.toLowerCase()"
                      size="sm"
                      variant="outline"
                      :disabled="!section.cards.length"
                      @click="copyNames(section.cards)"
                    />
                    <UButton
                      :label="
                        section.kind === 'missing' ? 'Add All' : 'Remove All'
                      "
                      :color="section.color"
                      size="sm"
                      variant="outline"
                      :disabled="busy || loading || !section.cards.length"
                      @click="apply(section.kind, section.cards)"
                    />
                  </div>
                </section>
              </div>
              <div
                v-if="imagesError"
                class="flex items-center gap-2 text-sm text-muted"
              >
                Some card images couldn't load.
                <UButton
                  label="Retry images"
                  size="sm"
                  variant="link"
                  :loading="imagesFetching"
                  @click="
                    () => {
                      refetchImages();
                    }
                  "
                />
              </div>
              <ul
                aria-label="Card differences"
                class="min-w-0 h-[min(32rem,60vh)] overflow-y-auto [scrollbar-gutter:stable] space-y-2 pr-1"
              >
                <li
                  v-for="card in visibleCards"
                  :key="card.oracleId"
                  :data-kind="card.kind"
                  @mouseenter="previewCard = card"
                  @focusin="previewCard = card"
                  class="flex"
                  :class="
                    card.kind === 'missing'
                      ? 'justify-end'
                      : card.kind === 'extra'
                        ? 'justify-start'
                        : 'justify-center'
                  "
                >
                  <div
                    class="flex w-[92%] sm:w-4/5 items-center gap-2 rounded-lg border p-2"
                    :class="[
                      card.style,
                      { 'flex-row-reverse': card.kind === 'missing' },
                    ]"
                  >
                    <NuxtLink
                      :to="'/card/' + card.oracleId"
                      :aria-label="card.name"
                      target="_blank"
                      class="min-w-0 flex-1 flex items-center gap-2 hover:underline"
                      :class="{
                        'flex-row-reverse text-right': card.kind === 'missing',
                      }"
                    >
                      <span
                        class="flex w-10 aspect-[5/7] shrink-0 items-center justify-center overflow-hidden rounded bg-muted"
                      >
                        <img
                          v-if="imageUrl(card.oracleId)"
                          :src="imageUrl(card.oracleId)"
                          :alt="card.name"
                          width="146"
                          height="204"
                          loading="lazy"
                          class="h-full w-full object-contain"
                          @error="imageFailed"
                        />
                        <UIcon
                          v-else
                          name="i-lucide-image"
                          class="size-5 text-muted"
                          aria-label="Image unavailable"
                        />
                      </span>
                      <span class="min-w-0 flex-1">
                        <span class="block text-sm font-medium">{{
                          card.name
                        }}</span>
                        <span class="block text-xs">
                          {{
                            card.kind === 'count'
                              ? 'Yours: ' +
                                card.current +
                                ' → Compared: ' +
                                card.quantity
                              : card.quantity +
                                (card.quantity === 1 ? ' copy' : ' copies')
                          }}
                        </span>
                        <span
                          v-if="card.kind === 'count' && card.commander"
                          class="block text-xs"
                        >
                          Commanders stay at one copy.
                        </span>
                      </span>
                    </NuxtLink>
                    <UButton
                      v-if="card.kind !== 'both'"
                      :icon="
                        card.kind === 'missing'
                          ? 'i-lucide-plus'
                          : card.kind === 'extra'
                            ? 'i-lucide-minus'
                            : 'i-lucide-equal'
                      "
                      :aria-label="
                        (card.kind === 'missing'
                          ? 'Add '
                          : card.kind === 'extra'
                            ? 'Remove '
                            : 'Match count for ') + card.name
                      "
                      :title="
                        card.kind === 'count'
                          ? 'Match compared count'
                          : undefined
                      "
                      :color="card.color"
                      variant="soft"
                      size="sm"
                      class="shrink-0"
                      :disabled="
                        pendingIds.has(card.oracleId) ||
                        loading ||
                        (card.kind === 'count' && card.commander)
                      "
                      @click="apply(card.kind, [card])"
                    />
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <p
            aria-live="polite"
            class="w-full border-t border-default pt-4 text-lg font-bold tabular-nums"
          >
            Your Deck has
            <span class="font-bold text-primary">{{ deckCardCount }}</span>
            cards
          </p>
          <p role="status" class="min-h-5 text-sm text-muted">
            {{
              busy && !comparing
                ? 'Saving deck changes…'
                : sections.every(
                      (section) =>
                        section.kind === 'both' || !section.cards.length,
                    )
                  ? 'The cards and counts match.'
                  : ''
            }}
          </p>
        </template>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import type { Card, ScryfallCard } from '~/models/cardModel';
import { getCardImageUrl, type CardImageSize } from '~/utils/scryfall';
import { GetPublicDecklistResponseSchema } from '~/models/cardListModel';

type Board = 'Mainboard' | 'Sideboard' | 'Considering';
type Entry = {
  oracleId: string;
  name: string;
  quantity: number;
  current?: number;
  commander?: boolean;
};
type Action = 'missing' | 'extra' | 'count';
const show = ref<Action | 'both' | 'all' | 'differences'>('differences');
const props = defineProps<{
  listId: string;
  cards: Card[];
  items: {
    oracle_id: string | null;
    board: string;
    num_copies: number | null;
    is_commander: boolean | null;
  }[];
  loading: boolean;
}>();
const open = defineModel<boolean>('open', { default: false });
const boards: Board[] = ['Mainboard', 'Sideboard', 'Considering'];
const board = ref<Board>('Mainboard');
const input = ref('');
const reference = ref<Entry[] | null>(null);
const previewCard = ref<Entry | null>(null);
const sourceName = ref('Pasted deck');
const error = ref('');
const parseWarning = ref('');
const busy = ref(false);
const pendingCards = ref<Entry[] | null>(null);
const pendingIds = ref(new Set<string>());
let queuedSaves = 0;
let saveQueue = Promise.resolve();
const comparing = ref(false);
const needsRefresh = ref(false);
const toast = useToast();
const config = useRuntimeConfig();
const queryClient = useQueryClient();
const {
  addCardsByNameToListMutation,
  removeCardFromListMutation,
  updateNumCopiesMutation,
} = useCardLists();
const { data: names, isLoading: namesLoading } = useCardNames(open);
const { data: ids, isLoading: idsLoading } = useCardNameToOracleId(open);
const catalogLoading = computed(() => namesLoading.value || idsLoading.value);
const normalize = (name: string) =>
  name.normalize('NFKC').replace(/[‘’]/g, "'").trim().toLowerCase();
const catalog = computed(() => {
  const byName = new Map<string, Omit<Entry, 'quantity'>>();
  const byId = new Map<string, Omit<Entry, 'quantity'>>();
  for (const name of names.value ?? []) {
    const oracleId = ids.value?.[name.toLowerCase()];
    if (!oracleId) continue;
    const card = { name, oracleId };
    byName.set(normalize(name), card);
    byId.set(oracleId, card);
  }
  for (const card of byId.values()) {
    const front = normalize(card.name.split(' // ')[0]);
    if (!byName.has(front)) byName.set(front, card);
  }
  return { byName, byId };
});
const currentNames = computed(
  () =>
    new Map(
      props.cards.map(({ card_data }) => [card_data.oracle_id, card_data.name]),
    ),
);
const current = computed<Entry[]>(() =>
  props.items
    .filter((item) => item.board === board.value && item.oracle_id)
    .map((item) => ({
      oracleId: item.oracle_id!,
      name:
        currentNames.value.get(item.oracle_id!) ??
        catalog.value.byId.get(item.oracle_id!)?.name ??
        item.oracle_id!,
      quantity: item.num_copies ?? 1,
      commander: item.is_commander ?? false,
    })),
);
// Include every board, substituting immediate edits on the compared board.
const deckCardCount = computed(
  () =>
    props.items
      .filter((item) => item.board !== board.value)
      .reduce((total, item) => total + (item.num_copies ?? 1), 0) +
    (pendingCards.value ?? current.value).reduce(
      (total, card) => total + card.quantity,
      0,
    ),
);
const sections = computed(() => {
  const ours = new Map(
    (pendingCards.value ?? current.value).map((card) => [card.oracleId, card]),
  );
  const theirs = new Map(
    (reference.value ?? []).map((card) => [card.oracleId, card]),
  );
  const sort = (cards: Entry[]) =>
    cards.sort((a, b) => a.name.localeCompare(b.name));
  return [
    {
      kind: 'missing' as const,
      title: 'Missing from your deck',
      color: 'success' as const,
      style: 'border-green-500/50 bg-green-500/10',
      cards: sort(
        [...theirs.values()].filter((card) => !ours.has(card.oracleId)),
      ),
    },
    {
      kind: 'extra' as const,
      title: 'Only in your deck',
      color: 'error' as const,
      style: 'border-red-500/50 bg-red-500/10',
      cards: sort(
        [...ours.values()].filter((card) => !theirs.has(card.oracleId)),
      ),
    },
    {
      kind: 'count' as const,
      title: 'Different copy counts',
      color: 'warning' as const,
      style: 'border-yellow-500/50 bg-yellow-500/10',
      cards: sort(
        [...theirs.values()]
          .filter(
            (card) =>
              ours.has(card.oracleId) &&
              ours.get(card.oracleId)!.quantity !== card.quantity,
          )
          .map((card) => ({
            ...card,
            current: ours.get(card.oracleId)!.quantity,
            commander: ours.get(card.oracleId)!.commander,
          })),
      ),
    },
    {
      kind: 'both' as const,
      title: 'In Both Decks',
      color: 'neutral' as const,
      style: 'border-neutral-500/50 bg-neutral-500/10',
      cards: sort(
        [...theirs.values()].filter(
          (card) => ours.get(card.oracleId)?.quantity === card.quantity,
        ),
      ),
    },
  ];
});
const differences = computed(() =>
  sections.value
    .flatMap(({ cards, ...section }) =>
      cards.map((card) => ({ ...card, ...section })),
    )
    .sort((a, b) => a.name.localeCompare(b.name)),
);
const visibleCards = computed(() =>
  differences.value.filter(
    (card) =>
      show.value === 'all' ||
      (show.value === 'differences'
        ? card.kind !== 'both'
        : card.kind === show.value),
  ),
);
const showOptions = computed(() => {
  const count = (kind: Action | 'both') =>
    sections.value.find((section) => section.kind === kind)?.cards.length ?? 0;
  return [
    { value: 'all', label: 'All (' + differences.value.length + ')' },
    {
      value: 'differences',
      label: 'Differences (' + (differences.value.length - count('both')) + ')',
    },
    { value: 'extra', label: 'Only in Your Deck (' + count('extra') + ')' },
    { value: 'count', label: 'Different Copy Counts (' + count('count') + ')' },
    {
      value: 'missing',
      label: 'Missing in Your Deck (' + count('missing') + ')',
    },
    { value: 'both', label: 'In Both Decks (' + count('both') + ')' },
  ];
});
// Hydrate once per compared list, rather than making a Scryfall API lookup
// for every thumbnail or refetching as cards move out of the diff.
const referenceIds = computed(() =>
  (reference.value ?? []).map((card) => card.oracleId).sort(),
);
const {
  data: referenceCards,
  error: imagesError,
  isFetching: imagesFetching,
  refetch: refetchImages,
} = useQuery({
  queryKey: computed(() => ['compare-card-images', referenceIds.value]),
  queryFn: () =>
    $fetch<ScryfallCard[]>(
      config.public.backendUrl + '/cards/cards-by-oracle-ids',
      {
        method: 'POST',
        body: { oracleIds: referenceIds.value },
      },
    ),
  enabled: computed(() => open.value && referenceIds.value.length > 0),
  staleTime: 1000 * 60 * 10,
});
const imageCards = computed(
  () =>
    new Map([
      ...(referenceCards.value ?? []).map(
        (card) => [card.oracle_id, card] as const,
      ),
      ...props.cards.map(
        ({ card_data }) => [card_data.oracle_id, card_data] as const,
      ),
    ]),
);
const failedImages = ref(new Set<string>());
function imageFailed(event: Event) {
  failedImages.value.add((event.target as HTMLImageElement).src);
}
function imageUrl(oracleId: string, size: CardImageSize = 'small') {
  const card = imageCards.value.get(oracleId);
  const url = card ? getCardImageUrl(card, false, size) : '';
  return failedImages.value.has(url) ? '' : url;
}
watch([input, board], () => {
  previewCard.value = null;
  parseWarning.value = '';
  reference.value = null;
  error.value = '';
});

function parseDeck(text: string): Entry[] {
  const headers: Record<string, Board> = {
    deck: 'Mainboard',
    mainboard: 'Mainboard',
    commander: 'Mainboard',
    commanders: 'Mainboard',
    sideboard: 'Sideboard',
    considering: 'Considering',
    maybeboard: 'Considering',
  };
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const headerName = (line: string) =>
    line
      .replace(/^[#\[]+|[\]:]+$/g, '')
      .trim()
      .toLowerCase();
  // A full export starts in Mainboard; a plain list targets the chosen board.
  let selected: Board = lines.some(
    (line) => headers[headerName(line)] || /^SB:\s*/i.test(line),
  )
    ? 'Mainboard'
    : board.value;
  const cards = new Map<string, Entry>();
  const unknown: string[] = [];
  for (let line of lines) {
    if (!line || line.startsWith('//')) continue;
    const header = headerName(line);
    if (headers[header]) {
      selected = headers[header];
      continue;
    }
    if (line.startsWith('#')) continue;
    const sideboard = /^SB:\s*/i.test(line);
    line = line.replace(/^SB:\s*/i, '');
    if ((sideboard ? 'Sideboard' : selected) !== board.value) continue;
    const match = line.match(/^(\d+)x?\s+(.+)$/i);
    const quantity = match ? Number(match[1]) : 1;
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100)
      throw new Error('Copy counts must be between 1 and 100.');
    const name = (match?.[2] ?? line)
      .replace(/^\[[^\]]+\]\s*/, '')
      .replace(/\s+\([a-z0-9]+\)\s+[a-z0-9-]+(?:\s+\*F\*)?$/i, '');
    const card = catalog.value.byName.get(normalize(name));
    if (!card) {
      unknown.push(name);
      continue;
    }
    const count = (cards.get(card.oracleId)?.quantity ?? 0) + quantity;
    if (count > 100)
      throw new Error(
        'Combined copy counts cannot exceed 100 for ' + card.name + '.',
      );
    cards.set(card.oracleId, { ...card, quantity: count });
  }
  if (unknown.length)
    parseWarning.value = 'Unrecognized cards (skipped): ' + unknown.join(', ');
  if (!cards.size && unknown.length)
    throw new Error('No recognized cards found for ' + board.value + '.');
  if (!cards.size)
    throw new Error(
      'No cards found for ' +
        board.value +
        '. Choose another board or paste a decklist.',
    );
  return [...cards.values()];
}

async function compare() {
  if (busy.value) return;
  busy.value = comparing.value = true;
  show.value = 'differences';
  parseWarning.value = '';
  reference.value = null;
  error.value = '';
  try {
    if (needsRefresh.value) {
      await queryClient.refetchQueries(
        { queryKey: ['list-items', props.listId] },
        { throwOnError: true },
      );
      needsRefresh.value = false;
    }
    if (!catalog.value.byId.size)
      throw new Error(
        'Card names could not be loaded. Reopen this dialog to retry.',
      );
    const text = input.value.trim();
    if (/^(https?:\/\/|(?:www\.)?cardmystic\.com\/)/i.test(text)) {
      const url = new URL(
        /^https?:\/\//i.test(text) ? text : 'https://' + text,
      );
      const id = url.pathname.match(
        /^\/lists\/([0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12})\/?$/i,
      )?.[1];
      if (
        ![
          'cardmystic.com',
          'www.cardmystic.com',
          'next.cardmystic.com',
        ].includes(url.hostname) ||
        !id ||
        url.username ||
        url.password
      ) {
        throw new Error(
          'Use a CardMystic deck URL such as https://cardmystic.com/lists/…',
        );
      }
      const response = await fetch(
        config.public.backendUrl + '/supabase/card-lists/view/' + id,
      );
      if (!response.ok)
        throw new Error(
          response.status === 404
            ? 'That deck is private or unavailable. Paste its decklist instead.'
            : 'Could not load that deck. Try again.',
        );
      const deck = GetPublicDecklistResponseSchema.parse(await response.json());
      const unknown: string[] = [];
      const recognized = deck.items
        .filter((item) => item.board === board.value)
        .flatMap((item) => {
          const card = catalog.value.byId.get(item.oracle_id);
          if (!card) {
            unknown.push(item.oracle_id);
            return [];
          }
          return [{ ...card, quantity: item.num_copies }];
        });
      if (unknown.length)
        parseWarning.value =
          'Cards missing from the catalog (skipped): ' + unknown.join(', ');
      if (!recognized.length)
        throw new Error('No recognized cards found for ' + board.value + '.');
      reference.value = recognized;
      sourceName.value = deck.decklist.name ?? 'Compared deck';
    } else {
      reference.value = parseDeck(text);
      sourceName.value = 'Pasted deck';
    }
  } catch (cause) {
    reference.value = null;
    error.value =
      cause instanceof Error ? cause.message : 'Could not compare decks.';
  } finally {
    busy.value = comparing.value = false;
  }
}

async function apply(action: Action, entries: Entry[]) {
  if (comparing.value || needsRefresh.value || props.loading) return;
  entries = entries.filter(
    (card) =>
      !pendingIds.value.has(card.oracleId) &&
      (action !== 'count' || !card.commander),
  );
  if (!entries.length) return;
  queuedSaves++;
  busy.value = true;
  error.value = '';
  const nextCards = new Map(
    (pendingCards.value ?? current.value).map((card) => [card.oracleId, card]),
  );
  for (const card of entries) {
    pendingIds.value.add(card.oracleId);
    if (action === 'extra') nextCards.delete(card.oracleId);
    else nextCards.set(card.oracleId, card);
  }
  pendingCards.value = [...nextCards.values()];
  const target =
    entries.length === 1 ? entries[0].name : entries.length + ' cards';
  const notification = toast.add({
    title:
      (action === 'missing'
        ? 'Adding '
        : action === 'extra'
          ? 'Removing '
          : 'Updating ') +
      target +
      '…',
    description: 'Saving changes to ' + board.value + '.',
    color: 'info',
    duration: 0,
  });

  // Accept clicks immediately, but serialize writes to avoid lost updates.
  const previousSave = saveQueue;
  let release!: () => void;
  saveQueue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previousSave;
  let actionError = '';
  try {
    if (needsRefresh.value)
      throw new Error('Reload the comparison before making more changes.');
    if (action === 'missing') {
      const result = await addCardsByNameToListMutation.mutateAsync({
        listId: props.listId,
        board: board.value,
        cardNames: entries.map((card) => card.quantity + ' ' + card.name),
      });
      if (result?.invalidCardNames.length)
        actionError = 'Not added: ' + result.invalidCardNames.join(', ');
    } else if (action === 'extra') {
      await removeCardFromListMutation.mutateAsync({
        listId: props.listId,
        oracleId: entries.map((card) => card.oracleId),
        board: board.value,
      });
    } else {
      for (const card of entries) {
        await updateNumCopiesMutation.mutateAsync({
          listId: props.listId,
          cardName: card.name,
          numCopies: card.quantity,
          fromBoard: board.value,
        });
      }
    }
  } catch (cause) {
    actionError =
      (cause instanceof Error
        ? cause.message
        : 'Could not update every card.') +
      ' Review the remaining differences and try again.';
  } finally {
    try {
      // Reuse the mutation's in-flight refresh rather than canceling/restarting it.
      await queryClient.refetchQueries(
        { queryKey: ['list-items', props.listId] },
        { throwOnError: true, cancelRefetch: false },
      );
      await nextTick();
      // Reconcile only this action; retain optimistic changes queued behind it.
      const saved = new Map(current.value.map((card) => [card.oracleId, card]));
      const next = new Map(
        (pendingCards.value ?? []).map((card) => [card.oracleId, card]),
      );
      for (const card of entries) {
        const actual = saved.get(card.oracleId);
        if (actual) next.set(card.oracleId, actual);
        else next.delete(card.oracleId);
      }
      pendingCards.value = [...next.values()];
    } catch {
      needsRefresh.value = true;
      reference.value = null;
      actionError =
        'Could not refresh your deck. Click Compare to reload it before making more changes.';
    } finally {
      for (const card of entries) pendingIds.value.delete(card.oracleId);
      queuedSaves--;
      busy.value = queuedSaves > 0;
      if (!busy.value) pendingCards.value = null;
      if (actionError) error.value = actionError;
      toast.update(notification.id, {
        title: actionError
          ? 'Review deck changes'
          : (action === 'missing'
              ? 'Added '
              : action === 'extra'
                ? 'Removed '
                : 'Updated ') + target,
        description: actionError || 'Saved to ' + board.value + '.',
        color: actionError ? 'error' : 'success',
        duration: 5000,
      });
      release();
    }
  }
}
async function copyNames(cards: Entry[]) {
  try {
    await navigator.clipboard.writeText(
      cards.map((card) => card.name).join('\n'),
    );
    toast.add({ title: 'Card names copied', color: 'success' });
  } catch {
    toast.add({ title: 'Could not copy card names', color: 'error' });
  }
}
</script>
