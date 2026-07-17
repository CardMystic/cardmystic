<template>
  <div
    class="relative border max-w-[500px] border-black-300 dark:border-gray-400 rounded-lg overflow-hidden hover:border-primary transition-colors cursor-pointer group"
  >
    <!-- Background Image -->
    <div
      v-if="getListImageUrl(list)"
      class="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-80 dark:opacity-50 dark:group-hover:opacity-80 transition-opacity"
      :style="{ backgroundImage: `url(${getListImageUrl(list)})` }"
    ></div>
    <div
      class="absolute inset-0 bg-linear-to-t from-white/80 via-white/40 dark:from-black/80 dark:via-black/40 to-transparent"
    ></div>

    <!-- Delete Button (visible on hover) -->
    <UButton
      v-if="showDeleteButton"
      @click.stop="confirmDelete"
      class="cursor-pointer absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10"
      color="error"
      variant="solid"
      icon="i-lucide-trash-2"
      size="sm"
      aria-label="Delete list"
    />

    <!-- Content (clickable) -->
    <div class="relative p-2 md:p-4" @click="router.push(`/lists/${list.id}`)">
      <h3 class="text-base md:text-xl font-bold mb-1 md:mb-2">
        {{ list.name }}
      </h3>
      <p
        v-if="list.description"
        class="text-xs md:text-sm mb-2 md:mb-3 line-clamp-1"
      >
        {{ list.description }}
      </p>
      <p v-else class="text-xs md:text-sm mb-2 md:mb-3 opacity-60 italic">
        No description
      </p>
      <p
        v-if="list.commanders"
        class="text-xs md:text-sm mb-2 md:mb-3 line-clamp-1"
      >
        <span v-if="list.format == 'Commander'">
          <UIcon name="i-lucide-crown" class="w-3 h-3 md:w-4 md:h-4 shrink-0" />
          {{ list.commanders.join(', ') }}
        </span>
        <span v-else>
          <UIcon
            name="i-lucide-trophy"
            class="w-3 h-3 md:w-4 md:h-4 shrink-0"
          />
          {{ list.format }}
        </span>
      </p>

      <div class="flex items-center justify-between text-xs md:text-sm">
        <NuxtLink
          v-if="showAuthor && list.username"
          :to="`/user/${list.user_id}`"
          class="flex items-center gap-1 hover:text-primary truncate"
          @click.stop
        >
          <UIcon name="i-lucide-user" class="w-3 h-3 md:w-4 md:h-4 shrink-0" />
          <span class="truncate">{{ list.username }}</span>
        </NuxtLink>
        <span v-else-if="showAuthor" class="opacity-60 italic truncate">
          Anonymous
        </span>
        <span>{{
          formatShortDate(list.updated_at ? list.updated_at : list.created_at)
        }}</span>
        <UIcon name="i-lucide-chevron-right" class="w-4 h-4" />
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="isDeleteModalOpen" title="Delete List">
      <template #content>
        <div class="p-4 space-y-4">
          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete
            <span class="font-semibold text-white">"{{ list.name }}"</span>?
            This action cannot be undone.
          </p>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              label="Cancel"
              @click="
                () => {
                  isDeleteModalOpen = false;
                }
              "
              :disabled="deleteLoading"
            />
            <UButton
              color="error"
              variant="solid"
              label="Delete"
              :loading="deleteLoading"
              @click="handleDelete"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { formatShortDate } from '~/utils/dateFormatter';
import { useCardLists } from '~/composables/useCardLists';

const router = useRouter();
import { useToast } from '#imports';
import type { DecklistSummary } from '~/models/cardListModel';

type List = DecklistSummary;

const props = defineProps({
  list: {
    type: Object as () => List,
    required: true,
  },
  showDeleteButton: {
    type: Boolean,
    default: true,
  },
  showAuthor: {
    type: Boolean,
    default: false,
  },
});

const { deleteListMutation } = useCardLists();
const toast = useToast();

const isDeleteModalOpen = ref(false);
const deleteLoading = computed(() => deleteListMutation.isPending.value);

const confirmDelete = () => {
  isDeleteModalOpen.value = true;
};

const handleDelete = async () => {
  try {
    await deleteListMutation.mutateAsync(props.list.id);
    toast.add({
      title: 'List deleted',
      icon: 'i-lucide-trash-2',
    });
    isDeleteModalOpen.value = false;
  } catch (error: any) {
    toast.add({
      title: 'Error deleting list',
      description: error.message,
      color: 'error',
    });
  }
};

const getListImageUrl = (list: List) => {
  if (!list.avatar_card_name) return null;
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(list.avatar_card_name)}&format=image&version=art_crop`;
};
</script>
