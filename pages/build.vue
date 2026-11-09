<script setup lang="ts">
import { getPartnerType, getValidPartners } from '~/utils/partnerCommanders';
import { CardListFormatSchema } from '~/models/cardListModel';
import { groupAndSortCards } from '~/utils/sort';
import { exportDeck } from '~/utils/deckTransfer';
import {
  emptyGuestDeck,
  guestBoards,
  guestDeckEntries,
  GUEST_RETURN_KEY,
  setGuestCopies,
  type GuestBoard,
  type GuestDeck,
} from '~/utils/guestDeck';

defineOptions({ name: 'GuestDeckBuilder' });
useSeoMeta({
  title: 'Build a deck - CardMystic',
  description:
    'Try the Magic: The Gathering deck builder without an account. Add cards, choose a commander, and save your deck after signing in.',
});
useCanonicalUrl('/build');
const {
  draft,
  activeIndex,
  draftOptions,
  ready,
  storageError,
  edit,
  addNames,
  persist,
} = useGuestDeck();
const { userProfile } = useUserProfile();
const { createListMutation, bulkEditListMutation } = useCardLists();
const { data: cardNames } = useCardNames();
const { data: partners } = usePartnerCommanders();
const names = computed(() => [
  ...new Set(draft.value.cards.map((card) => card.name)),
]);
const { cards, isLoading, error: cardsError, refetch } = useCardsByName(names);
const search = ref('');
const selected = ref<string>();
const message = ref('');
const saving = ref(false);
const view = ref<'grid' | 'text'>('grid');
const group = ref('type');
const sort = ref('name');
const formats = CardListFormatSchema.options;
const locked = computed(() => saving.value || !!draft.value.pendingSave);
const total = computed(() =>
  draft.value.cards.reduce((sum, card) => sum + card.quantity, 0),
);
const options = computed(() =>
  search.value.length < 2
    ? []
    : (cardNames.value ?? [])
        .filter((name) =>
          name.toLowerCase().includes(search.value.toLowerCase()),
        )
        .slice(0, 50),
);
const name = computed({
  get: () => draft.value.name,
  set: (value) =>
    change((next) => {
      next.name = value;
    }),
});
const format = computed({
  get: () => draft.value.format,
  set: (value) =>
    change((next) => {
      next.format = value;
      if (value !== 'Commander') next.commanders = [];
    }),
});
const groups = computed(() =>
  Object.fromEntries(
    guestBoards.map((board) => [
      board,
      groupAndSortCards(
        (cards.value ?? []).filter((card) =>
          draft.value.cards.some(
            (entry) =>
              entry.board === board && entry.name === card.card_data.name,
          ),
        ),
        group.value === 'none' ? null : group.value,
        sort.value,
        'asc',
      ),
    ]),
  ),
);
const copies = computed(() =>
  Object.fromEntries(
    guestBoards.map((board) => [
      board,
      Object.fromEntries(
        (cards.value ?? []).flatMap((card) => {
          const entry = draft.value.cards.find(
            (entry) =>
              entry.board === board && entry.name === card.card_data.name,
          );
          return entry
            ? [[card.card_data.oracle_id, { num_copies: entry.quantity }]]
            : [];
        }),
      ),
    ]),
  ),
);
const commanderIds = computed(() =>
  (cards.value ?? [])
    .filter((card) => draft.value.commanders.includes(card.card_data.name))
    .map((card) => card.card_data.oracle_id),
);

