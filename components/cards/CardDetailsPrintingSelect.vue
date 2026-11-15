<script setup lang="ts">
import { cardActionStyles } from '~/utils/card-actions';
import {
  readGuestDefaultPrinting,
  saveGuestDefaultPrinting,
} from '~/utils/guestDefaultPrinting';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import type { ScryfallCard } from '~/models/cardModel';
import type { Printing, Finish } from '~/utils/printings';

// The card page follows the default. Other callers only edit the preference.
const props = defineProps<{ card: ScryfallCard; current?: ScryfallCard }>();
const emit = defineEmits<{ select: [card: ScryfallCard | null] }>();
const client = useQueryClient();
const open = ref(false);
let trigger: HTMLElement | null = null;

function openPicker(event: MouseEvent) {
  trigger = event.currentTarget as HTMLElement;
  open.value = true;
}

async function closePicker() {
  open.value = false;
  await nextTick();
  // The nested dialog releases its focus trap after unmount.
  setTimeout(() => trigger?.focus({ preventScroll: true }), 0);
}

const db = useSupabase();
const { userProfile, loading: loadingUser } = useUserProfile();
type Preference = { printingId: string; finish: Finish };
const preferenceKey = computed(
  () =>
    [
      'default-printing',
      userProfile.value?.id ?? null,
      props.card.oracle_id,
    ] as const,
);

const preference = useQuery({
  queryKey: preferenceKey,
  enabled: computed(
    () => userProfile.value !== undefined && (!!props.current || open.value),
  ),
  queryFn: async ({
    queryKey: [, userId, oracleId],
  }): Promise<Preference | null> => {
    if (!userId) return readGuestDefaultPrinting(props.card.name) ?? null;
    const { data, error } = await db
      .from('user_default_printings')
      .select('printing_id,finish')
      .eq('user_id', userId)
      .eq('oracle_id', oracleId)
      .maybeSingle();
    if (error) throw new Error('Could not load your default printing.');
    return data
      ? { printingId: data.printing_id, finish: data.finish as Finish }
      : null;
  },
});

async function loadCard(source: ScryfallCard, printingId: string) {
  if (printingId === source.id) return source;
  try {
    return await client.fetchQuery({
      queryKey: ['card-printing-details', printingId],
      staleTime: 10 * 60_000,
      retry: false,
      queryFn: async () => {
        const result = await $fetch<ScryfallCard>(
          `https://api.scryfall.com/cards/${printingId}`,
          { signal: AbortSignal.timeout(10000) },
        );
        if (result.id !== printingId || result.oracle_id !== source.oracle_id)
          throw new Error('Printing does not match this card.');
        return result;
      },
    });
  } catch {
    throw new Error('Could not load this printing. Try again.');
  }
}

watch(
  [preference.data, preferenceKey, preference.isPending, loadingUser],
  async ([choice], _, onCleanup) => {
    if (!props.current) return;
    if (
      loadingUser.value ||
      (userProfile.value !== undefined && preference.isPending.value)
    ) {
      emit('select', null);
      return;
    }
    let current = true;
    onCleanup(() => {
      current = false;
    });
    const source = props.card;
    if (!choice) {
      emit('select', source);
      return;
    }
    try {
      const card = await loadCard(source, choice.printingId);
      if (current) emit('select', { ...card, selected_finish: choice.finish });
    } catch {
      // The saved default still applies to new deck entries when art is unavailable.
      if (current) emit('select', source);
    }
  },
  { immediate: true },
);

async function select(printing: Printing | null, finish: Finish | null) {
  const key = preferenceKey.value;
  const [, userId, oracleId] = key;
  const source = props.card;
  const choice =
    printing && finish ? { printingId: printing.id, finish } : null;
  if (choice && props.current) await loadCard(source, choice.printingId);
  if (key !== preferenceKey.value || userProfile.value === undefined)
    throw new Error('Your session changed. Try again.');
  if (userId) {
    const table = db.from('user_default_printings');
    const { error } = choice
      ? await table.upsert(
          {
            user_id: userId,
            oracle_id: oracleId,
            printing_id: choice.printingId,
            finish: choice.finish,
          },
          { onConflict: 'user_id,oracle_id' },
        )
      : await table.delete().eq('user_id', userId).eq('oracle_id', oracleId);
    if (error)
      throw new Error('Could not save your default printing. Try again.');
  } else {
    saveGuestDefaultPrinting(source.name, choice);
  }
  await client.cancelQueries({ queryKey: key, exact: true });
  client.setQueryData(key, choice);
  await cacheSearchPrintingChoice(client, userId, source, printing, finish);
  await closePicker();
}
</script>

<template>
  <UButton
    :label="current ? 'Choose Default Printing' : 'Set Default Printing'"
    aria-haspopup="dialog"
    :aria-expanded="open"
    :disabled="userProfile === undefined"
    v-bind="cardActionStyles.printing"
    :variant="current ? 'outline' : 'ghost'"
    :size="current ? undefined : 'sm'"
    :block="!!current"
    @click="openPicker"
  />
  <LazyPrintingPicker
    v-if="open"
    :oracle-id="card.oracle_id"
    :name="card.name"
    :selected-id="preference.data.value?.printingId ?? current?.id"
    :selected-finish="preference.data.value?.finish ?? current?.selected_finish"
    :save="select"
    description="Set the default printing to use whenever this card gets added to a deck."
    reset-label="Clear default printing"
    save-label="Set Default Printing"
    :show-reset="!!preference.data.value"
    @close="closePicker"
  />
</template>
