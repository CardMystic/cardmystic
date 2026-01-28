<template>
  <UCard class="discussion-card">
    <div class="discussion-header">
      <UIcon name="i-heroicons-chat-bubble-left-right" class="w-6 h-6 text-primary mr-2" />
      <h3 class="discussion-title">Discussion Forum</h3>
    </div>

    <p class="text-sm text-gray-400 mb-4">
      Share your thoughts, strategies, and insights about this card with the community.
    </p>

    <!-- New Discussion Form -->
    <div class="mb-6">
      <UForm :state="newDiscussionForm" @submit="handleSubmitDiscussion" class="space-y-3">
        <UFormGroup label="Your Name" name="author" required>
          <UInput
            v-model="newDiscussionForm.author"
            placeholder="Enter your name"
            :disabled="isSubmitting"
            size="lg"
          />
        </UFormGroup>

        <UFormGroup label="Message" name="message" required>
          <UTextarea
            v-model="newDiscussionForm.message"
            placeholder="Share your thoughts about this card..."
            :disabled="isSubmitting"
            :rows="3"
            size="lg"
          />
        </UFormGroup>

        <UButton
          type="submit"
          color="primary"
          :loading="isSubmitting"
          :disabled="!canSubmit"
          icon="i-heroicons-paper-airplane"
        >
          Post Discussion
        </UButton>
      </UForm>
    </div>

    <!-- Discussions List -->
    <div v-if="discussions.length === 0" class="text-center py-8 text-gray-400">
      <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="w-12 h-12 mx-auto mb-2 opacity-50" />
      <p>No discussions yet. Be the first to share your thoughts!</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="discussion in discussions"
        :key="discussion.id"
        class="discussion-item"
      >
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0">
            <div class="avatar">
              {{ discussion.author.charAt(0).toUpperCase() }}
            </div>
          </div>

          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-semibold text-white">{{ discussion.author }}</span>
              <span class="text-xs text-gray-500">{{ formatTimestamp(discussion.timestamp) }}</span>
            </div>
            <p class="text-gray-300 mb-2 whitespace-pre-wrap">{{ discussion.message }}</p>

            <!-- Reply Button -->
            <UButton
              size="xs"
              color="gray"
              variant="ghost"
              @click="toggleReplyForm(discussion.id)"
              icon="i-heroicons-chat-bubble-left"
            >
              {{ replyFormId === discussion.id ? 'Cancel' : 'Reply' }}
            </UButton>

            <!-- Reply Form -->
            <div v-if="replyFormId === discussion.id" class="mt-3 ml-4 space-y-2">
              <UInput
                v-model="replyForm.author"
                placeholder="Your name"
                size="sm"
              />
              <UTextarea
                v-model="replyForm.message"
                placeholder="Write a reply..."
                :rows="2"
                size="sm"
              />
              <div class="flex gap-2">
                <UButton
                  size="xs"
                  color="primary"
                  @click="handleSubmitReply(discussion.id)"
                  :disabled="!canSubmitReply"
                >
                  Post Reply
                </UButton>
                <UButton
                  size="xs"
                  color="gray"
                  variant="ghost"
                  @click="cancelReply"
                >
                  Cancel
                </UButton>
              </div>
            </div>

            <!-- Replies -->
            <div v-if="discussion.replies && discussion.replies.length > 0" class="mt-3 ml-4 space-y-3">
              <div
                v-for="reply in discussion.replies"
                :key="reply.id"
                class="reply-item"
              >
                <div class="flex items-start gap-2">
                  <div class="flex-shrink-0">
                    <div class="avatar-small">
                      {{ reply.author.charAt(0).toUpperCase() }}
                    </div>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-semibold text-sm text-white">{{ reply.author }}</span>
                      <span class="text-xs text-gray-500">{{ formatTimestamp(reply.timestamp) }}</span>
                    </div>
                    <p class="text-sm text-gray-300 whitespace-pre-wrap">{{ reply.message }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDiscussions } from '~/composables/useDiscussions';

const props = defineProps<{
  cardId: string;
}>();

const { discussions, addDiscussion, addReply } = useDiscussions(props.cardId);

const newDiscussionForm = ref({
  author: '',
  message: '',
});

const replyForm = ref({
  author: '',
  message: '',
});

const replyFormId = ref<string | null>(null);
const isSubmitting = ref(false);

const canSubmit = computed(() => {
  return newDiscussionForm.value.author.trim() && newDiscussionForm.value.message.trim();
});

const canSubmitReply = computed(() => {
  return replyForm.value.author.trim() && replyForm.value.message.trim();
});

const handleSubmitDiscussion = async () => {
  if (!canSubmit.value) return;

  isSubmitting.value = true;
  try {
    addDiscussion(newDiscussionForm.value.author, newDiscussionForm.value.message);
    newDiscussionForm.value.author = '';
    newDiscussionForm.value.message = '';
  } finally {
    isSubmitting.value = false;
  }
};

const toggleReplyForm = (discussionId: string) => {
  if (replyFormId.value === discussionId) {
    replyFormId.value = null;
    replyForm.value.author = '';
    replyForm.value.message = '';
  } else {
    replyFormId.value = discussionId;
  }
};

const handleSubmitReply = (discussionId: string) => {
  if (!canSubmitReply.value) return;

  addReply(discussionId, replyForm.value.author, replyForm.value.message);
  replyForm.value.author = '';
  replyForm.value.message = '';
  replyFormId.value = null;
};

const cancelReply = () => {
  replyFormId.value = null;
  replyForm.value.author = '';
  replyForm.value.message = '';
};

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
};
</script>

<style scoped>
.discussion-card {
  margin-top: 1.5rem;
}

.discussion-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.discussion-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
}

.discussion-item {
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.reply-item {
  padding: 0.75rem;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 0.5rem;
  border-left: 2px solid rgba(var(--color-primary-500), 0.5);
}

.avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(var(--color-primary-500), 0.8), rgba(var(--color-primary-700), 0.8));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: white;
  font-size: 1.125rem;
}

.avatar-small {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(var(--color-primary-500), 0.6), rgba(var(--color-primary-700), 0.6));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: white;
  font-size: 0.75rem;
}
</style>
