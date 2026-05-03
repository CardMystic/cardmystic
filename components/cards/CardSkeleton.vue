<template>
    <UCard variant="subtle" class="card-container" :ui="{ body: 'p-3 sm:p-4 w-full h-full' }">
        <!-- Card image skeleton -->
        <USkeleton :class="sizeClass" />

        <!-- Card Name and mana cost skeleton -->
        <div class="flex flex-col items-center justify-center text-center w-full mt-3">
            <div v-if="showCardInfo" class="flex flex-row items-center justify-between w-full gap-3">
                <USkeleton class="h-4 w-24" />
                <USkeleton class="h-4 w-14" />
            </div>
            <div v-if="showCardInfo" class="flex flex-row items-center justify-between w-full text-xs mt-1">
                <USkeleton class="h-3 w-20" />
            </div>
            <div class="flex flex-row items-center justify-center text-center w-full gap-2 mt-3">
                <USkeleton class="h-8 flex-1 rounded-md" />
                <USkeleton class="h-8 w-8 rounded-md" />
                <USkeleton class="h-8 w-8 rounded-md" />
                <USkeleton class="h-8 w-8 rounded-md" />
            </div>
        </div>
    </UCard>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { computed } from 'vue';

const props = defineProps({
    size: {
        type: String as PropType<'small' | 'large'>,
        default: 'large',
    },
    showCardInfo: {
        type: Boolean,
        default: false,
    },
});

const sizeClass = computed(() => `card-${props.size}`);
</script>

<style scoped>
.card-container {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    width: 100%;
    max-width: 330px;
    margin: 0 auto;
    box-sizing: border-box;
}

/* Small Size Variant */
.card-small {
    aspect-ratio: 5/7;
    width: 100%;
    border-radius: 8px;
}

/* Large Size Variant */
.card-large {
    aspect-ratio: 5/7;
    width: 100%;
    border-radius: 14px;
}
</style>
