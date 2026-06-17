<template>
  <div class="flex flex-col grow min-h-0 gap-3 pb-16">
    <!-- Mode toggle / action bar -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex flex-wrap items-center gap-2">
        <UButton
          v-if="editable && mode === 'edit'"
          icon="i-lucide-eye"
          color="primary"
          variant="solid"
          label="View Preview"
          class="cursor-pointer"
          @click="mode = 'preview'"
        />
        <UButton
          v-if="editable && mode === 'edit'"
          icon="i-lucide-columns-2"
          color="primary"
          variant="solid"
          label="Split Preview"
          class="cursor-pointer hidden lg:inline-flex"
          @click="mode = 'split'"
        />
        <UButton
          v-if="editable && (mode === 'preview' || mode === 'split')"
          icon="i-lucide-pencil"
          color="primary"
          variant="outline"
          label="Back to Edit"
          class="cursor-pointer"
          @click="mode = 'edit'"
        />
      </div>
      <div
        v-if="editable && (mode === 'edit' || mode === 'split')"
        class="flex items-center gap-2"
      >
        <span
          v-if="isDirty"
          class="text-xs text-gray-500 dark:text-gray-400 italic"
          >Unsaved changes</span
        >
        <span
          v-else-if="lastSavedAt"
          class="text-xs text-gray-500 dark:text-gray-400 italic"
          >Saved</span
        >
        <UButton
          icon="i-lucide-save"
          color="success"
          variant="solid"
          label="Save"
          class="cursor-pointer"
          :disabled="!isDirty || isSaving"
          :loading="isSaving"
          @click="handleSave"
        />
      </div>
    </div>

    <!-- Edit-only mode -->
    <div
      v-if="editable && mode === 'edit'"
      class="flex flex-col grow min-h-0 gap-2"
    >
      <!-- Toolbar -->
      <div
        class="shrink-0 flex flex-wrap items-center gap-1 p-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
      >
        <template v-for="(group, gi) in toolbarGroups" :key="gi">
          <div
            v-if="gi > 0"
            class="w-px h-5 self-center shrink-0 bg-gray-300 dark:bg-gray-600 mx-0.5"
          />
          <UTooltip
            v-for="action in group"
            :key="action.id"
            :text="action.tooltip"
          >
            <UButton
              :icon="action.icon"
              color="neutral"
              variant="ghost"
              size="sm"
              class="cursor-pointer"
              @click="applyAction(action.id)"
            />
          </UTooltip>
        </template>
      </div>

      <textarea
        ref="textareaRef"
        v-model="draft"
        placeholder="Describe how this deck wins, key combos, mulligan guide, sideboard plans, etc. Markdown supported."
        class="flex-1 min-h-0 w-full p-4 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-base font-mono outline-none focus:ring-2 focus:ring-primary-500 resize-none overflow-y-auto"
        spellcheck="true"
      />
    </div>

    <!-- Split mode (editor + live preview side by side, lg+ only) -->
    <div
      v-else-if="editable && mode === 'split'"
      class="flex grow min-h-0 gap-4"
    >
      <!-- Left: editor -->
      <div class="flex-1 min-w-0 flex flex-col gap-2">
        <!-- Toolbar -->
        <div
          class="shrink-0 flex flex-wrap items-center gap-1 p-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
        >
          <template v-for="(group, gi) in toolbarGroups" :key="gi">
            <div
              v-if="gi > 0"
              class="w-px h-5 self-center shrink-0 bg-gray-300 dark:bg-gray-600 mx-0.5"
            />
            <UTooltip
              v-for="action in group"
              :key="action.id"
              :text="action.tooltip"
            >
              <UButton
                :icon="action.icon"
                color="neutral"
                variant="ghost"
                size="sm"
                class="cursor-pointer"
                @click="applyAction(action.id)"
              />
            </UTooltip>
          </template>
        </div>

        <textarea
          ref="textareaRef"
          v-model="draft"
          placeholder="Describe how this deck wins, key combos, mulligan guide, sideboard plans, etc. Markdown supported."
          class="flex-1 min-h-0 w-full p-4 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-base font-mono outline-none focus:ring-2 focus:ring-primary-500 resize-none overflow-y-auto"
          spellcheck="true"
          @scroll="onEditorScroll"
        />
      </div>

      <!-- Right: live preview -->
      <div
        ref="previewRef"
        class="primer-preview flex-1 min-w-0 min-h-0 p-6 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 overflow-y-auto"
      >
        <div v-if="renderedHtml" v-html="renderedHtml"></div>
        <p
          v-else
          class="text-gray-500 dark:text-gray-400 italic text-center py-8"
        >
          Start typing to see a preview.
        </p>
      </div>
    </div>

    <!-- Preview-only mode -->
    <div
      v-else
      class="primer-preview grow min-h-0 overflow-y-auto p-6 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950"
    >
      <div v-if="renderedHtml" v-html="renderedHtml"></div>
      <p
        v-else
        class="text-gray-500 dark:text-gray-400 italic text-center py-8"
      >
        No primer has been written yet.
      </p>
    </div>

    <!-- Unsaved changes confirmation modal -->
    <UModal v-model:open="showUnsavedModal" title="Unsaved Changes">
      <template #content>
        <div class="p-4 space-y-4">
          <p class="text-gray-600 dark:text-gray-400">
            You have unsaved changes. Are you sure you want to leave?
          </p>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              label="Stay"
              @click="stayOnPage"
            />
            <UButton
              color="error"
              variant="solid"
              label="Leave without saving"
              @click="leaveWithoutSaving"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useCardsByName } from '~/composables/useCards';
