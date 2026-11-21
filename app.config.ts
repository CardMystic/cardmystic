// Keep field text readable at every control size; local `ui` overrides still apply.
const fieldText = {
  compoundVariants: [{ class: { base: 'text-base' } }],
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
    inputMenu: fieldText,
    inputNumber: fieldText,
    inputTags: fieldText,
    select: fieldText,
    selectMenu: fieldText,
    textarea: fieldText,
  },
});
