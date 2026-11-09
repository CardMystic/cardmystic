<script setup lang="ts">
defineOptions({ name: 'MyDecklistsPage' });
import { useMyDecklists } from '~/composables/useCardLists';
import {
  useLikedDecklists,
  useSavedDecklists,
} from '~/composables/useDecklistSocial';
import type { DecklistSummary } from '~/models/cardListModel';
import type { DeckFolder } from '~/composables/useLibrary';
import { folderTrail } from '~/utils/deckFolders';
import { manaNames } from '~/utils/manaDisplay';
import {
  deckColors,
  deckColorSortKey,
  type LibrarySort,
} from '~/utils/deckLibrary';
definePageMeta({ middleware: 'auth' });
useSeoMeta({
  title: 'My decks and collections | CardMystic',
  robots: 'noindex, nofollow',
});
const { hasDrafts: hasBrowserDrafts } = useGuestDeck();
const route = useRoute();
const router = useRouter();
type LibraryView = 'all' | 'mine' | 'collections' | 'liked' | 'saved';
const view = computed<LibraryView>(() => {
  const value = route.query.view;
  return value === 'mine' ||
    value === 'collections' ||
    value === 'liked' ||
    value === 'saved'
    ? value
    : 'all';
});
function location(folderId = '', tab: LibraryView = view.value) {
  return {
    path: '/lists',
    query: {
      ...(tab !== 'all' ? { view: tab } : {}),
      ...(folderId ? { folder: folderId } : {}),
    },
  };
}
const display = ref<'grid' | 'list'>('grid');
const sort = ref<LibrarySort>('updated_at');
const direction = ref<'asc' | 'desc'>('desc');
const folder = computed(() =>
  own.value && typeof route.query.folder === 'string' ? route.query.folder : '',
);
const minePage = ref(1),
  likedPage = ref(1),
  savedPage = ref(1);