import { getCardImageUrl } from '~/utils/scryfall';

const props = defineProps<{
  modelValue: string;
  editable: boolean;
  isSaving?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'save', value: string): void;
}>();

const mode = ref<'edit' | 'split' | 'preview'>(
  props.editable ? 'edit' : 'preview',
);
const draft = ref(props.modelValue);
const lastSavedAt = ref<number | null>(null);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const previewRef = ref<HTMLDivElement | null>(null);

// --- Unsaved changes guard ---
const showUnsavedModal = ref(false);
type NavGuardNext = Parameters<Parameters<typeof onBeforeRouteLeave>[0]>[2];
const pendingNavigation = ref<NavGuardNext | null>(null);

onBeforeRouteLeave((to, from, next) => {
  if (!isDirty.value) {
    next();
    return;
  }
  pendingNavigation.value = next;
  showUnsavedModal.value = true;
});

function stayOnPage() {
  pendingNavigation.value?.(false);
  pendingNavigation.value = null;
  showUnsavedModal.value = false;
}

function leaveWithoutSaving() {
  showUnsavedModal.value = false;
  pendingNavigation.value?.();
  pendingNavigation.value = null;
}

function handleBeforeUnload(e: BeforeUnloadEvent) {
  if (isDirty.value) {
    e.preventDefault();
    e.returnValue = '';
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
});

// --- Scroll sync: editor → preview ---
function onEditorScroll() {
  const ta = textareaRef.value;
  const pr = previewRef.value;
  if (!ta || !pr) return;
  const maxEditorScroll = ta.scrollHeight - ta.clientHeight;
  if (maxEditorScroll <= 0) return;
  const ratio = ta.scrollTop / maxEditorScroll;
  const maxPreviewScroll = pr.scrollHeight - pr.clientHeight;
  pr.scrollTop = ratio * maxPreviewScroll;
}

// --- Card embeds: ((Card Name)) and [[Card Name]] ---
// Collect all unique card names referenced in the current preview source.
const previewSource = computed(() => {
  const src =
    (mode.value === 'preview' || mode.value === 'split') && props.editable
      ? draft.value
      : props.modelValue;
  return src ?? '';
});

