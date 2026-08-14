<template>
  <!-- Follow/unfollow toggle for another user's public profile. Hidden for
       your own profile and rendered client-only (depends on auth state). -->
  <ClientOnly>
    <UButton
      v-if="showButton"
      :label="following ? 'Following' : 'Follow'"
      :icon="following ? 'i-lucide-user-check' : 'i-lucide-user-plus'"
      :color="following ? 'primary' : 'neutral'"
      :variant="following ? 'solid' : 'outline'"
      :disabled="!isLoggedIn || isSettingFollow"
      class="cursor-pointer"
      @click="handleToggle"
    />
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue';
import { useFollows, useFollowStatus } from '~/composables/useFollows';
import { useUserProfile } from '~/composables/useUserProfile';
import { useToast } from '#imports';

const props = defineProps<{ userId: string }>();

const toast = useToast();
const { userProfile } = useUserProfile();
const { isLoggedIn, setFollow, isSettingFollow } = useFollows();
const { following } = useFollowStatus(toRef(props, 'userId'));

const isOwnProfile = computed(() => userProfile.value?.id === props.userId);
// Only render for other users; logged-out visitors see a disabled Follow button
const showButton = computed(() => !isOwnProfile.value);

const handleToggle = async () => {
  try {
    await setFollow(props.userId, !following.value);
  } catch (error: any) {
    toast.add({
      title: following.value
        ? 'Error unfollowing user'
        : 'Error following user',
      description: error.message,
      color: 'error',
    });
  }
};
</script>