const pageSize = 50;
const own = computed(
  () =>
    view.value === 'all' ||
    view.value === 'mine' ||
    view.value === 'collections',
);
const options = computed(() => ({
  kind:
    view.value === 'all'
      ? ('all' as const)
      : view.value === 'collections'
        ? ('collection' as const)
        : ('deck' as const),
  folder: folder.value || 'unfiled',
  sort: sort.value,
  direction: direction.value,
}));
const mine = useMyDecklists(minePage, pageSize, options, own);
const liked = useLikedDecklists(likedPage, pageSize);
const saved = useSavedDecklists(savedPage, pageSize);
const active = computed(() =>
  own.value ? mine : view.value === 'liked' ? liked : saved,
);
const lists = computed(() => {
  const data = active.value.decklists.value;
  if (own.value) return data;
  return [...data].sort((a, b) => {
    const key = sort.value;
    if (key === 'bracket' && (a.bracket == null || b.bracket == null))
      return a.bracket == null ? (b.bracket == null ? 0 : 1) : -1;
    const difference =
      key === 'colors'
        ? deckColorSortKey(a.color_ratios) - deckColorSortKey(b.color_ratios)
        : key === 'bracket'
          ? (a.bracket ?? 0) - (b.bracket ?? 0)
          : String(a[key] ?? '').localeCompare(String(b[key] ?? ''));
    return difference * (direction.value === 'asc' ? 1 : -1);
  });
});
const heading = computed(
  () =>
    ({
      all: 'Decks & Collections',
      mine: 'Decks',
      collections: 'Collections',
      liked: 'Liked Decklists',
      saved: 'Saved Decklists',
    })[view.value],
);
const page = computed({
  get: () =>
    own.value
      ? minePage.value
      : view.value === 'liked'
        ? likedPage.value
        : savedPage.value,
  set: (value) => {
    if (own.value) minePage.value = value;
    else if (view.value === 'liked') likedPage.value = value;
    else savedPage.value = value;
  },
});
watch([view, folder, sort, direction], () => {
  page.value = 1;
});
watch(
  () => active.value.totalPages.value,
  (total) => {
    if (page.value > total) page.value = Math.max(1, total);
  },
);
const {
  folders,
  pending: foldersLoading,
  error: foldersError,
  change,
} = useDeckFolders();
const currentFolder = computed(() =>
  folders.value.find((item) => item.id === folder.value),
);
const rootFolders = computed(() =>
  own.value
    ? folders.value.filter((item) => (item.parentId ?? '') === folder.value)
    : [],
);
const folderAncestors = computed(() =>
  folderTrail(folders.value, folder.value),
);
const missingFolder = computed(
  () =>
    !!folder.value &&
    !foldersLoading.value &&
    !foldersError.value &&
    !currentFolder.value,
);
const createOpen = ref(false);
const createKind = ref<'deck' | 'collection'>('deck');
function createList(kind: 'deck' | 'collection') {
  createKind.value = kind;
  createOpen.value = true;
}
const listLabel = computed(() =>
  view.value === 'all'
    ? 'decks & collections'
    : view.value === 'collections'
      ? 'collections'
      : 'decks',
);
const folderDialogOpen = ref(false);
const editingFolder = ref<DeckFolder | null>(null);
const settingsList = ref<DecklistSummary | null>(null);
const settingsOpen = computed({
  get: () => !!settingsList.value,
  set: (value) => {
    if (!value) settingsList.value = null;
  },
});
const moving = ref<string | null>(null);
const dragged = ref<DecklistSummary | null>(null);
const dropTarget = ref<string | null>(null);
const toast = useToast();
const gridClass = 'grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3';
const columns = computed(() => [
  { key: 'name' as const, label: 'Name', width: '' },
  { key: 'colors' as const, label: 'Colors', width: 'w-28' },
  { key: 'format' as const, label: 'Format', width: 'w-32' },
  ...(view.value === 'collections'
    ? []
    : [{ key: 'bracket' as const, label: 'Bracket', width: 'w-32' }]),
  { key: 'updated_at' as const, label: 'Updated', width: 'w-32' },
]);
function sortColumn(key: LibrarySort) {
  if (sort.value === key)
    direction.value = direction.value === 'asc' ? 'desc' : 'asc';
  else {
    sort.value = key;
    direction.value = key === 'updated_at' ? 'desc' : 'asc';
  }
}
function editFolder(item: DeckFolder | null) {
  editingFolder.value = item;
  folderDialogOpen.value = true;
}
function folderCount(item: DeckFolder) {
  const decks = item.deckCount ?? item.count;
  const collections = item.collectionCount ?? 0;
  const parts = [`${decks} ${decks === 1 ? 'deck' : 'decks'}`];
  if (collections)
    parts.push(
      `${collections} ${collections === 1 ? 'collection' : 'collections'}`,
    );
  if (item.folderCount) parts.push(`${item.folderCount} subfolders`);
  return parts.join(' · ');
}
async function folderDeleted(id: string) {
  if (folder.value === id) await router.push(location());
}
function dragStart(event: DragEvent, list: DecklistSummary) {
  if (
    !own.value ||
    moving.value ||
    (event.target as HTMLElement).closest('button')
  ) {
    event.preventDefault();
    return;
  }
  dragged.value = list;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/x-cardmystic-list', list.id);
  }
}
function dragEnd() {
  dragged.value = null;
  dropTarget.value = null;
}
function dragOver(event: DragEvent, target: string) {
  if (
    !dragged.value ||
    moving.value ||
    (dragged.value.folder_id || '') === target
  )
    return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  dropTarget.value = target;
}
function dragLeave(event: DragEvent) {
  if (
    !(event.currentTarget as HTMLElement).contains(
      event.relatedTarget as Node | null,
    )
  )
    dropTarget.value = null;
}
async function drop(event: DragEvent, target: string) {
  const list = dragged.value;
  event.preventDefault();
  dragEnd();
  if (!list || moving.value || (list.folder_id || '') === target) return;
  moving.value = list.id;
  try {
    await change(`/lists/${list.id}/folder`, 'PATCH', {
      folderId: target || null,
    });
    toast.add({ title: `Moved “${list.name}”`, color: 'success' });
  } catch (cause) {
    toast.add({
      title: 'Could not move list',
      description: (cause as Error).message,
      color: 'error',
    });
  } finally {
    moving.value = null;
  }
}
onMounted(() => {
  try {
    const stored = JSON.parse(
      localStorage.getItem('cm.library-display') ?? '{}',
    );
    if (['grid', 'list'].includes(stored.view)) display.value = stored.view;
    if (
      [
        'updated_at',
        'created_at',
        'name',
        'format',
        'colors',
        'bracket',
      ].includes(stored.sort)
    )
      sort.value = stored.sort;
    if (['asc', 'desc'].includes(stored.direction))
      direction.value = stored.direction;
  } catch {
    /* Use defaults when storage is unavailable. */
  }
});
watch([display, sort, direction], () => {
  if (import.meta.client)
    try {
      localStorage.setItem(
        'cm.library-display',
        JSON.stringify({
          view: display.value,
          sort: sort.value,
          direction: direction.value,
        }),
      );
    } catch {
      /* Display settings still work for this visit. */
    }
});
</script>
<template>
  <div class="mx-auto px-4 py-8 relative z-10 w-full min-w-0">
    <div class="mb-6 flex flex-wrap gap-3 items-center justify-between">
      <h1 class="text-3xl font-bold break-words min-w-0">
        {{ currentFolder?.name ?? heading }}
      </h1>
      <div v-if="own" class="flex flex-wrap items-center gap-2">
        <UButton
          :disabled="missingFolder"
          label="New folder"
          icon="i-lucide-folder-plus"
          color="neutral"
          variant="outline"
          @click="editFolder(null)"
        />
        <UButton
          v-if="currentFolder"
          :aria-label="`Settings for folder ${currentFolder.name}`"
          icon="i-lucide-settings"
          color="neutral"
          variant="outline"
          @click="editFolder(currentFolder)"
        />
        <UButton
          v-if="own"
          icon="i-lucide-plus"
          :label="view === 'collections' ? 'New Collection' : 'New Deck'"
          @click="createList(view === 'collections' ? 'collection' : 'deck')"
          :disabled="missingFolder"
        />
        <UButton
          v-if="view === 'all'"
          icon="i-lucide-plus"
          label="New Collection"
          :disabled="missingFolder"
          @click="createList('collection')"
        />
      </div>
    </div>
    <div class="flex flex-wrap gap-2 mb-6">
      <UButton
        v-for="tab in [
          {
            key: 'all',
            label: 'Decks & Collections',
            icon: 'i-lucide-folder-open',
          },
          { key: 'mine', label: 'Decks', icon: 'i-lucide-layers' },
          {
            key: 'collections',
            label: 'Collections',
            icon: 'i-lucide-library',
          },
          { key: 'liked', label: 'Liked Decks', icon: 'i-lucide-heart' },
          { key: 'saved', label: 'Saved Decks', icon: 'i-lucide-bookmark' },
        ] as const"
        :key="tab.key"
        :label="tab.label"
        :icon="tab.icon"
        :color="view === tab.key ? 'primary' : 'neutral'"
        :variant="view === tab.key ? 'solid' : 'outline'"
        :aria-pressed="view === tab.key"
        @click="router.push(location('', tab.key))"
      />
    </div>
    <UAlert
      v-if="hasBrowserDrafts"
      class="mb-4"
      color="info"
      title="You have an unsaved browser draft"
    >
      <template #description
        ><NuxtLink to="/build" class="underline"
          >Continue editing or save it to your account</NuxtLink
        ></template
      >
    </UAlert>
    <p v-if="view === 'collections'" class="mb-4 text-muted">
      Keep track of cards you own. Collections support up to 50,000 card
      entries. Search within them with CardMystic Pro.
    </p>
    <nav
      v-if="own"
      aria-label="Folder navigation"
      class="flex flex-wrap items-center gap-2 mb-4 text-sm"
    >
      <NuxtLink
        :to="location()"
        class="inline-flex items-center gap-2 rounded-md border border-transparent px-3 py-2 hover:bg-elevated"
        :class="{ 'border-primary bg-primary/15': dropTarget === '' }"
        :aria-current="!folder ? 'page' : undefined"
        @dragover="dragOver($event, '')"
        @dragleave="dragLeave"
        @drop="drop($event, '')"
      >
        <UIcon name="i-lucide-folder-root" class="size-5" />{{ heading }}
      </NuxtLink>
      <template v-for="ancestor in folderAncestors" :key="ancestor.id">
        <UIcon name="i-lucide-chevron-right" />
        <NuxtLink
          :to="location(ancestor.id)"
          :aria-current="ancestor.id === folder ? 'page' : undefined"
          class="rounded-md px-3 py-2 hover:bg-elevated"
          :class="{ 'bg-primary/15': dropTarget === ancestor.id }"
          @dragover="dragOver($event, ancestor.id)"
          @dragleave="dragLeave"
          @drop="drop($event, ancestor.id)"
        >
          {{ ancestor.name }}
        </NuxtLink>
      </template>
      <span v-if="dragged && folder" class="text-muted"
        >Drop on {{ heading }} to move out of this folder.</span
      >
    </nav>
    <p v-if="own && foldersError" role="alert" class="text-error mb-4">
      {{ foldersError.message }}
    </p>
    <div class="flex items-center justify-between gap-3 mb-4">
      <div class="min-w-0 flex flex-wrap items-center gap-3">
        <UPagination
          v-if="active.totalPages.value > 1"
          v-model:page="page"
          :total="active.totalCount.value"
          :items-per-page="pageSize"
          :sibling-count="1"
          :ui="{ first: 'hidden', last: 'hidden' }"
          size="sm"
          aria-label="Library pages top"
        />
        <p class="text-sm text-muted">
          {{ active.totalCount.value }}
          {{ listLabel }}
        </p>
      </div>
      <UPopover>
        <UButton
          label="Display"
          icon="i-lucide-settings-2"
          color="neutral"
          variant="outline"
        />
        <template #content>
          <div class="grid gap-3 p-3 w-64 max-w-[calc(100vw-2rem)]">
            <label
              class="grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-2 text-sm"
              >View<USelect
                v-model="display"
                :items="[
                  { label: 'Grid', value: 'grid' },
                  { label: 'List', value: 'list' },
                ]"
                aria-label="Decklists view"
                class="w-full"
            /></label>
            <label
              class="grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-2 text-sm"
              >Sort<USelect
                v-model="sort"
                :items="[
                  { label: 'Last updated', value: 'updated_at' },
                  { label: 'Created', value: 'created_at' },
                  { label: 'Name', value: 'name' },
                  { label: 'Format', value: 'format' },
                  { label: 'Colors', value: 'colors' },
                  { label: 'Bracket', value: 'bracket' },
                ]"
                aria-label="Decklists sorting"
                class="w-full"
            /></label>
            <UButton
              :label="direction === 'asc' ? 'Ascending' : 'Descending'"
              :icon="
                direction === 'asc'
                  ? 'i-lucide-arrow-up'
                  : 'i-lucide-arrow-down'
              "
              color="neutral"
              variant="ghost"
              @click="direction = direction === 'asc' ? 'desc' : 'asc'"
            />
            <p v-if="!own" class="text-xs text-muted">
              Sorts this page of results.
            </p>
          </div>
        </template>
      </UPopover>
    </div>
    <ClientOnly>
      <p v-if="missingFolder" role="alert" class="py-12 text-center text-muted">
        This folder no longer exists. Go back to {{ heading }} to see your
        lists.
      </p>
      <div
        v-else-if="display === 'list'"
        class="relative overflow-x-auto rounded-lg border border-default"
      >
        <table
          class="w-full min-w-176 table-fixed text-sm text-left"
          :aria-label="heading"
          :aria-busy="active.isFetching.value || !!moving"
        >
          <thead class="bg-elevated/70 border-b border-default">
            <tr>
              <th
                v-for="column in columns"
                :key="column.key"
                scope="col"
                class="px-3 py-2"
                :class="column.width"
                :aria-sort="
                  sort === column.key
                    ? direction === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                "
              >
                <button
                  type="button"
                  class="inline-flex items-center gap-1 font-semibold hover:text-primary focus-visible:outline-primary"
                  :aria-label="`Sort by ${column.label.toLowerCase()}`"
                  @click="sortColumn(column.key)"
                >
                  {{ column.label }}
                  <UIcon
                    :name="
                      sort === column.key
                        ? direction === 'asc'
                          ? 'i-lucide-arrow-up'
                          : 'i-lucide-arrow-down'
                        : 'i-lucide-chevrons-up-down'
                    "
                    class="size-3.5"
                    :class="sort === column.key ? 'text-primary' : 'text-muted'"
                  />
                </button>
              </th>
              <th scope="col" class="w-12">
                <span class="sr-only">Settings</span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <template v-if="active.isLoading.value || (own && foldersLoading)">
              <tr v-for="n in 8" :key="n">
                <td :colspan="columns.length + 1" class="px-3 py-2">
                  <USkeleton class="h-6" />
                </td>
              </tr>
            </template>
            <tr v-else-if="active.error?.value">
              <td
                :colspan="columns.length + 1"
                class="p-4 text-error"
                role="alert"
              >
                {{ active.error.value.message }}
              </td>
            </tr>
            <template v-else>
              <tr
                v-for="item in rootFolders"
                :key="item.id"
                class="relative group hover:bg-elevated/70"
                :class="{
                  'bg-primary/20 ring-2 ring-inset ring-primary':
                    dropTarget === item.id,
                }"
                :data-testid="`folder-${item.id}`"
                @dragover="dragOver($event, item.id)"
                @dragleave="dragLeave"
                @drop="drop($event, item.id)"
              >
                <td :colspan="columns.length" class="px-3 py-2">
                  <div class="flex items-center gap-2 min-w-0">
                    <UIcon
                      name="i-lucide-folder"
                      class="size-5 text-primary shrink-0"
                    />
                    <NuxtLink
                      :to="location(item.id)"
                      :draggable="false"
                      class="truncate font-semibold after:absolute after:inset-0 after:z-10 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-primary"
                      >{{ item.name }}</NuxtLink
                    >
                    <span class="text-xs text-muted shrink-0">{{
                      folderCount(item)
                    }}</span>
                  </div>
                </td>
                <td class="px-1 py-1">
                  <UButton
                    icon="i-lucide-settings"
                    :aria-label="`Settings for folder ${item.name}`"
                    color="neutral"
                    variant="ghost"
                    class="relative z-20"
                    @click="editFolder(item)"
                  />
                </td>
              </tr>
              <tr
                v-for="list in lists"
                :key="list.id"
                class="relative hover:bg-elevated/70 transition-colors cursor-pointer"
                :class="{ 'opacity-50': moving === list.id }"
                :draggable="own && !moving"
                :data-testid="`library-list-${list.id}`"
                @dragstart="dragStart($event, list)"
                @dragend="dragEnd"
              >
                <td class="px-3 py-2">
                  <div class="flex items-center gap-2 min-w-0">
                    <UIcon
                      :name="
                        list.kind === 'collection'
                          ? 'i-lucide-library'
                          : 'i-lucide-layers'
                      "
                      class="size-4 shrink-0 text-muted"
                    />
                    <NuxtLink
                      :to="`/lists/${list.id}`"
                      :draggable="false"
                      no-prefetch
                      class="min-w-0 truncate font-semibold after:absolute after:inset-0 after:z-10 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-primary"
                      >{{ list.name || 'Untitled' }}</NuxtLink
                    >
                  </div>
                </td>
                <td class="px-3 py-2">
                  <div
                    v-if="deckColors(list.color_ratios).length"
                    role="img"
                    :aria-label="`Deck colors: ${deckColors(list.color_ratios)
                      .map((color) => manaNames[color])
                      .join(', ')}`"
                    class="flex items-center gap-0.5 text-lg"
                  >
                    <ManaColorIcon
                      v-for="color in deckColors(list.color_ratios)"
                      :key="color"
                      :type="color"
                    />
                  </div>
                  <span v-else class="text-muted">—</span>
                </td>
                <td class="px-3 py-2 text-muted truncate">
                  {{ list.kind === 'collection' ? 'Collection' : list.format }}
                </td>
                <td v-if="view !== 'collections'" class="px-3 py-2">
                  <DeckBracketBadge
                    v-if="list.kind !== 'collection'"
                    :bracket="list.bracket"
                  />
                  <span v-else class="text-muted">—</span>
                </td>
                <td class="px-3 py-2 text-muted text-xs">
                  <time :datetime="list.updated_at || list.created_at">{{
                    new Date(
                      list.updated_at || list.created_at,
                    ).toLocaleDateString()
                  }}</time>
                </td>
                <td class="px-1 py-1">
                  <UButton
                    v-if="own"
                    icon="i-lucide-settings"
                    :aria-label="`Settings for ${list.name}`"
                    color="neutral"
                    variant="ghost"
                    class="relative z-20"
                    @click="settingsList = list"
                  />
                </td>
              </tr>
              <tr v-if="!lists.length && !rootFolders.length">
                <td
                  :colspan="columns.length + 1"
                  class="py-12 text-center text-muted"
                >
                  No {{ listLabel }} here yet.
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <div
        v-else-if="active.isLoading.value || (own && foldersLoading)"
        class="grid"
        :class="gridClass"
      >
        <CardListLinkSkeleton v-for="n in 8" :key="n" />
      </div>
      <p v-else-if="active.error?.value" role="alert" class="text-error">
        {{ active.error.value.message }}
      </p>
      <p
        v-else-if="!lists.length && !rootFolders.length"
        class="py-12 text-center text-muted"
      >
        {{
          folder ? `No ${listLabel} in this folder yet.` : 'No lists here yet.'
        }}
      </p>
      <div
        v-else
        class="grid"
        :class="[gridClass, { 'auto-rows-fr': own }]"
        :aria-busy="!!moving"
      >
        <div
          v-for="item in rootFolders"
          :key="item.id"
          class="relative rounded-lg border transition-colors group min-w-0 min-h-55 flex flex-col items-center justify-center gap-2 p-4 text-center"
          :class="
            dropTarget === item.id
              ? 'border-primary bg-primary/20 ring-2 ring-primary'
              : 'border-default bg-elevated/70 hover:border-primary'
          "
          :data-testid="`folder-${item.id}`"
          @dragover="dragOver($event, item.id)"
          @dragleave="dragLeave"
          @drop="drop($event, item.id)"
        >
          <UIcon name="i-lucide-folder" class="text-primary shrink-0 size-10" />
          <div class="min-w-0 w-full">
            <NuxtLink
              :to="location(item.id)"
              :draggable="false"
              class="font-semibold break-words after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-primary"
              >{{ item.name }}</NuxtLink
            >
            <p class="text-sm text-muted mt-1">{{ folderCount(item) }}</p>
          </div>
          <UButton
            icon="i-lucide-settings"
            :aria-label="`Settings for folder ${item.name}`"
            color="neutral"
            variant="ghost"
            class="z-10 absolute top-2 right-2"
            @click="editFolder(item)"
          />
        </div>
        <div
          v-for="list in lists"
          :key="list.id"
          class="min-w-0"
          :class="{ 'opacity-50': moving === list.id }"
          :draggable="own && !moving"
          :data-testid="`library-list-${list.id}`"
          @dragstart="dragStart($event, list)"
          @dragend="dragEnd"
        >
          <CardListLink
            :list="list"
            :show-settings-button="own"
            :show-author="!own"
            @settings="settingsList = list"
          />
        </div>
      </div>
      <UPagination
        v-if="active.totalPages.value > 1"
        v-model:page="page"
        :total="active.totalCount.value"
        :items-per-page="pageSize"
        class="mt-6 justify-center"
        :sibling-count="1"
        :ui="{ first: 'hidden', last: 'hidden' }"
        aria-label="Library pages bottom"
      />
    </ClientOnly>
    <LazyCreateDeckModal
      v-if="createOpen"
      v-model:open="createOpen"
      :kind="createKind"
      :folder-id="folder || undefined"
    />
    <DeckFolderSettingsModal
      v-if="folderDialogOpen"
      v-model:open="folderDialogOpen"
      :folder="editingFolder"
      :parent-id="folder || null"
      @deleted="folderDeleted"
    />
    <DeckSettingsModal
      v-if="settingsList"
      v-model:open="settingsOpen"
      :list="settingsList"
    />
  </div>
</template>