const referencedCardNames = computed(() => {
  const names = new Set<string>();
  const imgPattern = /\(\(([^)]+)\)\)/g;
  const linkPattern = /\[\[([^\]]+)\]\]/g;
  let m;
  while ((m = imgPattern.exec(previewSource.value)) !== null)
    names.add(m[1].trim());
  while ((m = linkPattern.exec(previewSource.value)) !== null)
    names.add(m[1].trim());
  return [...names];
});

const { cards: referencedCards } = useCardsByName(referencedCardNames);

// Map from card name (lowercase) → image URL for fast lookup during render.
const cardImageMap = computed(() => {
  const map = new Map<string, { imageUrl: string; oracleId: string }>();
  for (const card of referencedCards.value ?? []) {
    const imageUrl = getCardImageUrl(card.card_data, false, 'normal');
    map.set(card.card_data.name.toLowerCase(), {
      imageUrl,
      oracleId: card.card_data.oracle_id,
    });
  }
  return map;
});

watch(
  () => props.modelValue,
  (val) => {
    if (val !== draft.value) draft.value = val;
  },
);

const isDirty = computed(() => draft.value !== props.modelValue);

function handleSave() {
  emit('update:modelValue', draft.value);
  emit('save', draft.value);
  lastSavedAt.value = Date.now();
}

const renderedHtml = computed(() => {
  const src = previewSource.value;
  if (!src?.trim()) return '';
  if (!import.meta.client) return '';

  // --- Pre-process: extract special tokens before markdown sees them ---
  const ytIds: string[] = [];
  // Card image tokens: ((Card Name))
  const cardImgNames: string[] = [];
  // Card link tokens: [[Card Name]]
  const cardLinkNames: string[] = [];

  let pre = src.replace(/@\[youtube\]\(([A-Za-z0-9_-]{11})\)/g, (_, id) => {
    const i = ytIds.push(id) - 1;
    return `\n\nYTEMBEDTOKEN${i}YTEMBEDTOKEN\n\n`;
  });

  pre = pre.replace(/\(\(([^)\n]+)\)\)/g, (_, name) => {
    const i = cardImgNames.push(name.trim()) - 1;
    return `CARDIMGTOKEN${i}CARDIMGTOKEN`;
  });

  pre = pre.replace(/\[\[([^\]\n]+)\]\]/g, (_, name) => {
    const i = cardLinkNames.push(name.trim()) - 1;
    return `CARDLINKTOKEN${i}CARDLINKTOKEN`;
  });

  const html = marked.parse(pre, { async: false }) as string;
  const sanitized = DOMPurify.sanitize(html, {
    // Allow style attributes so card-inline-link can carry --card-img CSS variable.
    ALLOWED_ATTR: [
      'href',
      'src',
      'alt',
      'title',
      'loading',
      'frameborder',
      'allowfullscreen',
      'class',
      'style',
      'open',
    ],
    ADD_TAGS: ['details', 'summary', 'iframe'],
  });

  // --- Post-process: swap tokens back with final HTML ---
  let result = sanitized.replace(/YTEMBEDTOKEN(\d+)YTEMBEDTOKEN/g, (_, idx) => {
    const id = ytIds[Number(idx)];
    if (!id) return '';
    return `<div class="youtube-embed"><iframe src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen loading="lazy" title="YouTube video"></iframe></div>`;
  });

  result = result.replace(/CARDIMGTOKEN(\d+)CARDIMGTOKEN/g, (_, idx) => {
    const name = cardImgNames[Number(idx)];
    if (!name) return '';
    const entry = cardImageMap.value.get(name.toLowerCase());
    if (!entry) return `<em class="card-unknown">${name}</em>`;
    return `<a class="card-inline-img-link" href="/card/${entry.oracleId}"><img class="card-inline-img" src="${entry.imageUrl}" alt="${name}" loading="lazy" /></a>`;
  });

  result = result.replace(/CARDLINKTOKEN(\d+)CARDLINKTOKEN/g, (_, idx) => {
    const name = cardLinkNames[Number(idx)];
    if (!name) return '';
    const entry = cardImageMap.value.get(name.toLowerCase());
    const href = entry ? `/card/${entry.oracleId}` : '#';
    const styleAttr = entry
      ? ` style="--card-img: url('${entry.imageUrl}')"`
      : '';
    return `<a class="card-inline-link" href="${href}"${styleAttr}>${name}</a>`;
  });

  return result;
});

