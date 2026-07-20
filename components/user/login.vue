<script setup lang="ts">
import type { LoginRequest } from '@/models/userModel';

const router = useRouter();

const { loginWithEmail, loginWithGoogle, resendVerificationEmail } =
  useUserProfile();

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const showResendVerification = ref(false);
const resending = ref(false);
const resendMessage = ref<string | null>(null);
const honeypot = ref('');
const showPassword = ref(false);

const signInWithGoogle = async () => {
  errorMessage.value = null;
  loading.value = true;

  try {
    await loginWithGoogle();
  } catch (e: any) {
    errorMessage.value = e.message || 'An unexpected error occurred.';
  }

  loading.value = false;
};

const signInWithEmail = async () => {
  loading.value = true;
  errorMessage.value = null;
  showResendVerification.value = false;
  resendMessage.value = null;

  if (honeypot.value) {
    loading.value = false;
    return;
  }

  try {
    const credentials: LoginRequest = {
      email: email.value,
      password: password.value,
    };
    await loginWithEmail(credentials);
    router.push('/');
  } catch (e: any) {
    errorMessage.value = e.message || 'An unexpected error occurred.';
    if (/not confirmed|confirm your email/i.test(errorMessage.value ?? '')) {
      showResendVerification.value = true;
    }
  }

  loading.value = false;
};

const resendVerification = async () => {
  if (!email.value) return;
  resending.value = true;
  resendMessage.value = null;

  try {
    await resendVerificationEmail(email.value);
    resendMessage.value = 'Verification email sent. Please check your inbox.';
  } catch (e: any) {
    resendMessage.value = e.message;
  }

  resending.value = false;
};
</script>

<template>
  <div class="flex flex-col space-y-4 rounded-xl bg-zinc-900 p-6 shadow-xl">
    <!-- Honeypot field - hidden from users but visible to bots -->
    <input
      v-model="honeypot"
      type="text"
      name="website"
      autocomplete="off"
      tabindex="-1"
      aria-hidden="true"
      style="position: absolute; left: -9999px; width: 1px; height: 1px"
    />

    <h1 class="text-xl font-bold text-white text-center">
      Sign in to CardMystic
    </h1>

    <UButton
      class="w-full cursor-pointer"
      color="neutral"
      variant="solid"
      label="Continue with Google"
      @click="signInWithGoogle"
    >
      <template #leading>
        <img src="/icons-google.svg" alt="Google" class="w-5 h-5" />
      </template>
    </UButton>

    <div class="text-center text-zinc-400 text-sm">or</div>

    <UInput
      class="w-full"
      v-model="email"
      type="email"
      placeholder="Email"
      size="lg"
    />

    <UInput
      class="w-full"
      v-model="password"
      :type="showPassword ? 'text' : 'password'"
      placeholder="Password"
      size="lg"
    >
      <template #trailing>
        <UButton
          variant="link"
          color="neutral"
          :padded="false"
          :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
          @click="
            () => {
              showPassword = !showPassword;
            }
          "
        />
      </template>
    </UInput>

    <div class="flex justify-end -mt-2">
      <UButton
        variant="link"
        color="neutral"
        size="xs"
        :padded="false"
        @click="
          () => {
            router.push('/user/reset-password');
          }
        "
      >
        Forgot password?
      </UButton>
    </div>

    <UButton
      color="primary"
      variant="solid"
      size="md"
      :loading="loading"
      :disabled="loading"
      @click="signInWithEmail"
    >
      {{ loading ? 'Signing in…' : 'Sign in' }}
    </UButton>

    <p v-if="errorMessage" class="text-red-400 text-sm text-center">
      {{ errorMessage }}
    </p>

    <p
      v-if="showResendVerification"
      class="text-zinc-400 text-xs text-center -mt-2"
    >
      <UButton
        variant="link"
        color="primary"
        size="xs"
        :padded="false"
        :loading="resending"
        :disabled="resending || !email"
        @click="resendVerification"
      >
        Resend verification email
      </UButton>
    </p>

    <p v-if="resendMessage" class="text-zinc-400 text-xs text-center -mt-2">
      {{ resendMessage }}
    </p>

    <div class="text-center text-zinc-400 text-sm">
      Don't have an account?
      <UButton
        variant="link"
        color="primary"
        size="sm"
        :padded="false"
        @click="
          () => {
            router.push('/user/register');
          }
        "
      >
        Register Instead
      </UButton>
    </div>

    <p class="text-xs text-gray-400 text-center">
      Experiencing issues? Contact us at
      <a
        href="mailto:thecardmystic@gmail.com"
        class="text-purple-400 hover:text-purple-300 underline"
        >thecardmystic@gmail.com</a
      >
    </p>
  </div>
</template>
