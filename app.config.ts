// Keep field text readable at every control size; local `ui` overrides still apply.
const fieldText = {
  compoundVariants: [{ class: { base: 'text-base' } }],
};
const menuField = {
  ...fieldText,
  slots: { content: 'z-50' },
};

export default defineAppConfig({
  ui: {
    toast: {
      slots: {
        root: 'app-toast rounded-2xl px-3 py-2.5 gap-2',
        description: 'text-sm text-muted mt-0',
      },
    },
    input: fieldText,
    inputMenu: menuField,
    inputNumber: fieldText,
    inputTags: fieldText,
    select: menuField,
    selectMenu: menuField,
    dropdownMenu: { slots: { content: 'z-50' } },
    popover: { slots: { content: 'z-50' } },
    modal: { slots: { overlay: 'z-50', content: 'z-50' } },
    slideover: { slots: { overlay: 'z-50', content: 'z-50' } },
    textarea: fieldText,
  },
});
