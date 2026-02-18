<template>
    <UCard variant="subtle" class="card-container px-0" :ui="{ body: 'sm:px-2 sm:py-2 w-full h-full' }">
        <!-- Card image skeleton -->
        <USkeleton :class="sizeClass" />

        <!-- Card Name and mana cost skeleton -->
        <div class="flex flex-col items-center justify-center text-center">
            <div v-if="showCardInfo" class="flex flex-row items-center justify-between w-full">
                <USkeleton class="h-4 w-20" />
                <USkeleton class="h-4 w-12" />
            </div>
            <div v-if="showCardInfo" class="flex flex-row items-center justify-between w-full text-xs mt-1">
                <USkeleton class="h-3 w-16" />
            </div>
            <div class="flex flex-row items-center justify-center text-center w-full mt-2">
                <USkeleton class="h-2 w-full mr-2" />
                <USkeleton class="h-3 w-8" />
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
    align-items: center;
    justify-content: center;
}

/* Small Size Variant */
.card-small {
    aspect-ratio: 5/7;
    width: 100%;
    max-width: 200px;
    border-radius: 8px;
}

/* Large Size Variant */
.card-large {
    aspect-ratio: 5/7;
    width: 100%;
    max-width: 300px;
    border-radius: 14px;
}
</style>
