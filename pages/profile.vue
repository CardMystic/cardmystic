<template>
  <UContainer class="py-8 px-4">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-6">User Profile</h1>

      <!-- Profile Display/Edit Section -->
      <UCard class="mb-6">
        <template #header>
          <h2 class="text-xl font-semibold">Profile Information</h2>
        </template>

        <div class="space-y-6">
          <!-- Profile Image -->
          <div class="flex items-center space-x-4">
            <div class="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
              <img
                v-if="profile?.profile_image"
                :src="profile.profile_image"
                :alt="profile.username"
                class="w-full h-full object-cover"
              />
              <UIcon v-else name="i-heroicons-user" class="w-12 h-12 text-gray-400" />
            </div>
            <div>
              <UButton
                color="primary"
                @click="() => imageInput?.click()"
                :loading="isUploadingImage"
              >
                Change Image
              </UButton>
              <input
                ref="imageInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleImageUpload"
              />
            </div>
          </div>

          <!-- Username -->
          <div>
            <label class="block text-sm font-medium mb-2">Username</label>
            <UInput
              v-model="editedUsername"
              :disabled="!isEditing"
              placeholder="Enter username"
            />
          </div>

          <!-- Email (read-only) -->
          <div>
            <label class="block text-sm font-medium mb-2">Email</label>
            <UInput
              :model-value="profile?.email"
              disabled
              placeholder="Email"
            />
          </div>

          <!-- Action Buttons -->
          <div class="flex space-x-2">
            <UButton
              v-if="!isEditing"
              color="primary"
              @click="startEditing"
            >
              Edit Profile
            </UButton>
            <template v-else>
              <UButton
                color="primary"
                @click="saveProfile"
                :loading="isUpdatingProfile"
              >
                Save Changes
              </UButton>
              <UButton
                color="gray"
                variant="outline"
                @click="cancelEditing"
              >
                Cancel
              </UButton>
            </template>
          </div>
        </div>
      </UCard>

      <!-- Password Change Section -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">Change Password</h2>
        </template>

        <form @submit.prevent="handlePasswordUpdate" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Current Password</label>
            <UInput
              v-model="passwordForm.current_password"
              type="password"
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">New Password</label>
            <UInput
              v-model="passwordForm.new_password"
              type="password"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Confirm New Password</label>
            <UInput
              v-model="passwordForm.confirm_password"
              type="password"
              placeholder="Confirm new password"
            />
          </div>

          <UButton
            type="submit"
            color="primary"
            :loading="isUpdatingPassword"
          >
            Update Password
          </UButton>
        </form>
      </UCard>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUserProfile } from '~/composables/useUserProfile';
import type { PasswordUpdate } from '~/models/userModel';

definePageMeta({
  title: 'Profile',
});

useSeoMeta({
  title: 'User Profile | CardMystic',
  description: 'Manage your CardMystic profile settings',
  robots: 'noindex, nofollow',
});

const {
  profile,
  isLoading,
  updateProfile,
  updatePassword,
  uploadImage,
  isUpdatingProfile,
  isUpdatingPassword,
  isUploadingImage,
} = useUserProfile();

const isEditing = ref(false);
const editedUsername = ref('');
const imageInput = ref<HTMLInputElement | null>(null);

const passwordForm = ref<PasswordUpdate>({
  current_password: '',
  new_password: '',
  confirm_password: '',
});

const startEditing = () => {
  editedUsername.value = profile.value?.username || '';
  isEditing.value = true;
};

const cancelEditing = () => {
  isEditing.value = false;
  editedUsername.value = '';
};

const saveProfile = () => {
  if (editedUsername.value && editedUsername.value !== profile.value?.username) {
    updateProfile({ username: editedUsername.value });
  }
  isEditing.value = false;
};

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    uploadImage(file);
  }
};

const handlePasswordUpdate = () => {
  if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
    alert("Passwords don't match");
    return;
  }
  updatePassword(passwordForm.value);
  passwordForm.value = {
    current_password: '',
    new_password: '',
    confirm_password: '',
  };
};
</script>
