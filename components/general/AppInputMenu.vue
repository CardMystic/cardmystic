<script setup lang="ts">
// Keep the input-menu behavior consistent in search forms and nested dialogs.
// Reka refocuses its input on close; opening on focus then reopens the menu.
defineOptions({ inheritAttrs: false });
const props = defineProps<{ retainFocusOnSelect?: boolean }>();
const attrs = useAttrs();
const open = ref(false);
const menu = useTemplateRef<{
  inputRef?: { $el?: HTMLInputElement };
}>('menu');
const inputRef = computed(() => menu.value?.inputRef);
defineExpose({ inputRef });
let outsideFocus: HTMLElement | null | undefined;
let selected = false;

async function updateOpen(value: boolean) {
  open.value = value;
  if (value) {
    outsideFocus = undefined;
    selected = false;
  }
  if (!value) {
    if (selected && props.retainFocusOnSelect) return;
    const previousFocus =
      outsideFocus === undefined ? document.activeElement : outsideFocus;
    outsideFocus = undefined;
    await nextTick();
    const input = inputRef.value?.$el;
    if (document.activeElement === input) {
      input?.blur();
      if (
        previousFocus instanceof HTMLElement &&
        previousFocus !== input &&
        previousFocus.isConnected
      )
        previousFocus.focus({ preventScroll: true });
    }
  }
}

function closeMenu() {
  // Use the normal toggle so Reka also resets its internal search state.
  if (open.value)
    inputRef.value?.$el?.parentElement
      .querySelector<HTMLButtonElement>('button[aria-haspopup="listbox"]')
      ?.click();
}

function trackOutsideFocus(event: Event) {
  if (event.defaultPrevented) return;
  outsideFocus =
    event.target instanceof Element
      ? event.target.closest<HTMLElement>(
          'input, textarea, select, button, a[href], [tabindex]',
        )
      : null;
}

function dismissFocusOutside(event: Event) {
  if (event.defaultPrevented) return;
  trackOutsideFocus(event);
  closeMenu();
}

async function finishInput(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.isComposing || attrs.multiple != null)
    return;
  // Let the highlighted option finish selecting before dismissing the keyboard.
  await nextTick();
  if (selected && props.retainFocusOnSelect) return;
  closeMenu();
  inputRef.value?.$el?.blur();
}
</script>

<template>
  <UInputMenu
    ref="menu"
    v-bind="attrs"
    :open-on-focus="false"
    open-on-click
    :content="{
      ...((attrs.content as Record<string, unknown>) ?? {}),
      onPointerDownOutside: trackOutsideFocus,
      onFocusOutside: dismissFocusOutside,
    }"
    @update:open="updateOpen"
    @update:model-value="selected = true"
    @keydown="finishInput"
  >
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </UInputMenu>
</template>