type ToolbarActionId =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bold'
  | 'italic'
  | 'ul'
  | 'ol'
  | 'quote'
  | 'link'
  | 'hr'
  | 'image'
  | 'table'
  | 'collapsible'
  | 'youtube'
  | 'card-image'
  | 'card-link';

interface ToolbarAction {
  id: ToolbarActionId;
  icon: string;
  tooltip: string;
}

const toolbarGroups: ToolbarAction[][] = [
  [
    { id: 'h1', icon: 'i-lucide-heading-1', tooltip: 'Heading 1' },
    { id: 'h2', icon: 'i-lucide-heading-2', tooltip: 'Heading 2' },
    { id: 'h3', icon: 'i-lucide-heading-3', tooltip: 'Heading 3' },
  ],
  [
    { id: 'bold', icon: 'i-lucide-bold', tooltip: 'Bold' },
    { id: 'italic', icon: 'i-lucide-italic', tooltip: 'Italic' },
  ],
  [
    { id: 'ul', icon: 'i-lucide-list', tooltip: 'Bulleted list' },
    { id: 'ol', icon: 'i-lucide-list-ordered', tooltip: 'Numbered list' },
    { id: 'quote', icon: 'i-lucide-quote', tooltip: 'Quote' },
  ],
  [
    { id: 'link', icon: 'i-lucide-link', tooltip: 'Link' },
    { id: 'image', icon: 'i-lucide-image', tooltip: 'Image' },
    { id: 'hr', icon: 'i-lucide-minus', tooltip: 'Horizontal rule' },
  ],
  [
    { id: 'table', icon: 'i-lucide-table', tooltip: 'Table' },
    {
      id: 'collapsible',
      icon: 'i-lucide-chevrons-down-up',
      tooltip: 'Collapsible section',
    },
    { id: 'youtube', icon: 'i-lucide-youtube', tooltip: 'YouTube embed' },
  ],
  [
    {
      id: 'card-image',
      icon: 'i-lucide-image-plus',
      tooltip: 'Embed card image  ((Card Name))',
    },
    {
      id: 'card-link',
      icon: 'i-lucide-external-link',
      tooltip: 'Card link with hover preview  [[Card Name]]',
    },
  ],
];

// Flat list used only for action lookup
const toolbarActions: ToolbarAction[] = toolbarGroups.flat();

