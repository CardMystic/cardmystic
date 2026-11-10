<script setup lang="ts">
import {
  chanceAtLeast,
  drawDistribution,
  type DeckAnalytics,
} from '~/utils/deckAnalytics';

const props = defineProps<{
  listId: string;
  revision: string;
  format: string;
  isOwner: boolean;
}>();
const api = useLibraryApi();
const browser = useBrowserDeckSource();
const config = useRuntimeConfig();
const pending = ref(false);
const error = ref('');
const data = ref<DeckAnalytics>();
const costLimit = ref(5);
const turn = ref(4);
const landsNeeded = ref(4);
const drawOnTurnOne = ref(props.format.toLowerCase().includes('commander'));
const includeModal = ref(false);
const target = ref('type:Creature');
let sequence = 0;
let disposed = false;
const cutting = ref<string | null>(null);

async function load() {
  if (disposed) return;
  const current = ++sequence;
  pending.value = true;
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
  } finally {
    if (current === sequence) pending.value = false;
  }
}
watch(
  [api.userId, api.ready, () => props.listId, () => props.revision],
  () => {
    // Wait for the confirmed delete; optimistic list changes precede the API write.
    if (cutting.value) return;
    sequence++;
    data.value = undefined;
    pending.value = false;
    if (browser || api.ready.value) void load();
  },
  { immediate: true },
);
onBeforeUnmount(() => {
  disposed = true;
  sequence++;
});

