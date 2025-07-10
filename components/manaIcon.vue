<template>
    <span :class="iconClass" aria-hidden="true"></span>
</template>

<script>
export default {
    name: 'ManaIcon',
    props: {
        type: {
            type: String,
            required: true
        }
    },
    computed: {
        iconClass() {
            return `ms ms-${this.type.toLowerCase()} ms-cost`;
        }
    }
};
</script>

<style scoped>
.ms {
    margin: 0 2px;
}
</style>