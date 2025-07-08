<template>
    <span :class="iconClass" aria-hidden="true"></span>
</template>

<script>
export default {
    name: 'ManaIcon',
    props: {
        type: {
            type: String,
            required: true,
            validator: value =>
                [
                    'c', 'w', 'u', 'b', 'r', 'g'
                ].includes(value.toLowerCase())
        }
    },
    computed: {
        iconClass() {
            return `ms ms-${this.type.toLowerCase()} ms-cost`;
        }
    }
};
</script>

<!--
    Usage:
    <ManaIcon type="blue" size="32" />
    Requires mana-icons CSS to be loaded globally.
-->