function applyAction(id: ToolbarActionId) {
  const el = textareaRef.value;
  if (!el) return;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const value = draft.value;
  const selected = value.slice(start, end);

  let before = '';
  let after = '';
  let placeholder = '';
  let blockMode = false;

  switch (id) {
    case 'h1':
      before = '# ';
      placeholder = 'Heading';
      blockMode = true;
      break;
    case 'h2':
      before = '## ';
      placeholder = 'Heading';
      blockMode = true;
      break;
    case 'h3':
      before = '### ';
      placeholder = 'Heading';
      blockMode = true;
      break;
    case 'bold':
      before = '**';
      after = '**';
      placeholder = 'bold text';
      break;
    case 'italic':
      before = '_';
      after = '_';
      placeholder = 'italic text';
      break;
    case 'ul':
      return applyListPrefix('- ', 'List item');
    case 'ol':
      return applyListPrefix('1. ', 'List item', true);
    case 'quote':
      return applyListPrefix('> ', 'Quote');
    case 'link': {
      before = '[';
      after = `](url)`;
      placeholder = 'link_text';
      break;
    }
    case 'image':
      return insertAtCursor(`![image_name](image_url)\n`);
    case 'table':
      insertAtCursor(
        ensureBlockBoundary(value, start) +
          '| Header 1 | Header 2 | Header 3 |\n' +
          '| --- | --- | --- |\n' +
          '| Cell | Cell | Cell |\n' +
          '| Cell | Cell | Cell |\n\n',
      );
      return;
    case 'collapsible':
      insertAtCursor(
        ensureBlockBoundary(value, start) +
          `<details open>\n<summary>Details</summary>\n\nContent here.\n\n</details>\n\n`,
      );
      return;
    case 'youtube': {
      const input = window.prompt('YouTube URL or Video ID');
      if (!input) return;
      const match = input.match(
        /(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/,
      );
      const videoId = match ? match[1] : input.trim();
      if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
        window.alert('Could not find a valid YouTube video ID.');
        return;
      }
      insertAtCursor(
        ensureBlockBoundary(value, start) + `@[youtube](${videoId})\n\n`,
      );
      return;
    }
    case 'hr':
      insertAtCursor('\n\n---\n\n');
      return;
    case 'card-image': {
      const name = selected || 'Card Name';
      insertAtCursor(`((${name}))`);
      return;
    }
    case 'card-link': {
      const name = selected || 'Card Name';
      insertAtCursor(`[[${name}]]`);
      return;
    }
  }

  const text = selected || placeholder;
  const insertion = blockMode
    ? ensureBlockBoundary(value, start) + before + text + after
    : before + text + after;

  // Use execCommand so the browser undo stack is preserved.
  el.focus();
  el.setSelectionRange(start, end);
  document.execCommand('insertText', false, insertion);

  nextTick(() => {
    if (!textareaRef.value) return;
    textareaRef.value.focus();
    const selStart = start + insertion.length - after.length - text.length;
    const selEnd = selStart + text.length;
    textareaRef.value.setSelectionRange(selStart, selEnd);
  });
}

function ensureBlockBoundary(value: string, pos: number) {
  if (pos === 0) return '';
  if (value[pos - 1] === '\n' && (pos < 2 || value[pos - 2] === '\n')) {
    return '';
  }
  return value[pos - 1] === '\n' ? '\n' : '\n\n';
}

function applyListPrefix(
  prefix: string,
  placeholder: string,
  numbered = false,
) {
  const el = textareaRef.value;
  if (!el) return;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const value = draft.value;
  const selected = value.slice(start, end);

  const lines = (selected || placeholder).split('\n');
  const prefixed = lines
    .map((line, i) => {
      const p = numbered ? `${i + 1}. ` : prefix;
      return p + (line || (selected ? '' : placeholder));
    })
    .join('\n');

  const boundary = ensureBlockBoundary(value, start);
  const insertion = boundary + prefixed;

  el.focus();
  el.setSelectionRange(start, end);
  document.execCommand('insertText', false, insertion);

  nextTick(() => {
    if (!textareaRef.value) return;
    textareaRef.value.focus();
    const selStart = start + boundary.length;
    const selEnd = selStart + prefixed.length;
    textareaRef.value.setSelectionRange(selStart, selEnd);
  });
}

function insertAtCursor(text: string) {
  const el = textareaRef.value;
  if (!el) return;
  const start = el.selectionStart;
  el.focus();
  document.execCommand('insertText', false, text);
  nextTick(() => {
    if (!textareaRef.value) return;
    textareaRef.value.setSelectionRange(
      start + text.length,
      start + text.length,
    );
  });
}
</script>

