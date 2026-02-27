<script setup lang="ts">
import { useUserProfile } from '~/composables/useUserProfile'
import { refDebounced } from '@vueuse/core'

const router = useRouter()

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
  validatePasswordPolicy
} = useUserProfile()

const username = ref(computedUsername.value)
const newEmail = ref(userProfile.value?.email || '')
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const showPasswords = ref(false)

// Profile icon card selection
const selectedProfileCard = ref(profileData.value?.avatar_card_name || '')
const searchTerm = ref('')
const debouncedSearchTerm = refDebounced(searchTerm, 150)

// Sync username when user profile changes
watch(computedUsername, (newVal) => {
  username.value = newVal
})

// Sync selected card when profile data changes
watch(() => profileData.value?.avatar_card_name, (newVal) => {
  if (newVal) selectedProfileCard.value = newVal
})

// Load card names
const { data: rawCards, status: cardsStatus } = await useFetch('/card-names.min.json', {
  key: 'profile-card-names',
  lazy: true,
  server: false,
  transform: (data: string[]) => data || [],
  default: () => []
})

// Filter cards based on search
const filteredCards = computed(() => {
  if (!debouncedSearchTerm.value || debouncedSearchTerm.value.length < 2) {
    if (selectedProfileCard.value) {
      return [selectedProfileCard.value]
    }
    return []
  }

  const searchLower = debouncedSearchTerm.value.toLowerCase()
  const filtered = [selectedProfileCard.value]

  for (let i = 0; i < rawCards.value.length && filtered.length < 100; i++) {
    const card = rawCards.value[i]
    if (card.toLowerCase().includes(searchLower)) {
      filtered.push(card)
    }
  }

  return filtered
})

const updateProfileCard = async (cardName: string) => {
  if (!cardName) return
  errorMessage.value = null
  successMessage.value = null
  try {
    await updateAvatarMutation.mutateAsync(cardName)
    selectedProfileCard.value = cardName
    successMessage.value = 'Profile icon updated successfully!'
  } catch (e: any) {
    errorMessage.value = e.message
  }
}

const updateUsername = async () => {
  errorMessage.value = null
  successMessage.value = null
  try {
    await updateUsernameMutation.mutateAsync(username.value)
    successMessage.value = 'Username updated successfully!'
  } catch (e: any) {
    errorMessage.value = e.message
  }
}

const updateEmail = async () => {
  errorMessage.value = null
  successMessage.value = null

  if (!newEmail.value || !newEmail.value.trim()) {
    errorMessage.value = 'Email cannot be empty'
    return
  }

  if (newEmail.value === userProfile.value?.email) {
    errorMessage.value = 'New email is the same as current email'
    return
  }

  try {
    await updateEmailMutation.mutateAsync(newEmail.value.trim())
    successMessage.value = 'Confirmation email sent! Please check your inbox to verify the new email address.'
  } catch (e: any) {
    errorMessage.value = e.message
  }
}

const updatePassword = async () => {
  errorMessage.value = null
  successMessage.value = null

  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    errorMessage.value = 'All password fields are required'
    return
  }

  const passwordError = validatePasswordPolicy(newPassword.value)
  if (passwordError) {
    errorMessage.value = passwordError
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'New passwords do not match'
    return
  }

  try {
    await updatePasswordMutation.mutateAsync(newPassword.value)
    successMessage.value = 'Password updated successfully!'
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (e: any) {
    errorMessage.value = e.message
  }
}

// Computed disabled states for update buttons
const isUsernameUnchanged = computed(() => {
  return !username.value?.trim() || username.value.trim() === computedUsername.value
})

const isEmailUnchanged = computed(() => {
  return !newEmail.value?.trim() || newEmail.value.trim() === (userProfile.value?.email || '')
})

const isPasswordIncomplete = computed(() => {
  return !currentPassword.value || !newPassword.value || !confirmPassword.value
})

// Email change confirmation
const showEmailConfirmModal = ref(false)

const confirmEmailUpdate = () => {
  showEmailConfirmModal.value = false
  updateEmail()
}

const handleSignOut = async () => {
  await signOut()
  router.push('/')
}
</script>

