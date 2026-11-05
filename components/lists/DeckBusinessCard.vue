<script setup lang="ts">
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import type { AnalysisCard } from '~/utils/deckAnalysis';
import {
  deckBusinessCardQr,
  deckBusinessCardUrl,
  type DeckBusinessCardDetails,
} from '~/utils/deckBusinessCard';

const props = defineProps<{
  list: {
    id: string;
    name: string;
    description?: string | null;
    format: string;
    visibility: string;
    bracket?: number | null;
  };
  isOwner: boolean;
  entries: AnalysisCard[];
  cardsLoading: boolean;
}>();
const route = useRoute();
const api = useLibraryApi();
const shareMessage = ref('');
const client = useQueryClient();
const key = computed(() => [
  'deck-business-card',
  props.list.id,
  api.userId.value,
  props.list.visibility,
]);
const query = useQuery({
  queryKey: key,
  enabled: api.ready,
  retry: false,
  staleTime: 30_000,
  queryFn: () =>
    api.request<{ card: DeckBusinessCardDetails | null }>(
      `/lists/${props.list.id}/business-card`,
    ),
});
const saved = computed(() => query.data.value?.card ?? null);
const open = ref(false),
  editing = ref(false),
  busy = ref(false),
  error = ref(''),
  confirmDelete = ref(false);
const qrSvg = ref(''),
  qrError = ref('');
