<script setup lang="ts">
import { useUserProfile } from '~/composables/useUserProfile';
import { useCardNames } from '~/composables/useBulkData';
import { usePatreon } from '~/composables/usePatreon';
import { PATREON_MEMBERSHIP_URL } from '~/models/patreonModel';
import { refDebounced } from '~/utils/refDebounced';
import { useToast } from '#imports';

const router = useRouter();
const toast = useToast();

const {
  userProfile,
  profileData,
  loading,
  username: computedUsername,
  profileIconUrl,
  signOut,
  updateAvatarMutation,
  updateUsernameMutation,
  updateEmailMutation,
  updatePasswordMutation,
  validatePasswordPolicy,
} = useUserProfile();

const {
  status: patreonStatus,
  isLoading: isLoadingPatreon,
  connect: connectPatreon,
  isConnecting: isConnectingPatreon,
  disconnect: disconnectPatreon,
  isDisconnecting: isDisconnectingPatreon,
} = usePatreon();

const patreonTierLabel = computed(() => {
  if (patreonStatus.value?.isFeatured) return 'Featured On Our Site';
  if (patreonStatus.value?.tier === 'supporter') return 'Supporter';
  return null;
});

const handleConnectPatreon = async () => {
  try {
    await connectPatreon();
  } catch (e: any) {
    toast.add({
      title: 'Error connecting Patreon',
      description: e.message,
      color: 'error',
    });
  }
};

const handleDisconnectPatreon = async () => {
  try {
    await disconnectPatreon();
    toast.add({ title: 'Patreon account disconnected', color: 'success' });
  } catch (e: any) {
    toast.add({
      title: 'Error disconnecting Patreon',
      description: e.message,
      color: 'error',
    });
  }
};

const username = ref(computedUsername.value);
const newEmail = ref(userProfile.value?.email || '');
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const showPasswords = ref(false);

// Profile icon card selection
const selectedProfileCard = ref(profileData.value?.avatar_card_name || '');
const searchTerm = ref('');
const debouncedSearchTerm = refDebounced(searchTerm, 150);

// Sync display name when user profile changes
watch(computedUsername, (newVal) => {
  username.value = newVal;
});

// Sync selected card when profile data changes
watch(
  () => profileData.value?.avatar_card_name,
  (newVal) => {
    if (newVal) selectedProfileCard.value = newVal;
  },
);

// Load card names from backend bulk data API
const { data: rawCards, status: cardsQueryStatus } = useCardNames();
const cardsStatus = computed(() =>
  cardsQueryStatus.value === 'pending' ? 'pending' : 'success',
);

// Filter cards based on search
const filteredCards = computed(() => {
  if (!debouncedSearchTerm.value || debouncedSearchTerm.value.length < 2) {
    if (selectedProfileCard.value) {
      return [selectedProfileCard.value];
    }
    return [];
  }

  const searchLower = debouncedSearchTerm.value.toLowerCase();
  const filtered = [selectedProfileCard.value];

  const cards = rawCards.value ?? [];

  for (let i = 0; i < cards.length && filtered.length < 100; i++) {
    const card = cards[i];
    if (card.toLowerCase().includes(searchLower)) {
      filtered.push(card);
    }
  }

  return filtered;
});

const updateProfileCard = async (cardName: string) => {
  if (!cardName) return;
  errorMessage.value = null;
  successMessage.value = null;
  try {
    await updateAvatarMutation.mutateAsync(cardName);
    selectedProfileCard.value = cardName;
    successMessage.value = 'Profile icon updated successfully!';
  } catch (e: any) {
    errorMessage.value = e.message;
  }
};

const updateUsername = async () => {
  errorMessage.value = null;
  successMessage.value = null;
  try {
    await updateUsernameMutation.mutateAsync(username.value);
    successMessage.value = 'Username updated successfully!';
  } catch (e: any) {
    errorMessage.value = e.message;
  }
};

const updateEmail = async () => {
  errorMessage.value = null;
  successMessage.value = null;

  if (!newEmail.value || !newEmail.value.trim()) {
    errorMessage.value = 'Email cannot be empty';
    return;
  }

  if (newEmail.value === userProfile.value?.email) {
    errorMessage.value = 'New email is the same as current email';
    return;
  }

  try {
    await updateEmailMutation.mutateAsync(newEmail.value.trim());
    successMessage.value =
      'Confirmation email sent! Please check your inbox to verify the new email address.';
  } catch (e: any) {
    errorMessage.value = e.message;
  }
};

const updatePassword = async () => {
  errorMessage.value = null;
  successMessage.value = null;

  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    errorMessage.value = 'All password fields are required';
    return;
  }

  const passwordError = validatePasswordPolicy(newPassword.value);
  if (passwordError) {
    errorMessage.value = passwordError;
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'New passwords do not match';
    return;
  }

  try {
    await updatePasswordMutation.mutateAsync(newPassword.value);
    successMessage.value = 'Password updated successfully!';
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
  } catch (e: any) {
    errorMessage.value = e.message;
  }
};

