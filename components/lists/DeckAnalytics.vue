<script setup lang="ts">
import {
  chanceAtLeast,
  drawDistribution,
  type DeckAnalytics,
} from '~/utils/deckAnalytics';

const props = defineProps<{
  listId: string;
  revision: string;
  isOwner: boolean;
  initialData?: DeckAnalytics;
}>();
const api = useLibraryApi();
const browser = useBrowserDeckSource();
const config = useRuntimeConfig();
const error = ref('');
const data = ref<DeckAnalytics | undefined>(props.initialData);
const costLimit = ref(5);
const target = ref('type:Creature');
let sequence = 0;
let disposed = false;
const cutting = ref<string | null>(null);

async function load() {
  if (disposed) return;
  const current = ++sequence;
  error.value = '';
  try {
    const result = browser
      ? await $fetch<DeckAnalytics>(
          `${config.public.backendPath}/cards/deck-analytics`,
          {
            method: 'POST',
            body: {
              items: browser.items.value.map((item) => ({
                oracle_id: item.oracle_id,
                board: item.board,
                num_copies: item.num_copies,
                is_commander: item.is_commander,
              })),
            },
          },
        )
      : await api.request<DeckAnalytics>(`/lists/${props.listId}/analytics`);
    if (current === sequence) {
      data.value = result;
      if (!targets.value.some((row) => row.value === target.value))
        target.value = 'type:Creature';
    }
  } catch (cause) {
    if (current === sequence) error.value = (cause as Error).message;
  }
}
onMounted(() => {
  watch(
    [
      api.userId,
      api.ready,
      () => props.listId,
      () => props.revision,
      () => props.initialData,
    ],
    () => {
      // Wait for the confirmed delete; optimistic list changes precede the API write.
      if (cutting.value) return;
      sequence++;
      error.value = '';
      // The parent only supplies public stats for the current list revision.
      data.value = props.initialData;
      if (props.initialData && !api.userId.value) return;
      if (browser || api.ready.value) void load();
    },
    { immediate: true },
  );
});
onBeforeUnmount(() => {
  disposed = true;
  sequence++;
});

const librarySize = computed(() => data.value?.librarySize ?? 0);
const openingSize = computed(() => Math.min(7, librarySize.value));
const landCount = computed(
  () =>
    data.value?.types?.find((row) => row.name === 'Land')?.count ??
    (data.value?.lands ?? 0) + (data.value?.modalLands ?? 0),
);
const averageOpeningLands = computed(() =>
  librarySize.value
    ? (openingSize.value * landCount.value) / librarySize.value
    : 0,
);
const targets = computed(() => [
  ...(data.value?.types ?? []).map((row) => ({
    label: row.name,
    value: `type:${row.name}`,
    count: row.count,
  })),
  ...(data.value?.themes ?? []).map((row) => ({
    label: `Theme: ${row.name}`,
    value: `theme:${row.name}`,
    count: row.count,
  })),
  ...(data.value?.roles ?? []).map((row) => ({
    label: `Role: ${row.name}`,
    value: `role:${row.name}`,
    count: row.count,
  })),
]);
const selectedTarget = computed(() =>
  targets.value.find((row) => row.value === target.value),
);
const targetChance = computed(() =>
  chanceAtLeast(
    drawDistribution(
      librarySize.value,
      selectedTarget.value?.count ?? 0,
      openingSize.value,
    ),
    1,
  ),
);
const cutError = ref('');
const { removeCardFromListMutation } = useCardLists();
const cardEditToast = useCardEditToast();
async function cut(oracleId: string) {
  if (!props.isOwner || cutting.value) return;
  cutting.value = oracleId;
  cutError.value = '';
  cardEditToast.notify('removed');
  try {
    await removeCardFromListMutation.mutateAsync({
      listId: props.listId,
      oracleId,
      board: 'Mainboard',
    });
    await load();
  } catch (cause) {
    cutError.value = (cause as Error).message;
  } finally {
    cutting.value = null;
  }
}
const percent = (value: number) => `${(100 * value).toFixed(1)}%`;
const money = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    cents / 100,
  );
</script>

