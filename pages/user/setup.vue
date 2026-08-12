<template>
  <SpaceBackground>
    <ClientOnly>
      <div
        class="flex flex-col space-y-4 rounded-xl bg-zinc-900 p-6 shadow-xl w-full max-w-sm"
      >
        <h1 class="text-xl font-bold text-white text-center">
          Personalize your Profile
        </h1>
        <p class="text-zinc-400 text-sm text-center">
          Pick a username and profile icon to display on your decklists and
          profile.
        </p>

        <UInput
          v-model="username"
          type="text"
          placeholder="Username"
          size="lg"
          class="w-full"
          :disabled="loading"
          @keydown.enter="submit"
        />

        <!-- Profile icon selection -->
        <div class="flex flex-col items-center space-y-2">
          <img
            v-if="profileIconUrl"
            :src="profileIconUrl"
            alt="Profile icon"
            class="w-16 h-16 rounded-full object-cover border-2 border-purple-500 shadow-lg"
          />
          <div
            v-else
            class="w-16 h-16 rounded-full bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center"
          >
            <UIcon name="i-lucide-user" class="w-8 h-8" />
          </div>
          <UInputMenu
            v-model="selectedProfileCard"
            v-model:search-term="avatarSearchTerm"
            :items="filteredAvatarCards"
            :loading="cardsStatus === 'pending' || avatarSaving"
            placeholder="Optional: choose a profile icon card"
            icon="i-lucide-image"
            class="w-full"
            @update:model-value="selectProfileCard"
          />
          <p v-if="avatarError" class="text-red-400 text-xs text-center">
            {{ avatarError }}
          </p>
        </div>

        <p v-if="errorMessage" class="text-red-400 text-sm text-center">
          {{ errorMessage }}
        </p>

        <UButton
          color="primary"
          variant="solid"
          size="md"
          :loading="loading"
          :disabled="loading || !username.trim()"
          @click="submit"
        >
          {{ loading ? 'Saving…' : 'Save' }}
        </UButton>
      </div>
    </ClientOnly>
  </SpaceBackground>
</template>

<script setup lang="ts">
import { useCardNames } from '~/composables/useBulkData';
import { refDebounced } from '~/utils/refDebounced';

definePageMeta({
  layout: 'fullscreen',
});

const router = useRouter();
const {
  userProfile,
  profileData,
  profileIconUrl,
  updateUsernameMutation,
  updateAvatarMutation,
} = useUserProfile();

const username = ref('');
const errorMessage = ref<string | null>(null);
const loading = ref(false);

// Profile icon card selection
const selectedProfileCard = ref('');
const avatarSearchTerm = ref('');
const debouncedAvatarSearchTerm = refDebounced(avatarSearchTerm, 150);
const avatarSaving = ref(false);
const avatarError = ref<string | null>(null);

const { data: rawCards, status: cardsQueryStatus } = useCardNames();
const cardsStatus = computed(() =>
  cardsQueryStatus.value === 'pending' ? 'pending' : 'success',
);

const filteredAvatarCards = computed(() => {
  if (
    !debouncedAvatarSearchTerm.value ||
    debouncedAvatarSearchTerm.value.length < 2
  ) {
    return selectedProfileCard.value ? [selectedProfileCard.value] : [];
  }

  const searchLower = debouncedAvatarSearchTerm.value.toLowerCase();
  const filtered = selectedProfileCard.value ? [selectedProfileCard.value] : [];

  const cards = rawCards.value ?? [];
  for (let i = 0; i < cards.length && filtered.length < 100; i++) {
    const card = cards[i];
    if (
      card.toLowerCase().includes(searchLower) &&
      card !== selectedProfileCard.value
    ) {
      filtered.push(card);
    }
  }

  return filtered;
});

const selectProfileCard = async (cardName: string) => {
  if (!cardName) return;
  avatarError.value = null;
  avatarSaving.value = true;
  try {
    await updateAvatarMutation.mutateAsync(cardName);
  } catch (e: any) {
    avatarError.value = e.message || 'Failed to save profile icon.';
  }
  avatarSaving.value = false;
};

// If user isn't logged in, send to home
watchEffect(() => {
  if (import.meta.server) return;
  if (userProfile.value === null) {
    router.push('/');
  }
});

// If user already has a username, send to profile
watchEffect(() => {
  if (import.meta.server) return;
  if (profileData.value?.username) {
    router.push('/user/account');
  }
});

const submit = async () => {
  errorMessage.value = null;
  if (!username.value.trim()) {
    errorMessage.value = 'Username is required.';
    return;
  }
  loading.value = true;
  try {
    await updateUsernameMutation.mutateAsync(username.value.trim());
    router.push('/user/account');
  } catch (e: any) {
    errorMessage.value = e.message || 'Failed to save username.';
  }
  loading.value = false;
};
</script>
