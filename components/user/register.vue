<script setup lang="ts">
import type { SignUpRequest } from '@/models/userModel';

const router = useRouter();

const {
  signupWithEmail,
  signupWithGoogle,
  resendVerificationEmail,
  validatePasswordPolicy,
} = useUserProfile();

const username = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const signedUpEmail = ref<string | null>(null);
const resending = ref(false);
const resendMessage = ref<string | null>(null);
const honeypot = ref('');
const showPasswords = ref(false);

const signUpWithGoogle = async () => {
  errorMessage.value = null;
  loading.value = true;

  try {
    await signupWithGoogle();
  } catch (e: any) {
    errorMessage.value = e.message || 'An unexpected error occurred.';
  }

  loading.value = false;
};

const signUpWithEmail = async () => {
  loading.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  if (honeypot.value) {
    loading.value = false;
    return;
  }

  if (!username.value.trim()) {
    errorMessage.value = 'Username is required.';
    loading.value = false;
    return;
  }

  const passwordError = validatePasswordPolicy(password.value);
  if (passwordError) {
    errorMessage.value = passwordError;
    loading.value = false;
    return;
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.';
    loading.value = false;
    return;
  }

  try {
    const credentials: SignUpRequest = {
      username: username.value.trim(),
      email: email.value,
      password: password.value,
      confirmPassword: confirmPassword.value,
    };
    const response = await signupWithEmail(credentials);
    successMessage.value = response.message;
    signedUpEmail.value = email.value.trim();
    resendMessage.value = null;

    // Fire Google Ads conversion for Sign-up
    window.gtag?.('event', 'conversion', {
      send_to: 'AW-17812762149/EYNLCLnnzsEcEKXc5K1C',
    });

    username.value = '';
    email.value = '';
    password.value = '';
    confirmPassword.value = '';
  } catch (e: any) {
    errorMessage.value = e.message || 'An unexpected error occurred.';
  }

  loading.value = false;
};

const resendVerification = async () => {
  if (!signedUpEmail.value) return;
  resending.value = true;
  resendMessage.value = null;

  try {
    await resendVerificationEmail(signedUpEmail.value);
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
      Create your CardMystic account
    </h1>

    <UButton
      class="w-full cursor-pointer"
      color="neutral"
      variant="solid"
      label="Continue with Google"
      @click="signUpWithGoogle"
    >
      <template #leading>
        <img src="/icons-google.svg" alt="Google" class="w-5 h-5" />
      </template>
    </UButton>

    <div class="text-center text-zinc-400 text-sm">or</div>

    <UInput
      class="w-full"
      v-model="username"
      type="text"
      placeholder="Username"
      size="lg"
    />

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
      :type="showPasswords ? 'text' : 'password'"
      placeholder="Password"
      size="lg"
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
      class="w-full"
      v-model="confirmPassword"
      :type="showPasswords ? 'text' : 'password'"
      placeholder="Confirm Password"
      size="lg"
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

    <UButton
      color="primary"
      variant="solid"
      size="md"
      :loading="loading"
      :disabled="loading"
      @click="signUpWithEmail"
    >
      {{ loading ? 'Creating account…' : 'Create account' }}
    </UButton>

    <div v-if="errorMessage" class="text-center space-y-1">
      <p class="text-red-400 text-sm">
        {{ errorMessage }}
      </p>
    </div>

    <div v-if="successMessage" class="text-center space-y-1">
      <p class="text-green-400 text-sm">
        {{ successMessage }}
      </p>
      <p v-if="signedUpEmail" class="text-zinc-400 text-xs">
        Didn't get the email?
        <UButton
          variant="link"
          color="primary"
          size="xs"
          :padded="false"
          :loading="resending"
          :disabled="resending"
          @click="resendVerification"
        >
          Resend verification email
        </UButton>
      </p>
      <p v-if="resendMessage" class="text-zinc-400 text-xs">
        {{ resendMessage }}
      </p>
    </div>

    <div class="text-center text-zinc-400 text-sm">
      Already have an account?
      <UButton
        variant="link"
        color="primary"
        size="sm"
        :padded="false"
        @click="
          () => {
            router.push('/user/login');
          }
        "
      >
        Login Instead
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
