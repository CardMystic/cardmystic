<template>
  <div class="mb-10 mt-6 w-full">
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
        :disabled="isUpdating || isUploadingImage"
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
    <div v-else-if="!article || !canEdit" class="empty-state">
      <UIcon name="i-lucide-lock" class="text-5xl opacity-30 mb-3" />
      <p class="mb-4">You don't have permission to edit this article.</p>
      <UButton to="/explore/articles" color="primary" variant="soft">
        Browse Articles
      </UButton>
    </div>

    <template v-else>
      <!-- Article details -->
      <div
        class="w-full max-w-4xl mx-auto mb-6 p-4 border border-black-300 dark:border-gray-400 rounded-lg bg-white/60 dark:bg-black/40 space-y-4"
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
              :disabled="isUpdating || isDeleting"
              @click="fileInputRef?.click()"
            />
            <UButton
              v-if="imageUrl"
              icon="i-lucide-x"
              color="error"
              variant="ghost"
              label="Remove"
              :disabled="isUpdating || isUploadingImage || isDeleting"
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
        </div>
      </div>

      <UAlert
        v-if="saveError"
        role="alert"
        color="error"
        variant="outline"
        title="Article could not be saved"
        :description="saveError"
        class="w-full max-w-4xl mx-auto mb-4"
      />

      <!-- Markdown content editor -->
      <UContainer
        class="flex flex-col mb-5"
        :class="
          editorMode === 'preview'
            ? undefined
            : 'max-w-none px-0 sm:px-0 lg:px-0'
        "
      >
        <ClientOnly>
          <MarkdownEditor
            v-model="content"
            :editable="true"
            :is-saving="isUpdating"
            empty-message="This article has no content yet."
            placeholder="Write your article here. Markdown supported — use ((Card Name)) to embed a card image or [[Card Name]] to link a card."
            :save-handler="saveArticle"
            :has-unsaved-changes="detailsDirty"
            :save-disabled="!title.trim() || isUploadingImage || isDeleting"
            save-label="Save Article"
            :save-in-preview="true"
            @mode-change="editorMode = $event"
          />
          <template #fallback>
            <USkeleton class="h-[60vh] w-full rounded-md" />
          </template>
        </ClientOnly>
      </UContainer>
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
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useArticle, useArticleMutations } from '~/composables/useArticles';
import { useUserProfile } from '~/composables/useUserProfile';
import { useSupabase } from '~/composables/useSupabase';
import { useToast } from '#imports';
import MarkdownEditor from '~/components/lists/MarkdownEditor.vue';
import {
  ARTICLE_DESCRIPTION_MAX_CHARS,
  ARTICLE_TITLE_MAX_CHARS,
} from '~/models/articleModel';

definePageMeta({ layout: 'editor' });

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

// Keep an already-authorized editor mounted if the session expires mid-edit.
// The endpoint still checks ownership on every save; another signed-in user
// does not inherit access to this editor.
const editorArticleId = ref<string | null>(null);
watch(
  [articleId, isOwner],
  ([id, owner]) => {
    if (owner) editorArticleId.value = id;
  },
  { immediate: true },
);
const canEdit = computed(
  () =>
    isOwner.value ||
    (!userProfile.value && editorArticleId.value === articleId.value),
);

// Editable fields, seeded once from the loaded article so refetches don't
// clobber in-progress edits.
const title = ref('');
const description = ref('');
const imageUrl = ref<string | null>(null);
const isPublished = ref(false);
const editorMode = ref<'edit' | 'split' | 'preview'>('edit');
const content = ref('');
const saveError = ref<string | null>(null);
const savedDetails = ref({
  title: '',
  description: '',
  imageUrl: null as string | null,
  isPublished: false,
});
let seededArticleId: string | null = null;
watch(
  article,
  (value) => {
    if (!value || seededArticleId === value.id) return;
    seededArticleId = value.id;
    title.value = value.title;
    description.value = value.description;
    imageUrl.value = value.image_url;
    isPublished.value = value.is_published;
    content.value = value.content;
    savedDetails.value = {
      title: value.title,
      description: value.description,
      imageUrl: value.image_url,
      isPublished: value.is_published,
    };
  },
  { immediate: true },
);

const detailsDirty = computed(
  () =>
    title.value !== savedDetails.value.title ||
    description.value !== savedDetails.value.description ||
    imageUrl.value !== savedDetails.value.imageUrl ||
    isPublished.value !== savedDetails.value.isPublished,
);

async function saveArticle(value: string) {
  const details = {
    title: title.value.trim(),
    description: description.value.trim(),
    imageUrl: imageUrl.value,
    isPublished: isPublished.value,
  };
  const submittedTitle = title.value;
  const submittedDescription = description.value;
  saveError.value = null;
  try {
    // A lost response does not prove the write failed. Never delete a cover
    // that may have been persisted, even if the user later leaves or replaces it.
    if (pendingImagePath.value) submittedImagePaths.add(pendingImagePath.value);
    await updateArticle(articleId.value, { ...details, content: value });
    // Only mark the submitted snapshot saved. Typing while saving must stay dirty.
    savedDetails.value = details;
    if (title.value === submittedTitle) title.value = details.title;
    if (description.value === submittedDescription)
      description.value = details.description;
    pendingImagePath.value = null;
    toast.add({ title: 'Article saved', icon: 'i-lucide-check' });
  } catch (error) {
    saveError.value =
      error instanceof Error ? error.message : 'Please try saving again.';
    // MarkdownEditor keeps its draft and leave guard active after rejection.
    throw error;
  }
}

// --- Cover image upload to the public article-images storage bucket ---
//
// Uploads happen immediately (so authors can preview the image before saving)
// but the reader never sees a picture until Save Article is clicked. To keep
// the bucket at most one image per article, we:
//   1. Track the storage path of any image we've uploaded during this session
//      but haven't yet persisted (`pendingImagePath`).
//   2. Delete the pending image when the author replaces it, removes it,
//      navigates away, or unmounts before saving. Once submitted, an image
//      may be persisted even if the response fails, so only the backend cleans it up.
//   3. Let the backend delete the previously-persisted image on save/delete
//      of the article.
const supabase = process.server ? null : useSupabase();
const fileInputRef = ref<HTMLInputElement | null>(null);
const isUploadingImage = ref(false);
const pendingImagePath = ref<string | null>(null);
const submittedImagePaths = new Set<string>();

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

/** Best-effort delete of a storage object; never throws. */
async function deletePendingUpload(path: string): Promise<void> {
  if (!supabase || submittedImagePaths.has(path)) return;
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

// Clean up only after navigation actually completes. A leave/unload guard
// can be cancelled; deleting there would break the cover image on "Stay".
// An in-flight save may already have persisted the image, so leave it intact.
onBeforeUnmount(() => {
  if (!isUpdating.value && pendingImagePath.value) {
    void deletePendingUpload(pendingImagePath.value);
  }
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
