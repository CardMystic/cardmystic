<template>
  <div
    ref="host"
    class="markdown-source-editor flex-1 min-h-0 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950"
  />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue';
import { EditorState, Transaction, Compartment } from '@codemirror/state';
import {
  EditorView,
  keymap,
  placeholder as editorPlaceholder,
} from '@codemirror/view';
import {
  defaultKeymap,
  history,
  historyKeymap,
  redo,
  isolateHistory,
} from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import {
  HighlightStyle,
  syntaxHighlighting,
  syntaxTree,
} from '@codemirror/language';
import { GFM } from '@lezer/markdown';
import { tags } from '@lezer/highlight';
import {
  cardMysticMarkdown,
  cardImageTag,
  cardLinkTag,
  manaSymbolTag,
  emojiTag,
  youtubeTag,
  searchEmbedTag,
  textColorTag,
  type MarkdownSourceEditorHandle,
  type EditorCardHover,
} from '~/utils/markdownEditorSyntax';

const props = defineProps<{
  modelValue: string;
  placeholder: string;
  active: boolean;
}>();
const emit = defineEmits<{
  'update:modelValue': [value: string];
  scroll: [position: { top: number; max: number }];
  'card-hover': [card: EditorCardHover];
  'card-leave': [];
}>();
const host = ref<HTMLElement | null>(null);
let view: EditorView | null = null;
let currentValue = props.modelValue;
const placeholderConfig = new Compartment();
const highlighting = HighlightStyle.define([
  { tag: tags.heading, class: 'cm-heading' },
  { tag: tags.strong, class: 'cm-strong' },
  { tag: tags.emphasis, class: 'cm-emphasis' },
  { tag: tags.quote, class: 'cm-quote' },
  { tag: tags.list, class: 'cm-list' },
  { tag: [tags.link, tags.url], class: 'cm-link' },
  { tag: tags.monospace, class: 'cm-code' },
  {
    tag: [tags.tagName, tags.angleBracket, tags.attributeName],
    class: 'cm-html',
  },
  { tag: cardImageTag, class: 'cm-card-image' },
  { tag: cardLinkTag, class: 'cm-card-link' },
  { tag: manaSymbolTag, class: 'cm-mana-symbol' },
  { tag: emojiTag, class: 'cm-emoji' },
  { tag: youtubeTag, class: 'cm-youtube' },
  { tag: searchEmbedTag, class: 'cm-search-embed' },
  { tag: textColorTag, class: 'cm-html' },
]);

onMounted(() => {
  view = new EditorView({
    parent: host.value!,
    state: EditorState.create({
      doc: props.modelValue,
      extensions: [
        history(),
        markdown({
          extensions: [GFM, cardMysticMarkdown],
          completeHTMLTags: false,
        }),
        syntaxHighlighting(highlighting),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          { key: 'Mod-Shift-z', run: redo },
        ]),
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({
          'aria-label': 'Markdown editor',
          spellcheck: 'true',
        }),
        placeholderConfig.of(editorPlaceholder(props.placeholder)),
        EditorView.theme({
          '&': { height: '100%', fontSize: '1rem' },
          '&.cm-focused': {
            outline: '2px solid var(--ui-primary)',
            outlineOffset: '-2px',
          },
          '.cm-scroller': {
            overflow: 'auto',
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            lineHeight: '1.5',
          },
          '.cm-content': { padding: '1rem 0', caretColor: 'currentColor' },
          '.cm-line': { padding: '0 1rem' },
          '.cm-placeholder': { color: 'rgb(156 163 175)' },
        }),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return;
          currentValue = update.state.doc.toString();
          emit('update:modelValue', currentValue);
        }),
        EditorView.domEventHandlers({
          scroll(_event, editor) {
            const element = editor.scrollDOM;
            emit('scroll', {
              top: element.scrollTop,
              max: element.scrollHeight - element.clientHeight,
            });
          },
          mousemove(event, editor) {
            const pos = editor.posAtCoords({
              x: event.clientX,
              y: event.clientY,
            });
            let node =
              pos === null
                ? null
                : syntaxTree(editor.state).resolveInner(pos, 1);
            while (
              node &&
              node.name !== 'CardLink' &&
              node.name !== 'CardImage'
            )
              node = node.parent;
            if (!node) {
              emit('card-leave');
              return;
            }
            const coords = editor.coordsAtPos(node.from);
            if (!coords) {
              emit('card-leave');
              return;
            }
            emit('card-hover', {
              name: editor.state.doc
                .sliceString(node.from + 2, node.to - 2)
                .trim(),
              left: coords.left,
              top: coords.top,
              bottom: coords.bottom,
            });
          },
          mouseleave() {
            emit('card-leave');
          },
        }),
      ],
    }),
  });
});

