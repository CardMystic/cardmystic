<script setup lang="ts">
defineOptions({ name: 'BrowserDeckPage' });
import {
  emptyGuestDeck,
  guestDeckEntries,
  GUEST_RETURN_KEY,
} from '~/utils/guestDeck';
import { BROWSER_DECK_ID } from '~/composables/useBrowserDeckSource';
const source = provideBrowserDeckSource();
const { draft, activeIndex, draftOptions, ready, storageError, persist } =
  source;
const { userProfile } = useUserProfile();
const {
  createListMutation,
  bulkEditListMutation,
  updateListMutation,
  updateListAvatarMutation,
} = useCardLists();
const saving = ref(false);
const message = ref('');
const visibility = ref<'public' | 'private'>('public');
const visibilityOptions = [
  { label: 'Public', value: 'public' as const },
  { label: 'Private', value: 'private' as const },
];
watch(activeIndex, () => {
  visibility.value = 'public';
});
const total = computed(() =>
  draft.value.cards.reduce((total, card) => total + card.quantity, 0),
);
useSeoMeta({
  title: 'Build a deck - CardMystic',
  description:
    'Build a Magic: The Gathering deck in your browser. Sign in to save your deck.',
});
useCanonicalUrl('/build');
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
        description: draft.value.description,
        visibility: visibility.value,
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
    await updateListMutation.mutateAsync({
      listId: pending.listId,
      updates: {
        description: draft.value.description,
        bracket: draft.value.bracket,
      },
    });
    if (draft.value.avatarCardName)
      await updateListAvatarMutation.mutateAsync({
        listId: pending.listId,
        cardName: draft.value.avatarCardName,
      });
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
  <div class="w-full">
    <div
      class="my-4 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-info/30 bg-info/10 p-4"
      role="note"
    >
      <p class="text-sm">
        This deck is saved in your browser, We cannot control if it gets
        deleted. Sign in to save your deck.
      </p>
      <UButton
        v-if="!userProfile"
        label="Sign in"
        icon="i-lucide-log-in"
        class="shrink-0"
        @click="signIn"
      />
      <div v-else class="flex shrink-0 flex-wrap items-center gap-2">
        <USelect
          v-if="!draft.pendingSave"
          v-model="visibility"
          :items="visibilityOptions"
          :disabled="saving"
          aria-label="Deck visibility"
        />
        <UButton
          :label="
            draft.pendingSave ? 'Retry saving deck' : 'Save deck to account'
          "
          :loading="saving"
          :disabled="!ready || !total"
          @click="save"
        />
      </div>
    </div>
    <UAlert
      v-if="storageError"
      color="warning"
      :description="storageError"
      class="mb-4"
    />
    <UAlert v-if="message" color="error" :description="message" class="mb-4" />
    <ClientOnly>
      <template v-if="ready">
        <UFormField
          v-if="draftOptions.length > 1"
          label="Browser draft"
          class="mb-4"
        >
          <USelect
            v-model="activeIndex"
            :items="draftOptions"
            :disabled="saving"
            class="w-full sm:max-w-sm"
            @update:model-value="message = ''"
          />
        </UFormField>
        <UAlert
          v-if="draft.pendingSave"
          color="warning"
          description="Saving started but did not finish. Retry saving to finish moving this draft to your account."
          class="mb-4"
        />
        <UAlert
          v-if="source.error.value"
          color="error"
          title="Could not load your draft’s cards"
          class="mb-4"
          :actions="[{ label: 'Retry', onClick: () => source.retry() }]"
        />
        <div :inert="saving">
          <DeckEditor :key="activeIndex" :list-id="BROWSER_DECK_ID" />
        </div>
      </template>
      <template #fallback><CardListResultsSkeleton view="grid" /></template>
    </ClientOnly>
  </div>
</template>
