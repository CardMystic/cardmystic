<template>
  <SpaceBackground>
    <ClientOnly>
      <div
        class="flex flex-col space-y-4 rounded-xl bg-zinc-900 p-6 shadow-xl w-full max-w-sm"
      >
        <h1 class="text-xl font-bold text-white text-center">
          Choose your username
        </h1>
        <p class="text-zinc-400 text-sm text-center">
          Pick a username to display on your decklists and profile.
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
          {{ loading ? 'Saving…' : 'Save username' }}
        </UButton>
      </div>
    </ClientOnly>
  </SpaceBackground>
</template>

<script setup lang="ts">
const router = useRouter();
const config = useRuntimeConfig();
const { userProfile, profileData, updateUsernameMutation } = useUserProfile();

const username = ref('');
const errorMessage = ref<string | null>(null);
const loading = ref(false);

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
    router.push('/user/profile');
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
    router.push('/user/profile');
  } catch (e: any) {
    errorMessage.value = e.message || 'Failed to save username.';
  }
  loading.value = false;
};
</script>