<style scoped>
.primer-preview :deep(h1) {
  font-size: 2rem;
  font-weight: 700;
  margin: 1.25rem 0 0.75rem;
  line-height: 1.2;
}
.primer-preview :deep(h2) {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 1.1rem 0 0.6rem;
  line-height: 1.25;
}
.primer-preview :deep(h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1rem 0 0.5rem;
}
.primer-preview :deep(h4),
.primer-preview :deep(h5),
.primer-preview :deep(h6) {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0.9rem 0 0.4rem;
}
.primer-preview :deep(p) {
  margin: 0.6rem 0;
  line-height: 1.65;
}
.primer-preview :deep(ul) {
  list-style: disc;
  padding-left: 1.5rem;
  margin: 0.6rem 0;
}
.primer-preview :deep(ol) {
  list-style: decimal;
  padding-left: 1.5rem;
  margin: 0.6rem 0;
}
.primer-preview :deep(li) {
  margin: 0.25rem 0;
}
.primer-preview :deep(blockquote) {
  border-left: 4px solid var(--ui-primary);
  padding: 0.25rem 0 0.25rem 1rem;
  margin: 0.75rem 0;
  color: rgb(107 114 128);
  font-style: italic;
}
.primer-preview :deep(code) {
  background: rgba(127, 127, 127, 0.15);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-size: 0.9em;
}
.primer-preview :deep(pre) {
  background: rgba(127, 127, 127, 0.12);
  padding: 0.85rem 1rem;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0.75rem 0;
}
.primer-preview :deep(pre code) {
  background: transparent;
  padding: 0;
}
.primer-preview :deep(a) {
  color: var(--ui-primary);
  text-decoration: underline;
}
.primer-preview :deep(hr) {
  border: 0;
  border-top: 1px solid rgba(127, 127, 127, 0.3);
  margin: 1.25rem 0;
}
.primer-preview :deep(table) {
  border-collapse: collapse;
  margin: 0.75rem 0;
  width: 100%;
}
.primer-preview :deep(th),
.primer-preview :deep(td) {
  border: 1px solid rgba(127, 127, 127, 0.3);
  padding: 0.4rem 0.6rem;
}
.primer-preview :deep(th) {
  background: rgba(127, 127, 127, 0.08);
  font-weight: 600;
}
.primer-preview :deep(details) {
  border: 1px solid rgba(127, 127, 127, 0.3);
  border-radius: 6px;
  padding: 0.5rem 1rem;
  margin: 0.75rem 0;
}
.primer-preview :deep(summary) {
  cursor: pointer;
  font-weight: 600;
  padding: 0.25rem 0;
  user-select: none;
}
.primer-preview :deep(details[open] summary) {
  margin-bottom: 0.5rem;
}
.primer-preview :deep(.youtube-embed) {
  position: relative;
  padding-bottom: 56.25%;
  height: 0;
  overflow: hidden;
  margin: 1rem 0;
  border-radius: 6px;
}
.primer-preview :deep(.youtube-embed iframe) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 0;
}
.primer-preview :deep(.card-inline-img-link) {
  display: inline-block;
  text-decoration: none;
}
.primer-preview :deep(.card-inline-img) {
  display: inline-block;
  width: 200px;
  border-radius: 10px;
  vertical-align: middle;
  margin: 0.25rem;
}
.primer-preview :deep(.card-inline-link) {
  color: #3b82f6;
  text-decoration: underline;
  cursor: pointer;
  position: relative;
}
.primer-preview :deep(.card-inline-link::after) {
  content: '';
  display: none;
  position: absolute;
  left: 50%;
  bottom: calc(100% + 6px);
  transform: translateX(-50%);
  width: 200px;
  height: 279px;
  background-image: var(--card-img);
  background-size: cover;
  background-position: center;
  border-radius: 10px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  z-index: 100;
}
.primer-preview :deep(.card-inline-link:hover::after) {
  display: block;
}
.primer-preview :deep(.card-unknown) {
  color: #f87171;
  font-style: italic;
}
</style>