const draft = ref<DeckBusinessCardDetails>(emptyDetails());
function emptyDetails(): DeckBusinessCardDetails {
  return {
    playstyles: [],
    opening_hand: [],
    combos: [],
    summary: '',
    win_plan: '',
    hero_oracle_id: null,
    core_oracle_ids: [],
  };
}
const deckUrl = computed(() => deckBusinessCardUrl(props.list.id));
const qrImage = computed(() =>
  qrSvg.value
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg.value)}`
    : '',
);
const displayed = computed(() => (editing.value ? draft.value : saved.value));
const cardOptions = computed(() =>
  [
    ...new Map(
      props.entries.map((entry) => [
        entry.card.oracle_id,
        { label: entry.card.name, value: entry.card.oracle_id },
      ]),
    ).values(),
  ].sort((a, b) => a.label.localeCompare(b.label)),
);
const heroChoice = computed({
  get: () => draft.value.hero_oracle_id ?? 'auto',
  set: (value: string) => {
    draft.value.hero_oracle_id = value === 'auto' ? null : value;
  },
});
const tagDraft = ref('');
const handChoice = ref<string>();
const handOptions = computed(() =>
  cardOptions.value.filter((option) => {
    const entry = props.entries.find(
      (entry) => entry.card.oracle_id === option.value,
    );
    return (
      entry &&
      !entry.commander &&
      draft.value.opening_hand.filter((id) => id === option.value).length <
        entry.quantity
    );
  }),
);
function addTag() {
  const tag = tagDraft.value.trim();
  if (
    tag &&
    tag.length <= 40 &&
    draft.value.playstyles.length < 10 &&
    !draft.value.playstyles.some(
      (value) => value.toLowerCase() === tag.toLowerCase(),
    )
  )
    draft.value.playstyles.push(tag);
  tagDraft.value = '';
}
function addHandCard(value: unknown) {
  if (
    typeof value === 'string' &&
    draft.value.opening_hand.length < 7 &&
    handOptions.value.some((item) => item.value === value)
  )
    draft.value.opening_hand.push(value);
  nextTick(() => {
    handChoice.value = undefined;
  });
}
function cardName(id: string) {
  return (
    cardOptions.value.find((option) => option.value === id)?.label ??
    'Removed card'
  );
}
const invalidCoreCount = computed(() => draft.value.core_oracle_ids.length > 3);
let qrSequence = 0;
let operation = 0;
async function generateQr() {
  const current = ++qrSequence;
  qrSvg.value = '';
  qrError.value = '';
  try {
    const svg = await deckBusinessCardQr(props.list.id);
    if (current === qrSequence) qrSvg.value = svg;
  } catch {
    if (current === qrSequence)
      qrError.value = 'Could not generate the QR code. Try again.';
  }
}
function edit() {
  const available = new Set(cardOptions.value.map((card) => card.value));
  const source = saved.value ?? {
    ...emptyDetails(),
    summary: (props.list.description ?? '').slice(0, 240),
  };
  draft.value = {
    playstyles: [...(source.playstyles ?? [])],
    opening_hand: (source.opening_hand ?? []).filter((id) => available.has(id)),
    combos: (source.combos ?? []).map((combo) => ({
      ...combo,
      oracle_ids: combo.oracle_ids.filter((id) => available.has(id)),
    })),
    summary: source.summary,
    win_plan: source.win_plan,
    hero_oracle_id:
      source.hero_oracle_id && available.has(source.hero_oracle_id)
        ? source.hero_oracle_id
        : null,
    core_oracle_ids: source.core_oracle_ids.filter((id) => available.has(id)),
  };
  editing.value = true;
  error.value = '';
  confirmDelete.value = false;
}
function show() {
  shareMessage.value = '';
  open.value = true;
  error.value = '';
  confirmDelete.value = false;
  if (!saved.value && props.isOwner && !query.error.value) edit();
  else editing.value = false;
  void generateQr();
}
async function save() {
  if (!props.isOwner || busy.value || invalidCoreCount.value) return;
  const current = ++operation;
  const savedKey = [...key.value];
  busy.value = true;
  error.value = '';
  try {
    const result = await api.request<{ card: DeckBusinessCardDetails }>(
      `/lists/${props.list.id}/business-card`,
      'PUT',
      {
        ...draft.value,
        playstyles: draft.value.playstyles.map((tag) => tag.trim()),
        summary: draft.value.summary.trim(),
        win_plan: draft.value.win_plan.trim(),
      },
    );
    if (current === operation) {
      client.setQueryData(savedKey, result);
      editing.value = false;
    }
  } catch (cause) {
    if (current === operation) error.value = (cause as Error).message;
  } finally {
    if (current === operation) busy.value = false;
  }
}
async function remove() {
  if (!props.isOwner || busy.value) return;
  const current = ++operation;
  const savedKey = [...key.value];
  busy.value = true;
  error.value = '';
  try {
    await api.request(`/lists/${props.list.id}/business-card`, 'DELETE');
    if (current === operation) {
      client.setQueryData(savedKey, { card: null });
      open.value = false;
      confirmDelete.value = false;
    }
  } catch (cause) {
    if (current === operation) error.value = (cause as Error).message;
  } finally {
    if (current === operation) busy.value = false;
  }
}
async function retry() {
  await query.refetch();
  if (!query.error.value && !saved.value && props.isOwner) edit();
}
function downloadQr() {
  const url = URL.createObjectURL(
    new Blob([qrSvg.value], { type: 'image/svg+xml' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `cardmystic-deck-${props.list.id}-qr.svg`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function shareCard() {
  const data = {
    title: props.list.name || 'Deck business card',
    text: saved.value?.summary || undefined,
    url: `${deckUrl.value}?businessCard=1`,
  };
  shareMessage.value = '';
  error.value = '';
  try {
    if (navigator.share) await navigator.share(data);
    else {
      await navigator.clipboard.writeText(data.url);
      shareMessage.value = 'Business card link copied.';
    }
  } catch (cause) {
    if ((cause as Error).name !== 'AbortError')
      error.value = 'Could not share. You can copy the deck link below.';
  }
}
let openedFromLink = '';
watch(
  [
    () => route.query.businessCard,
    () => props.list.id,
    saved,
    () => props.cardsLoading,
  ],
  () => {
    if (
      route.query.businessCard === '1' &&
      saved.value &&
      !props.cardsLoading &&
      openedFromLink !== props.list.id
    ) {
      openedFromLink = props.list.id;
      show();
    }
  },
  { immediate: true },
);
async function printCard() {
  const current = operation;
  const images = [
    ...(document
      .getElementById('deck-business-card-print')
      ?.querySelectorAll('img') ?? []),
  ];
  await Promise.all(images.map((image) => image.decode().catch(() => {})));
  if (current === operation && open.value && !editing.value) window.print();
}
watch([() => props.list.id, api.userId, () => props.isOwner], () => {
  open.value = false;
  editing.value = false;
  busy.value = false;
  error.value = '';
  qrSequence++;
  operation++;
  qrSvg.value = '';
});
onBeforeUnmount(() => {
  qrSequence++;
  operation++;
});
</script>
<template>
  <template v-if="isOwner || saved">
    <UTooltip
      :text="saved ? 'View deck business card' : 'Create deck business card'"
    >
      <UButton
        icon="i-lucide-contact-round"
        :aria-label="
          saved ? 'View deck business card' : 'Create deck business card'
        "
        color="neutral"
        variant="solid"
        class="cursor-pointer"
        :loading="query.isLoading.value"
        :disabled="cardsLoading || !api.ready.value"
        @click="show"
      />
    </UTooltip>
    <UModal
      v-model:open="open"
      :title="
        editing
          ? saved
            ? 'Edit business card'
            : 'Create a deck business card'
          : 'Deck business card'
      "
      :dismissible="!busy"
      :ui="{ content: 'max-w-5xl', body: 'space-y-4' }"
    >
      <template #body>
        <div v-if="query.error.value" role="alert" class="space-y-2">
          <p>Could not load the business card.</p>
          <UButton
            label="Retry business card"
            variant="outline"
            @click="retry"
          />
        </div>
        <template v-else>
          <p v-if="list.visibility !== 'public'" class="text-sm text-muted">
            This deck is private. Only you can open it. The QR code does not
            give other people access.
          </p>
          <form
            v-if="editing && isOwner"
            class="space-y-4"
            @submit.prevent="save"
          >
            <p class="text-sm text-muted">
              Free for every deck. The name, format and cards stay linked to
              your deck.
            </p>
            <UFormField label="Playstyle tags (up to 10)">
              <div class="flex flex-wrap gap-2 mb-2">
                <UButton
                  v-for="(tag, index) in draft.playstyles"
                  :key="tag"
                  :label="tag"
                  trailing-icon="i-lucide-x"
                  variant="soft"
                  :aria-label="`Remove playstyle ${tag}`"
                  @click="draft.playstyles.splice(index, 1)"
                />
              </div>
              <div class="flex gap-2">
                <UInput
                  v-model="tagDraft"
                  aria-label="Business card playstyle"
                  placeholder="e.g. Blink, Tokens"
                  :maxlength="40"
                  :disabled="draft.playstyles.length >= 10"
                  class="flex-1"
                  @keydown.enter.prevent="addTag"
                />
                <UButton
                  label="Add tag"
                  variant="outline"
                  :disabled="!tagDraft.trim() || draft.playstyles.length >= 10"
                  @click="addTag"
                />
              </div>
            </UFormField>
            <p class="text-sm text-muted">
              {{ list.bracket ? `Bracket ${list.bracket}` : 'No bracket set' }}.
              Change the bracket in deck settings.
            </p>
            <UFormField label="Short summary"
              ><UTextarea
                v-model="draft.summary"
                aria-label="Business card summary"
                :maxlength="240"
                :rows="2"
                class="w-full"
            /></UFormField>
            <UFormField label="How does it win?"
              ><UTextarea
                v-model="draft.win_plan"
                aria-label="Business card win plan"
                :maxlength="400"
                :rows="3"
                class="w-full"
            /></UFormField>
            <div class="grid sm:grid-cols-2 gap-4">
              <UFormField label="Main card image"
                ><USelectMenu
                  v-model="heroChoice"
                  :items="[
                    {
                      label: 'Automatic (commander or first card)',
                      value: 'auto',
                    },
                    ...cardOptions,
                  ]"
                  value-key="value"
                  aria-label="Business card main image"
                  class="w-full"
              /></UFormField>
              <UFormField
                label="Core cards (up to 3)"
                :error="
                  invalidCoreCount
                    ? 'Choose no more than three core cards.'
                    : undefined
                "
                ><USelectMenu
                  v-model="draft.core_oracle_ids"
                  :items="cardOptions"
                  multiple
                  value-key="value"
                  aria-label="Business card core cards"
                  class="w-full"
                  placeholder="Choose cards from this deck"
              /></UFormField>
            </div>
            <UFormField label="Example opening hand (optional, up to 7 cards)">
              <div class="flex flex-wrap gap-2 mb-2">
                <UButton
                  v-for="(id, index) in draft.opening_hand"
                  :key="index"
                  :label="cardName(id)"
                  trailing-icon="i-lucide-x"
                  variant="soft"
                  :aria-label="`Remove opening hand card ${index + 1}`"
                  @click="draft.opening_hand.splice(index, 1)"
                />
              </div>
              <USelectMenu
                v-model="handChoice"
                :items="handOptions"
                value-key="value"
                aria-label="Opening hand card"
                placeholder="Add a card to the example hand"
                :disabled="draft.opening_hand.length >= 7"
                class="w-full"
                @update:model-value="addHandCard"
              />
            </UFormField>
            <section class="space-y-3">
              <h3 class="font-medium">Combos (optional)</h3>
              <fieldset
                v-for="(combo, index) in draft.combos"
                :key="index"
                class="border border-default rounded-lg p-3 space-y-3"
              >
                <UInput
                  v-model="combo.name"
                  :aria-label="`Combo ${index + 1} name`"
                  placeholder="Combo name"
                  :maxlength="80"
                  required
                  class="w-full"
                />
                <USelectMenu
                  v-model="combo.oracle_ids"
                  :items="cardOptions"
                  value-key="value"
                  multiple
                  :aria-label="`Combo ${index + 1} cards`"
                  placeholder="Choose 2 to 6 cards"
                  class="w-full"
                />
                <UTextarea
                  v-model="combo.description"
                  :aria-label="`Combo ${index + 1} description`"
                  placeholder="How it works"
                  :maxlength="240"
                  :rows="2"
                  class="w-full"
                />
                <UButton
                  :aria-label="`Remove combo ${index + 1}`"
                  label="Remove combo"
                  color="error"
                  variant="ghost"
                  @click="draft.combos.splice(index, 1)"
                />
              </fieldset>
              <UButton
                label="Add combo"
                icon="i-lucide-plus"
                variant="outline"
                :disabled="draft.combos.length >= 6"
                @click="
                  draft.combos.push({
                    name: '',
                    description: '',
                    oracle_ids: [],
                  })
                "
              />
            </section>
            <div class="flex flex-wrap gap-2">
              <UButton
                type="submit"
                label="Save"
                :loading="busy"
                :disabled="invalidCoreCount || cardsLoading"
              /><UButton
                label="Cancel"
                color="neutral"
                variant="outline"
                :disabled="busy"
                @click="saved ? (editing = false) : (open = false)"
              />
            </div>
          </form>
          <div
            v-else-if="saved"
            class="flex flex-wrap items-center gap-2 business-card-controls"
          >
            <UButton
              v-if="isOwner"
              label="Edit business card"
              icon="i-lucide-pencil"
              variant="outline"
              @click="edit"
            />
            <UButton
              label="Share"
              icon="i-lucide-share-2"
              variant="outline"
              @click="shareCard"
            />
            <UButton
              label="Download QR code"
              icon="i-lucide-qr-code"
              variant="outline"
              :disabled="!qrSvg"
              @click="downloadQr"
            />
            <UButton
              label="Print / Save PDF"
              icon="i-lucide-printer"
              variant="outline"
              :disabled="!qrSvg || cardsLoading"
              @click="printCard"
            />
            <UButton
              v-if="isOwner"
              label="Remove business card"
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              @click="confirmDelete = true"
            />
          </div>
          <div
            v-if="confirmDelete && isOwner"
            class="p-3 border border-error rounded space-y-2"
          >
            <p>Remove the business card? Your deck stays as it is.</p>
            <div class="flex gap-2">
              <UButton
                label="Confirm remove business card"
                color="error"
                :loading="busy"
                @click="remove"
              /><UButton
                label="Keep business card"
                variant="outline"
                :disabled="busy"
                @click="confirmDelete = false"
              />
            </div>
          </div>
          <p v-if="shareMessage" role="status">{{ shareMessage }}</p>
          <p v-if="error" role="alert" class="text-error">{{ error }}</p>
          <div v-if="qrError" role="alert">
            <p>{{ qrError }}</p>
            <UButton
              label="Retry QR code"
              variant="outline"
              @click="generateQr"
            />
          </div>
          <p v-if="editing" class="font-medium">Preview</p>
          <DeckBusinessCardPreview
            v-if="displayed"
            :name="list.name"
            :format="list.format"
            :bracket="list.bracket"
            :details="displayed"
            :entries="entries"
            :qr-image="qrImage"
            :deck-url="deckUrl"
          />
        </template>
      </template>
    </UModal>
  </template>
</template>
<style>
@media print {
  body:has(#deck-business-card-print) {
    height: auto !important;
    overflow: visible !important;
  }
  body:has(#deck-business-card-print)
    *:not(#deck-business-card-print):not(#deck-business-card-print *):not(
      :has(#deck-business-card-print)
    ) {
    display: none !important;
  }
  body:has(#deck-business-card-print) *:has(#deck-business-card-print) {
    display: block !important;
    position: static !important;
    inset: auto !important;
    transform: none !important;
    width: auto !important;
    height: auto !important;
    max-width: none !important;
    max-height: none !important;
    overflow: visible !important;
    border: 0 !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  #deck-business-card-print {
    position: static;
    width: 100%;
    break-inside: avoid;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  #deck-business-card-print .business-content {
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.3fr);
  }
  #deck-business-card-print .business-details {
    grid-row: auto;
  }
  #deck-business-card-print .business-art {
    display: block;
  }
  #deck-business-card-print .business-hero {
    width: 100%;
  }
  #deck-business-card-print .business-scan {
    margin-top: 18px;
    flex-direction: row;
  }
  #deck-business-card-print .business-qr {
    max-width: 55%;
  }
}
</style>