function change(action: (next: GuestDeck) => void) {
  message.value = '';
  try {
    edit(action);
  } catch (error) {
    message.value =
      error instanceof Error ? error.message : 'Could not update your draft.';
  }
}
function addCard(value: string) {
  if (!value) return;
  message.value = '';
  try {
    addNames([value]);
    selected.value = undefined;
    search.value = '';
  } catch (error) {
    message.value =
      error instanceof Error ? error.message : 'Could not add card.';
  }
}
function removeCard(id: string, board: GuestBoard) {
  const card = cards.value?.find((card) => card.card_data.oracle_id === id);
  if (card)
    change((next) => setGuestCopies(next, card.card_data.name, board, 0));
}
function moveCard(cardName: string, board: GuestBoard, from: GuestBoard) {
  change((next) => {
    const source = next.cards.find(
      (card) => card.name === cardName && card.board === from,
    );
    if (!source) return;
    const count =
      source.quantity +
      (next.cards.find((card) => card.name === cardName && card.board === board)
        ?.quantity ?? 0);
    setGuestCopies(next, cardName, from, 0);
    setGuestCopies(next, cardName, board, count);
  });
}
function setCommander(cardName: string) {
  change((next) => {
    if (!next.commanders.includes(cardName)) {
      if (next.commanders.length === 1) {
        const first = next.commanders[0];
        const partnerType =
          partners.value && getPartnerType(first, partners.value);
        if (
          !partners.value ||
          !partnerType ||
          !getValidPartners(partnerType, partners.value, first).includes(
            cardName,
          )
        ) {
          throw new Error(
            'These commanders cannot be paired. Remove the current commander first.',
          );
        }
      }
      if (next.commanders.length === 2)
        throw new Error('Remove a commander before choosing another.');
      next.commanders.push(cardName);
    }
    setGuestCopies(next, cardName, 'Mainboard', 1);
  });
}
function clearCommander(id: string) {
  const card = cards.value?.find((card) => card.card_data.oracle_id === id);
  if (card)
    change((next) => {
      next.commanders = next.commanders.filter(
        (name) => name !== card.card_data.name,
      );
    });
}
function download() {
  const text = exportDeck(
    draft.value.cards.map((card) => ({
      ...card,
      commander:
        draft.value.commanders.includes(card.name) &&
        card.board === 'Mainboard',
    })),
    'csv',
  );
  const url = URL.createObjectURL(
    new Blob([text], { type: 'text/csv;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `${draft.value.name || 'deck'}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function signIn() {
  try {
    sessionStorage.setItem(GUEST_RETURN_KEY, 'true');
  } catch {
    /* The draft remains accessible at /build. */
  }
  navigateTo('/user/login?redirect=/build');
}
async function save() {
  const userId = userProfile.value?.id;
  if (!userId || saving.value || !total.value) return;
  saving.value = true;
  message.value = '';
  try {
    let pending = draft.value.pendingSave;
    if (pending && pending.userId !== userId)
      throw new Error(
        'Sign in with the account that started saving this draft to finish saving it.',
      );
    if (!pending) {
      const result = await createListMutation.mutateAsync({
        name: draft.value.name.trim() || 'My first deck',
        format: draft.value.format,
        visibility: 'private',
        commanders: draft.value.commanders,
      });
      if (!result?.id)
        throw new Error(
          'Could not create your deck. Your browser draft is still here.',
        );
      pending = { userId, listId: result.id };
      persist({ ...draft.value, pendingSave: pending });
    }
    const result = await bulkEditListMutation.mutateAsync({
      listId: pending.listId,
      entries: guestDeckEntries(draft.value),
    });
    if (result.invalidCardNames.length)
      throw new Error(
        `Could not save: ${result.invalidCardNames.join(', ')}. Your browser draft has been kept.`,
      );
    const listId = pending.listId;
    persist(emptyGuestDeck());
    await navigateTo(`/lists/${listId}`);
  } catch (error) {
    message.value =
      error instanceof Error
        ? error.message
        : 'Could not save your deck. Your browser draft is still here.';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <UContainer class="py-6 space-y-5 max-w-[2000px]">
    <h1 class="text-2xl font-bold">Build a deck</h1>
    <p class="text-muted">
      Build up to three decks without an account. Your drafts are saved only in
      this browser; clearing browser data removes them. Sign in to save
      unlimited decks and collections to your account.
    </p>
    <ClientOnly>
      <template v-if="ready">
        <UAlert
          v-if="storageError"
          color="warning"
          :description="storageError"
        />
        <UAlert v-if="message" color="error" :description="message" />
        <UFormField label="Browser draft">
          <USelect
            v-model="activeIndex"
            :items="draftOptions"
            :disabled="saving"
            class="w-full sm:max-w-sm"
            @update:model-value="
              message = '';
              search = '';
              selected = undefined;
            "
          />
        </UFormField>
        <UAlert
          v-if="draft.pendingSave"
          color="info"
          description="Saving started. Retry saving to finish; your draft is kept here until every card is saved."
        />
        <div class="flex flex-wrap items-end gap-3">
          <UFormField label="Deck name" class="grow"
            ><UInput
              v-model="name"
              :disabled="locked"
              maxlength="200"
              class="w-full"
          /></UFormField>
          <UFormField label="Format"
            ><USelect v-model="format" :items="formats" :disabled="locked"
          /></UFormField>
          <UButton v-if="!userProfile" @click="signIn"
            >Sign in to save deck</UButton
          >
          <UButton v-else :disabled="!total" :loading="saving" @click="save">{{
            draft.pendingSave ? 'Retry saving deck' : 'Save deck to account'
          }}</UButton>
          <UButton variant="outline" :disabled="!total" @click="download"
            >Export deck</UButton
          >
        </div>
        <div class="flex flex-wrap items-end gap-3">
          <UFormField label="Add card" class="grow min-w-48"
            ><UInputMenu
              v-model="selected"
              v-model:search-term="search"
              :items="options"
              :disabled="locked"
              placeholder="Search card names..."
              class="w-full"
              @update:model-value="addCard"
          /></UFormField>
          <UButton to="/search/all/smart" variant="outline"
            >Find cards with Smart search</UButton
          >
          <UFormField label="View"
            ><USelect
              v-model="view"
              :items="[
                { label: 'Card grid', value: 'grid' },
                { label: 'Text', value: 'text' },
              ]"
          /></UFormField>
          <UFormField label="Group"
            ><USelect
              v-model="group"
              :items="[
                { label: 'Card type', value: 'type' },
                { label: 'None', value: 'none' },
              ]"
          /></UFormField>
          <UFormField label="Sort"
            ><USelect
              v-model="sort"
              :items="[
                { label: 'Name', value: 'name' },
                { label: 'Mana value', value: 'cmc' },
              ]"
          /></UFormField>
        </div>
        <p role="status">
          {{ total }} {{ total === 1 ? 'card' : 'cards' }} in browser draft
        </p>
        <SearchError v-if="cardsError" :error="cardsError" @retry="refetch()" />
        <CardListResults
          v-else
          :is-loading="isLoading"
          :is-owner="!locked"
          :groups="groups.Mainboard ?? null"
          :sideboard-groups="groups.Sideboard ?? null"
          :considering-groups="groups.Considering ?? null"
          :view="view"
          :format="draft.format"
          :list-items-map="copies"
          :commander-oracle-ids="commanderIds"
          @remove-card="removeCard"
          @set-commander="setCommander"
          @clear-commander="clearCommander"
          @change-board="moveCard"
          @update-num-copies="
            (name, count, board) =>
              change((next) => setGuestCopies(next, name, board, count))
          "
        />
      </template>
      <template #fallback
        ><p class="min-h-48">Loading your browser draft…</p></template
      >
    </ClientOnly>
  </UContainer>
</template>
