<template>
  <div
    class="relative border border-black-300 dark:border-gray-400 rounded-lg overflow-hidden hover:border-primary transition-colors cursor-pointer group">
    <!-- Background Image -->
    <div v-if="getListImageUrl(list)"
      class="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-80 dark:opacity-50 dark:group-hover:opacity-80 transition-opacity"
      :style="{ backgroundImage: `url(${getListImageUrl(list)})` }"></div>
    <div
      class="absolute inset-0 bg-gradient-to-t from-white/80 via-white/40 dark:from-black/80 dark:via-black/40 to-transparent">
    </div>

    <!-- Delete Button (visible on hover) -->
    <UButton v-if="showDeleteButton" @click.stop="$emit('delete')"
      class="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10"
      color="error" variant="solid" icon="i-lucide-trash-2" size="sm" aria-label="Delete list" />

    <!-- Content (clickable) -->
    <div class="relative p-4" @click="navigateTo(`/lists/${list.id}`)">
      <h3 class="text-xl font-semibold mb-2">{{ list.name }}</h3>
      <p v-if="list.description" class="text-sm mb-3 line-clamp-1">
        {{ list.description }}
      </p>
      <div class="flex items-center justify-between text-sm">
        <span>{{ formatShortDate(list.updated_at) }}</span>
        <UIcon name="i-lucide-chevron-right" class="w-4 h-4" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatShortDate } from '~/utils/dateFormatter';

interface List {
  id: string;
  name: string;
  description?: string;
  updated_at: string;
  avatar_card_name?: string;
}

interface Props {
  list: List;
  showDeleteButton?: boolean;
}

withDefaults(defineProps<Props>(), {
  showDeleteButton: true,
});

defineEmits<{
  delete: [];
}>();

const getListImageUrl = (list: List) => {
  if (!list.avatar_card_name) return null;
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(list.avatar_card_name)}&format=image&version=art_crop`;
};
</script>