<template>
  <section class="space-y-6" aria-label="Advanced deck analytics">
    <DeckStatsSkeleton v-if="!data && !error" :is-owner="isOwner">
      <template #roles
        ><slot name="roles" :mainboard-roles="undefined" :pending="true"
      /></template>
      <template #tags><slot name="tags" /></template>
      <template #charts><slot name="charts" /></template>
    </DeckStatsSkeleton>
    <template v-else>
      <slot
        name="roles"
        :mainboard-roles="data?.mainboardRoles"
        :pending="false"
      />
      <slot name="tags" />
      <slot
        name="themes"
        :top-themes="data?.topThemes"
        :top-sets="browser ? undefined : data?.topSets"
      />
      <slot name="charts" />
    </template>
    <div v-if="error" role="alert" class="space-y-3">
      <p>{{ error }}</p>
      <UButton label="Retry analytics" variant="outline" @click="load" />
    </div>
    <template v-if="data">
      <dl class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="rounded-lg border border-default p-3">
          <dt class="text-sm text-muted">Cards in library</dt>
          <dd class="text-2xl font-semibold tabular-nums">
            {{ data.librarySize }}
          </dd>
        </div>
        <div class="rounded-lg border border-default p-3">
          <dt class="text-sm text-muted">Lands</dt>
          <dd class="text-2xl font-semibold tabular-nums">
            {{ landCount }}
            <span
              v-if="data.modalLands"
              class="block text-xs font-normal text-muted"
              >includes {{ data.modalLands }} spell/land
              {{ data.modalLands === 1 ? 'MDFC' : 'MDFCs' }}</span
            >
          </dd>
        </div>
        <div class="rounded-lg border border-default p-3">
          <dt class="text-sm text-muted">Average nonland mana value</dt>
          <dd class="text-2xl font-semibold tabular-nums">
            {{ data.averageManaValue?.toFixed(2) ?? '—' }}
          </dd>
        </div>
        <div class="rounded-lg border border-default p-3">
          <dt class="text-sm text-muted">Ave. Lands in Opener</dt>
          <dd
            class="text-2xl font-semibold tabular-nums"
            data-testid="average-opening-lands"
          >
            {{ averageOpeningLands.toFixed(2) }}
          </dd>
        </div>
      </dl>
      <section
        v-if="data.librarySize"
        aria-labelledby="analytics-opening-title"
        class="space-y-3"
      >
        <h3 id="analytics-opening-title" class="text-lg font-semibold">
          Opening hand
        </h3>
        <div class="flex flex-wrap items-end gap-x-5 gap-y-3">
          <UFormField label="Role, theme, or card type" class="w-full sm:w-72">
            <AppInputMenu
              v-model="target"
              :items="targets"
              value-key="value"
              :reset-search-term-on-blur="false"
              open-on-click
              aria-label="Role, theme, or card type"
              class="w-full"
            />
          </UFormField>
          <p v-if="selectedTarget" aria-live="polite" class="text-sm">
            <strong
              class="mr-1 text-xl tabular-nums"
              data-testid="target-draw-chance"
              >{{ percent(targetChance) }}</strong
            >
            chance of at least one in your opening {{ openingSize }}
            {{ openingSize === 1 ? 'card' : 'cards' }}.
          </p>
        </div>
        <p
          v-if="data.roles === null || data.themes === null"
          class="text-sm text-muted"
        >
          Role and theme labels are temporarily unavailable.
        </p>
      </section>

      <section
        aria-labelledby="analytics-cost-title"
        class="space-y-3 border-t border-default pt-5"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-x-3">
          <h3 id="analytics-cost-title" class="text-lg font-semibold">
            Deck cost
          </h3>
          <p class="text-sm tabular-nums">
            {{ money(data.prices.knownPriceCents) }}
            {{ data.prices.missingPrices ? 'known-price subtotal' : 'total' }}
          </p>
        </div>
        <p v-if="data.prices.missingPrices" class="text-xs text-muted">
          {{ data.prices.missingPrices }}
          {{ data.prices.missingPrices === 1 ? 'copy has' : 'copies have' }} no
          USD price.
        </p>
        <ul class="divide-y divide-default">
          <li
            v-for="card in data.prices.topCards.slice(0, costLimit)"
            :key="card.oracleId"
            class="flex items-center gap-2 py-1 text-sm sm:gap-3"
          >
            <NuxtLink
              :to="`/card/${card.oracleId}`"
              class="min-w-0 flex-1 text-primary hover:underline"
            >
              <span v-if="card.quantity > 1">{{ card.quantity }}× </span
              >{{ card.name }}
            </NuxtLink>
            <span class="shrink-0 text-right tabular-nums">{{
              money(card.totalCents)
            }}</span>
            <span
              class="w-14 shrink-0 text-right text-xs text-muted tabular-nums"
              title="Share of deck cost"
              >{{
                percent(
                  data.prices.knownPriceCents
                    ? card.totalCents / data.prices.knownPriceCents
                    : 0,
                )
              }}</span
            >
            <UButton
              v-if="isOwner"
              icon="i-lucide-scissors"
              :aria-label="`Cut ${card.name} from deck`"
              title="Cut all copies from mainboard"
              size="xs"
              color="error"
              variant="ghost"
              :loading="cutting === card.oracleId"
              :disabled="!!cutting"
              @click="cut(card.oracleId)"
            />
          </li>
        </ul>
        <UButton
          v-if="data.prices.topCards.length > costLimit"
          label="Load more"
          variant="ghost"
          @click="costLimit += 5"
        />
        <p v-if="cutError" role="alert" class="text-error text-sm">
          {{ cutError }}
        </p>
      </section>
    </template>
  </section>
</template>
