<template>
  <div class="mt-8 w-full">
    <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
      <UIcon name="i-lucide-message-circle" class="w-5 h-5" />
      Comments
    </h2>

    <!-- Add comment (logged-in users only) -->
    <ClientOnly>
      <div v-if="isLoggedIn" class="mb-6 space-y-2">
        <UTextarea
          v-model="newComment"
          placeholder="Share your thoughts on this deck..."
          :rows="3"
          :maxlength="2000"
          class="w-full"
        />
        <div class="flex justify-end">
          <UButton
            label="Post Comment"
            color="primary"
            size="sm"
            class="cursor-pointer"
            :loading="isAddingComment"
            :disabled="!newComment.trim()"
            @click="handleAddComment"
          />
        </div>
      </div>
      <p v-else class="mb-6 text-sm opacity-70 italic">
        Sign in to leave a comment.
      </p>
    </ClientOnly>

    <!-- Comment list: scrollable chat-style container. Own comments are
         highlighted and right-aligned (client-only — depends on auth state). -->
    <ClientOnly>
      <div
        class="w-full max-h-96 overflow-y-auto p-4 border border-black-300 dark:border-gray-400 rounded-lg bg-white/60 dark:bg-black/40"
      >
        <div v-if="isLoading" class="space-y-3">
          <USkeleton v-for="i in 3" :key="i" class="h-16 w-full" />
        </div>
        <p
          v-else-if="comments.length === 0"
          class="text-sm opacity-70 italic text-center py-6"
        >
          No comments yet. Be the first to comment!
        </p>
        <div v-else class="space-y-3">
          <div
            v-for="comment in comments"
            :key="comment.id"
            class="flex"
            :class="isOwnComment(comment) ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-[80%] px-3 py-2 rounded-2xl"
              :class="
                isOwnComment(comment)
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-gray-200 dark:bg-gray-700 rounded-bl-sm'
              "
            >
              <div class="flex items-center gap-2 mb-1">
                <NuxtLink
                  v-if="!isOwnComment(comment)"
                  :to="`/user/${comment.user_id}`"
                  class="flex items-center gap-1 text-sm font-semibold hover:text-primary"
                >
                  <UIcon name="i-lucide-user" class="w-4 h-4" />
                  {{ comment.username ?? 'Anonymous' }}
                </NuxtLink>
                <span
                  class="text-xs"
                  :class="
                    isOwnComment(comment) ? 'text-white/70' : 'opacity-60'
                  "
                >
                  {{ formatShortDate(comment.created_at) }}
                </span>
                <UButton
                  v-if="canDelete(comment)"
                  icon="i-lucide-trash-2"
                  :color="isOwnComment(comment) ? 'neutral' : 'error'"
                  variant="ghost"
                  size="xs"
                  class="cursor-pointer"
                  :class="
                    isOwnComment(comment)
                      ? 'text-white/80 hover:text-white'
                      : ''
                  "
                  aria-label="Delete comment"
                  @click="handleDeleteComment(comment.id)"
                />
              </div>
              <p class="text-sm whitespace-pre-wrap wrap-break-word">
                {{ comment.body }}
              </p>
            </div>
          </div>

          <div v-if="hasNextPage" class="flex justify-center pt-1">
            <UButton
              label="Load more comments"
              color="neutral"
              variant="outline"
              size="sm"
              class="cursor-pointer"
              :loading="isFetchingNextPage"
              @click="
                () => {
                  fetchNextPage();
                }
              "
            />
          </div>
        </div>
      </div>
      <template #fallback>
        <div class="space-y-3">
          <USkeleton v-for="i in 3" :key="i" class="h-16 w-full" />
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { useDecklistComments } from '~/composables/useDecklistSocial';
import { useUserProfile } from '~/composables/useUserProfile';
import { formatShortDate } from '~/utils/dateFormatter';
import { useToast } from '#imports';
import type { DecklistComment } from '~/models/cardListModel';

const props = defineProps({
  listId: {
    type: String,
    required: true,
  },
  /** Whether the viewer owns the decklist (owners may delete any comment). */
  isListOwner: {
    type: Boolean,
    default: false,
  },
});

const toast = useToast();
const { userProfile } = useUserProfile();
const listIdRef = computed(() => props.listId);
const {
  comments,
  isLoading,
  isFetchingNextPage,
  fetchNextPage,
  hasNextPage,
  addComment,
  deleteComment,
  isAddingComment,
} = useDecklistComments(listIdRef);

const isLoggedIn = computed(() => !!userProfile.value?.id);
const newComment = ref('');

const isOwnComment = (comment: DecklistComment) =>
  isLoggedIn.value && comment.user_id === userProfile.value?.id;

const canDelete = (comment: DecklistComment) =>
  isLoggedIn.value &&
  (comment.user_id === userProfile.value?.id || props.isListOwner);

const handleAddComment = async () => {
  try {
    await addComment(newComment.value.trim());
    newComment.value = '';
  } catch (error: any) {
    toast.add({
      title: 'Error posting comment',
      description: error.message,
      color: 'error',
    });
  }
};

const handleDeleteComment = async (commentId: string) => {
  try {
    await deleteComment(commentId);
  } catch (error: any) {
    toast.add({
      title: 'Error deleting comment',
      description: error.message,
      color: 'error',
    });
  }
};
</script>
