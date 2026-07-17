<template>
  <NuxtLink
    :to="`/user/${owner.id}`"
    class="flex items-center gap-3 mb-4 p-3 rounded-lg border border-black-300 dark:border-gray-400 hover:border-primary transition-colors cursor-pointer group"
  >
    <img
      v-if="owner.avatar_card_name"
      :src="`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(owner.avatar_card_name)}&format=image&version=art_crop`"
      :alt="owner.username ?? 'User'"
      class="w-10 h-10 rounded-full object-cover"
    />
    <UIcon v-else name="i-lucide-user" class="w-10 h-10 opacity-50" />
    <div class="min-w-0">
      <p
        class="font-semibold truncate group-hover:text-primary transition-colors"
      >
        {{ owner.username || 'Anonymous' }}
      </p>
      <p class="text-xs opacity-60">Deck author</p>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps<{
  owner: {
    id: string;
    username: string | null;
    avatar_card_name: string | null;
  };
}>();
</script>
