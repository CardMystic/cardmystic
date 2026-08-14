<template>
  <UContainer class="mb-10 mt-6 w-full">
    <!-- Back button -->
    <div class="mb-4 flex items-center justify-between">
      <UButton
        :to="`/articles/${articleId}`"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="outline"
        label="Back to Article"
        class="cursor-pointer"
      />
      <UButton
        v-if="isOwner"
        icon="i-lucide-trash-2"
        color="error"
        variant="outline"
        label="Delete Article"
        class="cursor-pointer"
        :loading="isDeleting"
        @click="
          () => {
            showDeleteModal = true;
          }
        "
      />
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-4">
      <USkeleton class="h-40 w-full rounded-lg" />
      <USkeleton class="h-96 w-full rounded-lg" />
    </div>

    <!-- Not the owner / not found -->
    <div v-else-if="!article || !isOwner" class="empty-state">
      <UIcon name="i-lucide-lock" class="text-5xl opacity-30 mb-3" />
      <p class="mb-4">You don't have permission to edit this article.</p>
      <UButton to="/explore/articles" color="primary" variant="soft">
        Browse Articles
      </UButton>
    </div>

    <template v-else>
      <!-- Article details -->
      <div
        class="mb-6 p-4 border border-black-300 dark:border-gray-400 rounded-lg bg-white/60 dark:bg-black/40 space-y-4"
      >
        <UFormField label="Title" required>
          <UInput
            v-model="title"
            :maxlength="ARTICLE_TITLE_MAX_CHARS"
            placeholder="Article title"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Description"
          help="A short blurb shown on article cards."
        >
          <UTextarea
            v-model="description"
            :rows="2"
            :maxlength="ARTICLE_DESCRIPTION_MAX_CHARS"
            placeholder="What is this article about?"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Cover image"
          help="Shown as the card image and article banner. Recommended: landscape 16:9 (e.g. 1200×675). Max 5 MB — JPEG, PNG, WebP, or GIF."
        >
          <div class="flex flex-wrap items-center gap-3">
            <img
              v-if="imageUrl"
              :src="imageUrl"
              alt="Cover image"
              class="max-h-32 w-auto rounded-md"
            />
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleImageSelected"
            />
            <UButton
              icon="i-lucide-image-up"
              color="primary"
              variant="outline"
              :label="imageUrl ? 'Replace Image' : 'Upload Image'"
              class="cursor-pointer"
              :loading="isUploadingImage"
              @click="fileInputRef?.click()"
            />
            <UButton
              v-if="imageUrl"
              icon="i-lucide-x"
              color="error"
              variant="ghost"
              label="Remove"
              class="cursor-pointer"
              @click="removeCurrentImage"
            />
          </div>
        </UFormField>

        <div class="flex flex-wrap items-center justify-between gap-3">
          <USwitch v-model="isPublished">
            <template #label>
              <span class="ml-2">
                {{ isPublished ? 'Published' : 'Draft' }}
              </span>
            </template>
          </USwitch>
          <div class="flex items-center gap-2">
            <span
              v-if="detailsDirty"
              class="text-xs text-gray-500 dark:text-gray-400 italic"
              >Unsaved changes</span
            >
            <UButton
              icon="i-lucide-save"
              color="success"
              label="Save Details"
              class="cursor-pointer"
              :disabled="!detailsDirty || !title.trim()"
              :loading="isUpdating"
              @click="saveDetails"
            />
          </div>
        </div>
      </div>

      <!-- Markdown content editor -->
      <div class="h-[85vh] flex flex-col">
        <ClientOnly>
          <MarkdownEditor
            v-model="content"
            :editable="true"
            :is-saving="isUpdating"
            empty-message="This article has no content yet."
            placeholder="Write your article here. Markdown supported — use ((Card Name)) to embed a card image or [[Card Name]] to link a card."
            :save-handler="saveContent"
          />
          <template #fallback>
            <USkeleton class="h-[60vh] w-full rounded-md" />
          </template>
        </ClientOnly>
      </div>
    </template>

    <!-- Delete confirmation -->
    <UModal v-model:open="showDeleteModal" title="Delete Article">
      <template #content>
        <div class="p-4 space-y-4">
          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this article? This cannot be undone.
          </p>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              label="Cancel"
              @click="
                () => {
                  showDeleteModal = false;
                }
              "
            />
            <UButton
              color="error"
              variant="solid"
              label="Delete"
              :loading="isDeleting"
              @click="handleDelete"
            />
          </div>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { useArticle, useArticleMutations } from '~/composables/useArticles';
