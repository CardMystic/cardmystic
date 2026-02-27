<script setup lang="ts">
import { useSupabase } from '~/composables/useSupabase'
import { useRecaptcha } from '~/composables/useRecaptcha'

const router = useRouter()

const supabase = useSupabase()
const { verifyRecaptcha } = useRecaptcha()
const config = useRuntimeConfig()
const { validatePasswordPolicy } = useUserProfile()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const honeypot = ref('')
const showPasswords = ref(false)

const signUpWithGoogle = async () => {
  errorMessage.value = null
  loading.value = true

  const verified = await verifyRecaptcha('signup_google')
  if (!verified) {
    errorMessage.value = 'Security verification failed. Please try again.'
    loading.value = false
    return
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google'
  })

  loading.value = false

  if (error) {
    errorMessage.value = error.message
  }
}

const signUpWithEmail = async () => {
  loading.value = true
  errorMessage.value = null
  successMessage.value = null

  if (honeypot.value) {
    loading.value = false
    return
  }

  const passwordError = validatePasswordPolicy(password.value)
  if (passwordError) {
    errorMessage.value = passwordError
    loading.value = false
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    loading.value = false
    return
  }

  const verified = await verifyRecaptcha('signup')
  if (!verified) {
    errorMessage.value = 'Security verification failed. Please try again.'
    loading.value = false
    return
  }

  try {
    const res = await fetch(`${config.public.backendUrl}/user/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
        confirmPassword: confirmPassword.value,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      errorMessage.value = data.message || 'Signup failed.'
      loading.value = false
      return
    }

    successMessage.value = data.message
    email.value = ''
    password.value = ''
    confirmPassword.value = ''
  } catch (e) {
    errorMessage.value = 'An unexpected error occurred.'
  }

  loading.value = false
}
</script>

<template>
  <div class="flex flex-col space-y-4 rounded-xl bg-zinc-900 p-6 shadow-xl">
    <!-- Honeypot field - hidden from users but visible to bots -->
    <input v-model="honeypot" type="text" name="website" autocomplete="off" tabindex="-1" aria-hidden="true"
      style="position: absolute; left: -9999px; width: 1px; height: 1px;" />

    <h1 class="text-xl font-bold text-white text-center">
      Create your CardMystic account
    </h1>

    <UButton class="w-full cursor-pointer" color="neutral" variant="solid" label="Continue with Google"
      @click="signUpWithGoogle">
      <template #leading>
        <img src="/icons-google.svg" alt="Google" class="w-5 h-5" />
      </template>
    </UButton>

    <div class="text-center text-zinc-400 text-sm">or</div>

    <UInput class="w-full" v-model="email" type="email" placeholder="Email" size="lg" />

    <UInput class="w-full" v-model="password" :type="showPasswords ? 'text' : 'password'" placeholder="Password"
      size="lg">
      <template #trailing>
        <UButton variant="link" color="neutral" :padded="false"
          :icon="showPasswords ? 'i-lucide-eye-off' : 'i-lucide-eye'" @click="showPasswords = !showPasswords" />
      </template>
    </UInput>

    <UInput class="w-full" v-model="confirmPassword" :type="showPasswords ? 'text' : 'password'"
      placeholder="Confirm Password" size="lg">
      <template #trailing>
        <UButton variant="link" color="neutral" :padded="false"
          :icon="showPasswords ? 'i-lucide-eye-off' : 'i-lucide-eye'" @click="showPasswords = !showPasswords" />
      </template>
    </UInput>

    <UButton color="primary" variant="solid" size="md" :loading="loading" :disabled="loading" @click="signUpWithEmail">
      {{ loading ? 'Creating account…' : 'Create account' }}
    </UButton>

    <p v-if="errorMessage" class="text-red-400 text-sm text-center">
      {{ errorMessage }}
    </p>

    <p v-if="successMessage" class="text-green-400 text-sm text-center">
      {{ successMessage }}
    </p>

    <div class="text-center text-zinc-400 text-sm">
      Already have an account?
      <UButton variant="link" color="primary" size="sm" :padded="false" @click="router.push('/login')">
        Login Instead
      </UButton>
    </div>

    <p class="text-xs text-gray-400 text-center">
      Experiencing issues? Contact us at
      <a href="mailto:thecardmystic@gmail.com" class="text-purple-400 hover:text-purple-300 underline">thecardmystic@gmail.com</a>
    </p>

  </div>
</template>
