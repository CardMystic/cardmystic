// Keep field text readable at every control size; local `ui` overrides still apply.
const fieldText = {
  compoundVariants: [{ class: { base: 'text-base' } }],
};

export default defineAppConfig({
  ui: {
    input: fieldText,
    inputMenu: fieldText,
    inputNumber: fieldText,
    inputTags: fieldText,
    select: fieldText,
    selectMenu: fieldText,
    textarea: fieldText,
  },
});