import { useUserProfile } from '~/composables/useUserProfile';
import { useSupabase } from '~/composables/useSupabase';
import { useToast } from '#imports';
import MarkdownEditor from '~/components/lists/MarkdownEditor.vue';
import {
  ARTICLE_DESCRIPTION_MAX_CHARS,
  ARTICLE_TITLE_MAX_CHARS,
} from '~/models/articleModel';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const articleId = computed(() => String(route.params.id));

const { article, isLoading } = useArticle(articleId);
const { userProfile } = useUserProfile();
const { updateArticle, deleteArticle, isUpdating, isDeleting } =
  useArticleMutations();

const isOwner = computed(
  () => !!article.value && article.value.user_id === userProfile.value?.id,
);

// Editable fields, seeded once from the loaded article so refetches don't
// clobber in-progress edits.
const title = ref('');
const description = ref('');
const imageUrl = ref<string | null>(null);
const isPublished = ref(false);
const content = ref('');
let seeded = false;
watch(
  article,
  (value) => {
    if (seeded || !value) return;
    seeded = true;
    title.value = value.title;
    description.value = value.description;
    imageUrl.value = value.image_url;
    isPublished.value = value.is_published;
    content.value = value.content;
  },
  { immediate: true },
);

const detailsDirty = computed(
  () =>
    !!article.value &&
    (title.value !== article.value.title ||
      description.value !== article.value.description ||
      imageUrl.value !== article.value.image_url ||
      isPublished.value !== article.value.is_published),
);

async function saveDetails() {
  try {
    await updateArticle(articleId.value, {
      title: title.value.trim(),
      description: description.value.trim(),
      imageUrl: imageUrl.value,
      isPublished: isPublished.value,
    });
    // Once saved, the backend owns cleanup of the previously-persisted image;
    // any pending upload we uploaded during this session is now the persisted
    // one, so it's no longer "orphaned" and shouldn't be cleaned up locally.
    pendingImagePath.value = null;
    toast.add({ title: 'Article details saved', icon: 'i-lucide-check' });
  } catch (e: any) {
    toast.add({
      title: 'Error saving article',
      description: e?.message,
      color: 'error',
    });
  }
}

async function saveContent(value: string) {
  try {
    await updateArticle(articleId.value, { content: value });
    toast.add({ title: 'Article content saved', icon: 'i-lucide-check' });
  } catch (e: any) {
    toast.add({
      title: 'Error saving article',
      description: e?.message,
      color: 'error',
    });
    // Rethrow so MarkdownEditor keeps the draft dirty and re-enables retry.
    throw e;
  }
}

// --- Cover image upload to the public article-images storage bucket ---
//
// Uploads happen immediately (so authors can preview the image before saving)
// but the reader never sees a picture until Save Details is clicked. To keep
// the bucket at most one image per article, we:
//   1. Track the storage path of any image we've uploaded during this session
//      but haven't yet persisted (`pendingImagePath`).
//   2. Delete the pending image when the author replaces it, removes it,
//      navigates away, or unmounts before saving.
//   3. Let the backend delete the previously-persisted image on save/delete
//      of the article.
const supabase = process.server ? null : useSupabase();
const fileInputRef = ref<HTMLInputElement | null>(null);
const isUploadingImage = ref(false);
const pendingImagePath = ref<string | null>(null);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