const librarySize = computed(() => data.value?.librarySize ?? 0);
const openingSize = computed(() => Math.min(7, librarySize.value));
const cardsSeen = computed(() =>
  Math.min(
    librarySize.value,
    openingSize.value + turn.value - (drawOnTurnOne.value ? 0 : 1),
  ),
);
const landCount = computed(
  () =>
    (data.value?.lands ?? 0) +
    (includeModal.value ? (data.value?.modalLands ?? 0) : 0),
);
const opening = computed(() =>
  drawDistribution(librarySize.value, landCount.value, openingSize.value),
);
const averageOpeningLands = computed(() =>
  librarySize.value
    ? (openingSize.value * landCount.value) / librarySize.value
    : 0,
);
const landChance = computed(() =>
  chanceAtLeast(
    drawDistribution(librarySize.value, landCount.value, cardsSeen.value),
    landsNeeded.value,
  ),
);
const openingBuckets = computed(() => [
  {
    label: '0–1 lands',
    value: (opening.value[0] ?? 0) + (opening.value[1] ?? 0),
  },
  {
    label: '2–3 lands',
    value: (opening.value[2] ?? 0) + (opening.value[3] ?? 0),
  },
  {
    label: '4–5 lands',
    value: (opening.value[4] ?? 0) + (opening.value[5] ?? 0),
  },
  {
    label: '6–7 lands',
    value: (opening.value[6] ?? 0) + (opening.value[7] ?? 0),
  },
]);
const targets = computed(() => [
  ...(data.value?.types ?? []).map((row) => ({
    label: row.name,
    value: `type:${row.name}`,
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
      cardsSeen.value,
    ),
    1,
  ),
);
const cutError = ref('');
const { removeCardFromListMutation } = useCardLists();
async function cut(oracleId: string) {
  if (!props.isOwner || cutting.value) return;
  cutting.value = oracleId;
  cutError.value = '';
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
  <div class="space-y-6" aria-label="Advanced deck analytics">
    <p v-if="pending && !data" role="status" class="py-8">
      Loading deck analytics…
    </p>
    <div v-else-if="error" role="alert" class="space-y-3">
      <p>{{ error }}</p>
      <UButton label="Retry analytics" variant="outline" @click="load" />
    </div>
    <template v-else-if="data">
      <p class="text-sm text-muted">
        Mainboard only. Draw and mana analysis exclude
        {{ data.commanders }} commander{{ data.commanders === 1 ? '' : 's' }};
        prices include them.
      </p>
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
            {{ data.lands }}
          </dd>
        </div>
        <div class="rounded-lg border border-default p-3">
          <dt class="text-sm text-muted">
            <UTooltip
              text="Modal double-faced cards let you play either side. This count includes spells with a land on the back."
              :ui="{
                content: 'max-w-72 h-auto',
                text: 'whitespace-normal break-words',
              }"
            >
              <button
                type="button"
                class="inline-flex items-center gap-1"
                aria-label="What are MDFCs?"
              >
                MDFCs <UIcon name="i-lucide-info" class="size-3.5" />
              </button>
            </UTooltip>
          </dt>
          <dd class="text-2xl font-semibold tabular-nums">
            {{ data.modalLands }}
          </dd>
        </div>
        <div class="rounded-lg border border-default p-3">
          <dt class="text-sm text-muted">Average nonland mana value</dt>
          <dd class="text-2xl font-semibold tabular-nums">
            {{ data.averageManaValue?.toFixed(2) ?? '—' }}
          </dd>
        </div>
      </dl>
      <p v-if="!data.librarySize" class="text-muted">
        Add cards to the mainboard to see draw and mana analysis.
      </p>
      <template v-else>
        <section aria-labelledby="analytics-draw-title" class="space-y-4">
          <h3 id="analytics-draw-title" class="text-lg font-semibold">
            Draw odds
          </h3>
          <div class="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end">
            <UFormField label="By turn" class="min-w-0 sm:w-32"
              ><USelect
                v-model="turn"
                :items="[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
                aria-label="Analytics turn"
                class="w-full"
            /></UFormField>
            <UFormField label="Lands needed" class="min-w-0 sm:w-36"
              ><USelect
                v-model="landsNeeded"
                :items="[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
                aria-label="Analytics lands needed"
                class="w-full"
            /></UFormField>
            <USwitch
              v-model="drawOnTurnOne"
              label="Draw on turn one"
              :ui="{ label: 'ml-2' }"
              class="col-span-2 sm:pb-2"
            />
          </div>
          <UCheckbox
            v-if="data.modalLands"
            v-model="includeModal"
            label="Count MDFCs as lands"
            :ui="{ label: 'ml-2' }"
          />
          <div class="rounded-lg bg-primary/10 border border-primary/25 p-4">
            <p
              class="text-3xl font-semibold tabular-nums"
              data-testid="land-draw-chance"
            >
              {{ percent(landChance) }}
            </p>
            <p>
              Chance to see at least {{ landsNeeded }} lands by turn
              {{ turn }} ({{ cardsSeen }} cards seen).
            </p>
          </div>
          <figure>
            <figcaption class="font-medium mb-3">
              Lands in your opening {{ openingSize }} cards
            </figcaption>
            <p class="mb-3">
              <strong
                class="text-2xl tabular-nums"
                data-testid="average-opening-lands"
                >{{ averageOpeningLands.toFixed(2) }}</strong
              >
              lands on average, before mulligans.
            </p>
            <div
              v-for="bucket in openingBuckets"
              :key="bucket.label"
              class="grid grid-cols-[5.5rem_1fr_4rem] gap-3 items-center mb-2"
            >
              <span class="text-sm">{{ bucket.label }}</span>
              <div class="h-5 rounded bg-muted">
                <div
                  class="h-full bg-primary rounded"
                  :style="{ width: percent(bucket.value) }"
                />
              </div>
              <span class="text-sm tabular-nums text-right">{{
                percent(bucket.value)
              }}</span>
            </div>
          </figure>
          <div class="border-t border-default pt-4 space-y-2">
            <UFormField label="Find a card type or role"
              ><USelect
                v-model="target"
                :items="targets"
                aria-label="Analytics draw target"
                class="w-full sm:w-72"
            /></UFormField>
            <p>
              <strong
                class="text-xl tabular-nums"
                data-testid="target-draw-chance"
                >{{ percent(targetChance) }}</strong
              >
              chance to see at least one by turn {{ turn }}.
              {{ selectedTarget?.count ?? 0 }} matching copies in your library.
            </p>
            <p v-if="data.roles === null" class="text-sm text-muted">
              Role labels are temporarily unavailable. Card type odds still
              work.
            </p>
          </div>
          <p class="text-sm text-muted">
            Assumes a shuffled library and one draw per turn. No mulligans,
            extra draws, ramp or tutors. These are odds of drawing cards, not of
            casting them. Cards with several types or roles count in each group;
            role labels are AI-generated and may be wrong.
          </p>
        </section>
      </template>

      <section
        aria-labelledby="analytics-cost-title"
        class="space-y-3 border-t border-default pt-5"
      >
        <h3 id="analytics-cost-title" class="text-lg font-semibold">
          Where the cost comes from
        </h3>
        <p>
          <strong class="text-2xl tabular-nums">{{
            money(data.prices.knownPriceCents)
          }}</strong>
          {{
            data.prices.missingPrices
              ? 'known-price subtotal'
              : 'estimated total'
          }}
        </p>
        <p v-if="data.prices.missingPrices" class="text-sm text-warning">
          {{ data.prices.missingPrices }} card copies have no USD price and are
          excluded.
        </p>
        <ol class="space-y-3">
          <li
            v-for="card in data.prices.topCards.slice(0, costLimit)"
            :key="card.oracleId"
          >
            <div class="flex items-start justify-between gap-3 text-sm">
              <div class="flex items-start gap-1 min-w-0">
                <NuxtLink
                  :to="`/card/${card.oracleId}`"
                  class="text-primary underline"
                  >{{ card.quantity }}× {{ card.name }}</NuxtLink
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
              </div>
              <span class="shrink-0 tabular-nums text-right"
                >{{ money(card.totalCents) }}<br /><span
                  class="text-xs text-muted"
                  >({{
                    percent(
                      data.prices.knownPriceCents
                        ? card.totalCents / data.prices.knownPriceCents
                        : 0,
                    )
                  }}
                  of deck cost)</span
                ></span
              >
            </div>
            <div class="mt-1 h-2 bg-muted rounded">
              <div
                class="h-full rounded bg-primary"
                :style="{
                  width: percent(
                    data.prices.knownPriceCents
                      ? card.totalCents / data.prices.knownPriceCents
                      : 0,
                  ),
                }"
              />
            </div>
          </li>
        </ol>
        <UButton
          v-if="data.prices.topCards.length > costLimit"
          label="Load more"
          variant="ghost"
          @click="costLimit += 5"
        />
        <p v-if="cutError" role="alert" class="text-error text-sm">
          {{ cutError }}
        </p>
        <p class="text-sm text-muted">
          Includes all copies. Each bar is its share of the known-price
          subtotal. USD estimates use the current nonfoil price for the printing
          in our card data, which may differ from the version you own. Prices
          follow our card data refresh and aren’t live quotes.
        </p>
      </section>
    </template>
  </div>
</template>