// Computed disabled states for update buttons
const isUsernameUnchanged = computed(() => {
  return (
    !username.value?.trim() || username.value.trim() === computedUsername.value
  );
});

const isEmailUnchanged = computed(() => {
  return (
    !newEmail.value?.trim() ||
    newEmail.value.trim() === (userProfile.value?.email || '')
  );
});

const isPasswordIncomplete = computed(() => {
  return !currentPassword.value || !newPassword.value || !confirmPassword.value;
});

// Email change confirmation
const showEmailConfirmModal = ref(false);

const confirmEmailUpdate = () => {
  showEmailConfirmModal.value = false;
  updateEmail();
};

const handleSignOut = async () => {
  await signOut();
  router.push('/');
};
</script>

<template>
  <div class="w-full">
    <div class="relative z-10">
      <ProfileSkeleton v-if="loading" />

      <UCard v-else class="shadow-2xl">
        <!-- Identity + Patreon header -->
        <div
          class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6 pb-6 border-b"
        >
          <!-- Profile Image and Basic Info -->
          <div class="flex items-center space-x-4">
            <div class="relative w-24 h-24 group">
              <img
                v-if="profileIconUrl"
                :src="profileIconUrl"
                :alt="profileData?.avatar_card_name || ''"
                class="w-24 h-24 rounded-full object-cover border-2 border-purple-500 shadow-lg"
              />
              <div
                v-else
                class="w-24 h-24 rounded-full bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center"
              >
                <UIcon name="i-lucide-user" class="w-12 h-12" />
              </div>

              <UPopover>
                <div
                  class="absolute inset-0 rounded-full flex items-center justify-center cursor-pointer"
                >
                  <UIcon name="i-lucide-pencil" class="w-6 h-6" />
                </div>
                <template #content>
                  <div class="p-4 w-80">
                    <h3 class="text-sm font-semibold mb-2">
                      Choose Profile Icon
                    </h3>
                    <UInputMenu
                      v-model="selectedProfileCard"
                      v-model:search-term="searchTerm"
                      :loading="updateAvatarMutation.isPending.value"
                      :items="filteredCards"
                      placeholder="Search for a card..."
                      icon="i-lucide-search"
                      class="w-full"
                      @update:model-value="updateProfileCard"
                    />
                    <p class="text-xs text-gray-600 dark:text-zinc-400 mt-2">
                      Search for an MTG card to use as your profile icon
                    </p>
                  </div>
                </template>
              </UPopover>
            </div>
            <div>
              <p class="text-lg font-semibold">{{ computedUsername }}</p>
              <p class="text-sm text-gray-600 dark:text-zinc-400">
                {{ userProfile?.email }}
              </p>
            </div>
          </div>

          <!-- Patreon Membership -->
          <div class="space-y-3 lg:max-w-sm">
            <h2 class="text-lg font-semibold flex items-center gap-2">
              <UIcon name="i-simple-icons-patreon" class="w-4 h-4" />
              Patreon Membership
            </h2>

            <USkeleton v-if="isLoadingPatreon" class="h-10 w-full" />

            <template v-else-if="patreonStatus?.connected">
              <div class="flex items-center gap-2 flex-wrap">
                <UBadge v-if="patreonTierLabel" color="primary" variant="soft">
                  {{ patreonTierLabel }}
                </UBadge>
                <span
                  v-if="patreonStatus.patronStatus !== 'active_patron'"
                  class="text-sm text-amber-500"
                >
                  Your membership is
                  {{
                    patreonStatus.patronStatus === 'declined_patron'
                      ? 'inactive because payment was declined'
                      : 'no longer active'
                  }}.
                  <a
                    :href="patreonStatus.membershipUrl"
                    target="_blank"
                    rel="noopener"
                    class="underline"
                    >Update on Patreon</a
                  >
                </span>
                <span v-else class="text-sm text-gray-600 dark:text-zinc-400">
                  Connected
                </span>
              </div>
              <UButton
                class="cursor-pointer"
                color="neutral"
                variant="outline"
                size="sm"
                :loading="isDisconnectingPatreon"
                :disabled="isDisconnectingPatreon"
                @click="handleDisconnectPatreon"
              >
                Disconnect Patreon
              </UButton>
            </template>

            <template v-else-if="!patreonStatus">
              <p role="alert" class="text-sm text-red-500">
                Unable to load your Patreon status. Please refresh and try
                again.
              </p>
            </template>

            <template v-else>
              <p class="text-sm text-gray-600 dark:text-zinc-400">
                Connect your Patreon account to link your membership. Not a
                patron yet?
                <a
                  :href="PATREON_MEMBERSHIP_URL"
                  target="_blank"
                  rel="noopener"
                  class="text-purple-500 hover:underline"
                  >View membership tiers</a
                >.
              </p>
              <UButton
                class="cursor-pointer"
                color="primary"
                variant="solid"
                size="md"
                :loading="isConnectingPatreon"
                :disabled="isConnectingPatreon"
                @click="handleConnectPatreon"
              >
                Connect to Patreon
              </UButton>
            </template>
          </div>
        </div>

        <!-- Update Username + Update Email -->
        <div class="grid gap-6 md:grid-cols-2 mb-6 pb-6 border-b">
          <div class="space-y-4">
            <h2 class="text-lg font-semibold">Update Username</h2>
            <UInput
              v-model="username"
              type="text"
              placeholder="Username"
              size="lg"
              class="w-full"
            />
            <UButton
              class="cursor-pointer"
              color="primary"
              variant="solid"
              size="md"
              :loading="updateUsernameMutation.isPending.value"
              :disabled="
                updateUsernameMutation.isPending.value || isUsernameUnchanged
              "
              @click="updateUsername"
            >
              Update Username
            </UButton>
          </div>

          <div class="space-y-4">
            <h2 class="text-lg font-semibold">Update Email</h2>
            <UInput
              v-model="newEmail"
              type="email"
              placeholder="New email address"
              size="lg"
              class="w-full"
            />
            <UButton
              class="cursor-pointer"
              color="primary"
              variant="solid"
              size="md"
              :loading="updateEmailMutation.isPending.value"
              :disabled="
                updateEmailMutation.isPending.value || isEmailUnchanged
              "
              @click="
                () => {
                  showEmailConfirmModal = true;
                }
              "
            >
              Update Email
            </UButton>
          </div>
        </div>

        <!-- Email Change Confirmation Modal -->
        <UModal
          v-model:open="showEmailConfirmModal"
          title="Confirm Email Change"
          :ui="{ footer: 'justify-end' }"
        >
          <template #body>
            <p>
              Change your email to
              <span class="text-purple-500 font-semibold">{{
                newEmail.trim()
              }}</span
              >?
            </p>
          </template>
          <template #footer="{ close }">
            <UButton
              class="cursor-pointer"
              label="Cancel"
              color="neutral"
              variant="outline"
              @click="close"
            />
            <UButton
              class="cursor-pointer"
              label="Confirm"
              color="primary"
              @click="confirmEmailUpdate"
            />
          </template>
        </UModal>

        <!-- Update Password -->
        <div class="space-y-4 mb-6 pb-6 border-b">
          <h2 class="text-lg font-semibold">Update Password</h2>
          <div class="grid gap-4 md:grid-cols-3">
            <UInput
              v-model="currentPassword"
              :type="showPasswords ? 'text' : 'password'"
              placeholder="Current Password"
              size="lg"
              class="w-full"
            >
              <template #trailing>
                <UButton
                  variant="link"
                  color="neutral"
                  :padded="false"
                  :icon="showPasswords ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  @click="
                    () => {
                      showPasswords = !showPasswords;
                    }
                  "
                />
              </template>
            </UInput>
            <UInput
              v-model="newPassword"
              :type="showPasswords ? 'text' : 'password'"
              placeholder="New Password"
              size="lg"
              class="w-full"
            >
              <template #trailing>
                <UButton
                  variant="link"
                  color="neutral"
                  :padded="false"
                  :icon="showPasswords ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  @click="
                    () => {
                      showPasswords = !showPasswords;
                    }
                  "
                />
              </template>
            </UInput>
            <UInput
              v-model="confirmPassword"
              :type="showPasswords ? 'text' : 'password'"
              placeholder="Confirm New Password"
              size="lg"
              class="w-full"
            >
              <template #trailing>
                <UButton
                  variant="link"
                  color="neutral"
                  :padded="false"
                  :icon="showPasswords ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  @click="
                    () => {
                      showPasswords = !showPasswords;
                    }
                  "
                />
              </template>
            </UInput>
          </div>
          <UButton
            class="cursor-pointer"
            color="primary"
            variant="solid"
            size="md"
            :loading="updatePasswordMutation.isPending.value"
            :disabled="
              updatePasswordMutation.isPending.value || isPasswordIncomplete
            "
            @click="updatePassword"
          >
            Update Password
          </UButton>
        </div>

        <!-- Messages -->
        <p v-if="errorMessage" class="text-red-400 text-sm mb-4">
          {{ errorMessage }}
        </p>
        <p v-if="successMessage" class="text-green-400 text-sm mb-4">
          {{ successMessage }}
        </p>

        <!-- Contact + Sign Out -->
        <div
          class="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <p class="text-xs text-gray-400">
            Experiencing issues? Contact us at
            <a
              href="mailto:thecardmystic@gmail.com"
              class="text-purple-400 hover:text-purple-300 underline"
              >thecardmystic@gmail.com</a
            >
          </p>
          <UButton
            color="error"
            variant="outline"
            size="md"
            class="w-full sm:w-auto cursor-pointer justify-center"
            @click="handleSignOut"
          >
            Sign Out
          </UButton>
        </div>
      </UCard>
    </div>
  </div>
</template>

<style scoped></style>