watch(
  () => props.modelValue,
  (value) => {
    if (!view || value === currentValue) return;
    currentValue = value;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
      annotations: Transaction.addToHistory.of(false),
    });
  },
);
watch(
  () => props.placeholder,
  (value) => {
    view?.dispatch({
      effects: placeholderConfig.reconfigure(editorPlaceholder(value)),
    });
  },
);
watch(
  () => props.active,
  async (active) => {
    if (active) {
      await nextTick();
      view?.requestMeasure();
    }
  },
);
onBeforeUnmount(() => {
  view?.destroy();
  view = null;
});

const handle: MarkdownSourceEditorHandle = {
  focus() {
    view?.focus();
  },
  getSelection() {
    const selection = view?.state.selection.main;
    return { from: selection?.from ?? 0, to: selection?.to ?? 0 };
  },
  replaceSelection(text, selection, replaceRange) {
    if (!view) return;
    const range = replaceRange ?? view.state.selection.main;
    view.dispatch({
      changes: { from: range.from, to: range.to, insert: text },
      selection: selection ?? { anchor: range.from + text.length },
      annotations: [
        Transaction.userEvent.of('input.toolbar'),
        isolateHistory.of('full'),
      ],
      scrollIntoView: true,
    });
    view.focus();
  },
};
defineExpose(handle);
</script>

<style>
.markdown-source-editor {
  overflow: hidden;
  color: var(--ui-text);
}
.markdown-source-editor .cm-heading,
.markdown-source-editor .cm-emoji {
  color: #b45309;
}
.markdown-source-editor .cm-strong,
.markdown-source-editor .cm-emphasis {
  color: #a16207;
}
.markdown-source-editor .cm-card-image {
  color: #047857;
  background: rgb(16 185 129 / 0.12);
}
.markdown-source-editor .cm-card-link {
  color: #2563eb;
  background: rgb(59 130 246 / 0.12);
}
.markdown-source-editor .cm-mana-symbol,
.markdown-source-editor .cm-code {
  color: #7c3aed;
}
.markdown-source-editor .cm-link,
.markdown-source-editor .cm-search-embed {
  color: #0891b2;
}
.markdown-source-editor .cm-html {
  color: #c026d3;
}
.markdown-source-editor .cm-quote {
  color: #64748b;
}
.markdown-source-editor .cm-list,
.markdown-source-editor .cm-youtube {
  color: #dc2626;
}
.dark .markdown-source-editor .cm-heading,
.dark .markdown-source-editor .cm-emoji {
  color: #f59e0b;
}
.dark .markdown-source-editor .cm-strong,
.dark .markdown-source-editor .cm-emphasis {
  color: #eab308;
}
.dark .markdown-source-editor .cm-card-image {
  color: #34d399;
}
.dark .markdown-source-editor .cm-card-link {
  color: #60a5fa;
}
.dark .markdown-source-editor .cm-mana-symbol,
.dark .markdown-source-editor .cm-code {
  color: #a78bfa;
}
</style>