<template>
  <div class="w-full max-w-2xl profile-container">
    <div class="relative z-10">
      <ProfileSkeleton v-if="loading" />

      <UCard v-else class="shadow-2xl">
        <!-- Profile Image and Basic Info -->
        <div class="flex items-center space-x-4 mb-6">
          <div class="relative w-24 h-24 group">
            <img v-if="profileIconUrl" :src="profileIconUrl" :alt="profileData?.avatar_card_name || ''"
              class="w-24 h-24 rounded-full object-cover border-2 border-purple-500 shadow-lg" />
            <div v-else
              class="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <UIcon name="i-lucide-user" class="w-12 h-12" />
            </div>

            <UPopover>
              <div
                class="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <UIcon name="i-lucide-pencil" class="w-6 h-6" />
              </div>
              <template #content>
                <div class="p-4 w-80">
                  <h3 class="text-sm font-semibold mb-2">Choose Profile Icon</h3>
                  <USelectMenu v-model="selectedProfileCard" v-model:search-term="searchTerm"
                    :loading="cardsStatus === 'pending' || updateAvatarMutation.isPending.value" :items="filteredCards"
                    placeholder="Search for a card..." icon="i-lucide-search" class="w-full"
                    @update:model-value="updateProfileCard" />
                  <p class="text-xs text-gray-600 dark:text-zinc-400 mt-2">Search for an MTG card to use as your
                    profile icon</p>
                </div>
              </template>
            </UPopover>
          </div>
          <div>
            <p class="text-lg font-semibold">{{ computedUsername }}</p>
            <p class="text-sm text-gray-600 dark:text-zinc-400">{{ userProfile?.email }}</p>
          </div>
        </div>

        <!-- Update Username -->
        <div class="space-y-4 mb-6 pb-6 border-b">
          <h2 class="text-lg font-semibold">Update Username</h2>
          <UInput v-model="username" type="text" placeholder="Username" size="lg" class="w-full" />
          <UButton class="cursor-pointer" color="primary" variant="solid" size="md"
            :loading="updateUsernameMutation.isPending.value"
            :disabled="updateUsernameMutation.isPending.value || isUsernameUnchanged" @click="updateUsername">
            Update Username
          </UButton>
        </div>

        <!-- Email Change Confirmation Modal -->
        <UModal v-model:open="showEmailConfirmModal" title="Confirm Email Change" :ui="{ footer: 'justify-end' }">
          <template #body>
            <p>Change your email to <span class="text-purple-500 font-semibold">{{ newEmail.trim() }}</span>?</p>
          </template>
          <template #footer="{ close }">
            <UButton class="cursor-pointer" label="Cancel" color="neutral" variant="outline" @click="close" />
            <UButton class="cursor-pointer" label="Confirm" color="primary" @click="confirmEmailUpdate" />
          </template>
        </UModal>

        <!-- Update Email -->
        <div class="space-y-4 mb-6 pb-6 border-b">
          <h2 class="text-lg font-semibold">Update Email</h2>
          <UInput v-model="newEmail" type="email" placeholder="New email address" size="lg" class="w-full" />
          <UButton class="cursor-pointer" color="primary" variant="solid" size="md"
            :loading="updateEmailMutation.isPending.value"
            :disabled="updateEmailMutation.isPending.value || isEmailUnchanged" @click="showEmailConfirmModal = true">
            Update Email
          </UButton>
        </div>

        <!-- Update Password -->
        <div class="space-y-4 mb-6 pb-6 border-b">
          <h2 class="text-lg font-semibold">Update Password</h2>
          <UInput v-model="currentPassword" :type="showPasswords ? 'text' : 'password'" placeholder="Current Password"
            size="lg" class="w-full">
            <template #trailing>
              <UButton variant="link" color="neutral" :padded="false"
                :icon="showPasswords ? 'i-lucide-eye-off' : 'i-lucide-eye'" @click="showPasswords = !showPasswords" />
            </template>
          </UInput>
          <UInput v-model="newPassword" :type="showPasswords ? 'text' : 'password'" placeholder="New Password" size="lg"
            class="w-full">
            <template #trailing>
              <UButton variant="link" color="neutral" :padded="false"
                :icon="showPasswords ? 'i-lucide-eye-off' : 'i-lucide-eye'" @click="showPasswords = !showPasswords" />
            </template>
          </UInput>
          <UInput v-model="confirmPassword" :type="showPasswords ? 'text' : 'password'"
            placeholder="Confirm New Password" size="lg" class="w-full">
            <template #trailing>
              <UButton variant="link" color="neutral" :padded="false"
                :icon="showPasswords ? 'i-lucide-eye-off' : 'i-lucide-eye'" @click="showPasswords = !showPasswords" />
            </template>
          </UInput>
          <UButton class="cursor-pointer" color="primary" variant="solid" size="md"
            :loading="updatePasswordMutation.isPending.value"
            :disabled="updatePasswordMutation.isPending.value || isPasswordIncomplete" @click="updatePassword">
            Update Password
          </UButton>
        </div>

        <!-- Messages -->
        <p v-if="errorMessage" class="text-red-400 text-sm mb-4">{{ errorMessage }}</p>
        <p v-if="successMessage" class="text-green-400 text-sm mb-4">{{ successMessage }}</p>

        <!-- Sign Out -->
        <UButton color="error" variant="outline" size="md" @click="handleSignOut" class="w-full">
          Sign Out
        </UButton>

        <!-- Contact -->
        <p class="text-xs text-gray-400 text-center mt-4">
          Experiencing issues? Contact us at
          <a href="mailto:thecardmystic@gmail.com" class="text-purple-400 hover:text-purple-300 underline">thecardmystic@gmail.com</a>
        </p>
      </UCard>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  margin-top: 40px;
}
</style>