/** Best-effort delete of a storage object; never throws. */
async function deletePendingUpload(path: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.storage.from('article-images').remove([path]);
  } catch {
    // Best-effort — leave orphan for server-side cleanup as a fallback.
  }
}

async function handleImageSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !supabase || !userProfile.value?.id) return;

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    toast.add({
      title: 'Unsupported image type',
      description: 'Please upload a JPEG, PNG, WebP, or GIF image.',
      color: 'error',
    });
    input.value = '';
    return;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    toast.add({
      title: 'Image is too large',
      description: `Maximum size is ${MAX_IMAGE_BYTES / 1024 / 1024} MB. Yours is ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
      color: 'error',
    });
    input.value = '';
    return;
  }

  isUploadingImage.value = true;
  const previousPending = pendingImagePath.value;
  try {
    const extension = file.name.split('.').pop() || 'png';
    const path = `${userProfile.value.id}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage
      .from('article-images')
      .upload(path, file);
    if (error) throw error;
    imageUrl.value = supabase.storage
      .from('article-images')
      .getPublicUrl(path).data.publicUrl;
    pendingImagePath.value = path;
    // The prior pending upload is now superseded — drop it from storage so we
    // don't accumulate 5 MB orphans on repeated re-selects.
    if (previousPending && previousPending !== path) {
      await deletePendingUpload(previousPending);
    }
  } catch (e: any) {
    toast.add({
      title: 'Error uploading image',
      description: e?.message,
      color: 'error',
    });
  } finally {
    isUploadingImage.value = false;
    if (fileInputRef.value) fileInputRef.value.value = '';
  }
}

/**
 * Handles the Remove button. If the current image was uploaded but not yet
 * persisted, drop it from storage immediately; otherwise just clear the field
 * so the backend removes the persisted image on the next save.
 */
async function removeCurrentImage() {
  const pending = pendingImagePath.value;
  imageUrl.value = null;
  if (pending) {
    pendingImagePath.value = null;
    await deletePendingUpload(pending);
  }
}

// Clean up any unsaved pending upload when the author leaves the editor.
// `onBeforeRouteLeave` catches in-app navigation and `onBeforeUnmount` is a
// safety net; `beforeunload` handles hard tab close (best-effort — modern
// browsers restrict what fires there).
function cleanupPendingOnLeave(): void {
  const pending = pendingImagePath.value;
  if (!pending) return;
  pendingImagePath.value = null;
  // Fire and forget; navigation shouldn't wait on storage cleanup.
  void deletePendingUpload(pending);
}

onBeforeRouteLeave(() => {
  cleanupPendingOnLeave();
});
onBeforeUnmount(() => {
  cleanupPendingOnLeave();
  if (beforeUnloadHandler) {
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    beforeUnloadHandler = null;
  }
});
let beforeUnloadHandler: (() => void) | null = null;
onMounted(() => {
  beforeUnloadHandler = () => cleanupPendingOnLeave();
  window.addEventListener('beforeunload', beforeUnloadHandler);
});

const showDeleteModal = ref(false);

async function handleDelete() {
  try {
    const pending = pendingImagePath.value;
    await deleteArticle(articleId.value);
    // Backend deletes the persisted cover image; also drop any pending
    // upload from this session so it doesn't become orphaned.
    if (pending) {
      pendingImagePath.value = null;
      await deletePendingUpload(pending);
    }
    showDeleteModal.value = false;
    toast.add({ title: 'Article deleted', icon: 'i-lucide-check' });
    router.push('/articles/mine');
  } catch (e: any) {
    toast.add({
      title: 'Error deleting article',
      description: e?.message,
      color: 'error',
    });
  }
}

useSeoMeta({
  title: () =>
    article.value ? `Edit: ${article.value.title}` : 'Edit Article',
  robots: 'noindex, nofollow',
});
</script>

<style scoped lang="sass">
.empty-state
  text-align: center
  padding: 3rem 1.5rem
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  border-radius: 1rem
  border: 1px dashed rgba(147, 114, 255, 0.3)
  background: rgba(147, 114, 255, 0.02)
</style>
