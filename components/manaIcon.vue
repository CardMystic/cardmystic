<template>
  <span :class="iconClass" id="mana-icon" aria-hidden="true"></span>
</template>

<script>
export default {
  name: 'ManaIcon',
  props: {
    type: {
      type: String,
      required: true,
    },
  },
  computed: {
    iconClass() {
      return `ms ms-${this.type.toLowerCase()} ms-cost`;
    },
  },
};
</script>

<style scoped>
#mana-icon {
  margin: 0 2px 0 0;
  margin-inline-start: 0 !important;
  vertical-align: unset;
  font-size: 0.7em;
}
</style>
