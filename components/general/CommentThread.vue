<template>
  <div :class="showHeading ? 'mt-8 w-full' : 'w-full'">
    <h2
      v-if="showHeading"
      class="text-lg font-bold mb-4 flex items-center gap-2"
    >
      <UIcon name="i-lucide-message-circle" class="w-5 h-5" />
      Comments
    </h2>

    <!-- Comment list: scrollable chat-style container. Own comments are
         highlighted and right-aligned (client-only — depends on auth state). -->
    <section
      aria-label="Comment thread"
      tabindex="0"
      class="w-full overflow-y-auto rounded-lg border border-black-300 bg-white/60 p-4 focus-visible:outline-2 focus-visible:outline-primary dark:border-gray-400 dark:bg-black/40"
      :class="inModal ? 'h-[clamp(10rem,40dvh,24rem)]' : 'max-h-96'"
    >
      <ClientOnly>
        <div v-if="isLoading" class="space-y-3">
          <USkeleton v-for="i in 3" :key="i" class="h-16 w-full" />
        </div>
        <p
          v-else-if="error && !comments.length"
          role="alert"
          class="py-4 text-center"
        >
          Comments could not be loaded.
          <UButton label="Retry" variant="link" @click="thread.refetch()" />
        </p>
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
                  {{ censorUserText(comment.username ?? 'Anonymous') }}
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
                {{ censorUserText(comment.body) }}
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
              @click="fetchNextPage()"
            />
          </div>
        </div>
        <template #fallback>
          <div class="space-y-3">
            <USkeleton v-for="i in 3" :key="i" class="h-16 w-full" />
          </div>
        </template>
      </ClientOnly>
    </section>

    <!-- Add comment (logged-in users only) -->
    <ClientOnly>
      <div v-if="isLoggedIn" class="mt-4 space-y-2">
        <UTextarea
          v-model="newComment"
          :placeholder="placeholder"
          aria-label="Comment"
          :ui="{ base: 'text-base' }"
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
            :disabled="isAddingComment || !newComment.trim()"
            @click="handleAddComment"
          />
        </div>
      </div>
      <p v-else class="mt-4 text-sm opacity-70 italic">
        <NuxtLink
          :to="{ path: '/user/login', query: { redirect: $route.fullPath } }"
          class="underline"
          >Sign in</NuxtLink
        >
        to leave a comment.
      </p>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { formatShortDate } from '~/utils/dateFormatter';
import { censorUserText } from '~/utils/textModeration';

type Comment = {
  id: string;
  user_id: string;
  username: string | null;
  created_at: string;
  body: string;
};
const props = withDefaults(
  defineProps<{
    thread: {
      comments: Readonly<Ref<Comment[]>>;
      isLoading: Readonly<Ref<boolean>>;
      isFetchingNextPage: Readonly<Ref<boolean>>;
      hasNextPage: Readonly<Ref<boolean>>;
      isAddingComment: Readonly<Ref<boolean>>;
      error: Readonly<Ref<unknown>>;
      fetchNextPage: () => Promise<unknown>;
      refetch: () => Promise<unknown>;
      addComment: (body: string) => Promise<unknown>;
      deleteComment: (id: string) => Promise<unknown>;
    };
    placeholder: string;
    owner?: boolean;
    showHeading?: boolean;
    inModal?: boolean;
  }>(),
  { showHeading: true },
);
const {
  comments,
  isLoading,
  isFetchingNextPage,
  fetchNextPage,
  hasNextPage,
  isAddingComment,
  error,
} = props.thread;
const { userId } = useUserProfile();
const isLoggedIn = computed(() => !!userId.value);
const newComment = ref('');
const toast = useToast();

function isOwnComment(comment: Comment) {
  return comment.user_id === userId.value;
}
function canDelete(comment: Comment) {
  return isLoggedIn.value && (isOwnComment(comment) || props.owner);
}
async function handleAddComment() {
  if (isAddingComment.value || !newComment.value.trim()) return;
  const submitted = newComment.value;
  try {
    await props.thread.addComment(censorUserText(submitted.trim()));
    if (newComment.value === submitted) newComment.value = '';
  } catch {
    toast.add({
      title: 'Could not post your comment. Try again.',
      color: 'error',
    });
  }
}
async function handleDeleteComment(id: string) {
  try {
    await props.thread.deleteComment(id);
  } catch {
    toast.add({
      title: 'Could not delete your comment. Try again.',
      color: 'error',
    });
  }
}
</script>
