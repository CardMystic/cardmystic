<template>
  <SpaceBackground>
    <ClientOnly>
      <!-- Step 1: Request reset email -->
      <div v-if="!isRecoverySession" class="flex flex-col space-y-4 rounded-xl bg-zinc-900 p-6 shadow-xl">
        <h1 class="text-xl font-bold text-white text-center">Reset your password</h1>
        <p class="text-zinc-400 text-sm text-center">
          Enter your email and we'll send you a link to reset your password.
        </p>

        <UInput v-model="email" type="email" placeholder="Email" size="lg" class="w-full" />

        <!-- Honeypot: hidden from real users, bots will fill this in -->
        <input v-model="honeypot" type="text" name="website" tabindex="-1" autocomplete="off"
          style="position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0;" aria-hidden="true" />

        <UButton color="primary" variant="solid" size="md" :loading="loading" :disabled="loading || !email"
          @click="sendResetEmail">
          {{ loading ? 'Sending…' : 'Send reset link' }}
        </UButton>

        <p v-if="errorMessage" class="text-red-400 text-sm text-center">{{ errorMessage }}</p>
        <p v-if="successMessage" class="text-green-400 text-sm text-center">{{ successMessage }}</p>

        <div class="text-center text-zinc-400 text-sm">
          <UButton variant="link" color="primary" size="sm" :padded="false" @click="router.push('/login')">
            Back to login
          </UButton>
        </div>
      </div>

      <!-- Step 2: Set new password (arrived via magic link) -->
      <div v-else class="flex flex-col space-y-4 rounded-xl bg-zinc-900 p-6 shadow-xl">
        <h1 class="text-xl font-bold text-white text-center">Set a new password</h1>

        <UInput v-model="newPassword" :type="showPasswords ? 'text' : 'password'" placeholder="New password" size="lg"
          class="w-full">
          <template #trailing>
            <UButton variant="link" color="neutral" :padded="false"
              :icon="showPasswords ? 'i-lucide-eye-off' : 'i-lucide-eye'" @click="showPasswords = !showPasswords" />
          </template>
        </UInput>
        <UInput v-model="confirmPassword" :type="showPasswords ? 'text' : 'password'" placeholder="Confirm new password"
          size="lg" class="w-full">
          <template #trailing>
            <UButton variant="link" color="neutral" :padded="false"
              :icon="showPasswords ? 'i-lucide-eye-off' : 'i-lucide-eye'" @click="showPasswords = !showPasswords" />
          </template>
        </UInput>

        <!-- Honeypot: hidden from real users, bots will fill this in -->
        <input v-model="honeypot" type="text" name="website" tabindex="-1" autocomplete="off"
          style="position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0;" aria-hidden="true" />

        <ul class="text-xs text-zinc-500 space-y-0.5 list-disc list-inside">
          <li>At least 8 characters</li>
          <li>Uppercase &amp; lowercase letters</li>
          <li>At least one number</li>
          <li>At least one special character</li>
          <li>No whitespace</li>
        </ul>

        <UButton color="primary" variant="solid" size="md" :loading="loading"
          :disabled="loading || !newPassword || !confirmPassword" @click="submitNewPassword">
          {{ loading ? 'Updating…' : 'Update password' }}
        </UButton>

        <p v-if="errorMessage" class="text-red-400 text-sm text-center">{{ errorMessage }}</p>
        <p v-if="successMessage" class="text-green-400 text-sm text-center">{{ successMessage }}</p>
      </div>

      <template #fallback>
        <div class="flex flex-col space-y-4 rounded-xl bg-zinc-900 p-6 shadow-xl">
          <USkeleton class="h-7 w-48 mx-auto" />
          <USkeleton class="h-4 w-64 mx-auto" />
          <USkeleton class="h-10 w-full rounded-md" />
          <USkeleton class="h-10 w-full rounded-md" />
        </div>
      </template>
    </ClientOnly>
  </SpaceBackground>
</template>

<script setup lang="ts">
import { useSupabase } from '~/composables/useSupabase'
import { useUserProfile } from '~/composables/useUserProfile'

const router = useRouter()

definePageMeta({ layout: 'home' })

useSeoMeta({
  title: 'Reset Password - CardMystic',
  robots: 'noindex, nofollow',
})

const supabase = useSupabase()

const email = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const honeypot = ref('')
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const isRecoverySession = ref(false)
const showPasswords = ref(false)

const { validatePasswordPolicy } = useUserProfile()

onMounted(() => {
  // Check for an error in the URL hash (e.g. expired link)
  // Supabase redirects like: /reset-password#error=access_denied&error_code=otp_expired&error_description=...
  const hash = window.location.hash
  if (hash.includes('error=')) {
    const params = new URLSearchParams(hash.slice(1))
    const desc = params.get('error_description')
    errorMessage.value = desc
      ? desc.replace(/\+/g, ' ')
      : 'This reset link has expired or is invalid. Please request a new one.'
    // Clean the hash from the URL without triggering a reload
    history.replaceState(null, '', window.location.pathname)
    return
  }

  // Listen for the PASSWORD_RECOVERY event from Supabase
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      isRecoverySession.value = true
    }
  })
})

const sendResetEmail = async () => {
  errorMessage.value = null
  successMessage.value = null
  if (honeypot.value) return
  loading.value = true

  const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  loading.value = false

  if (error) {
    errorMessage.value = error.message
  } else {
    successMessage.value = 'Check your email for a reset link!'
  }
}

const submitNewPassword = async () => {
  errorMessage.value = null
  successMessage.value = null
  if (honeypot.value) return

  const policyError = validatePasswordPolicy(newPassword.value)
  if (policyError) {
    errorMessage.value = policyError
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  loading.value = true

  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword.value })

    if (error) {
      errorMessage.value = error.message
    } else {
      await supabase.auth.signOut()
      successMessage.value = 'Password updated! Redirecting to login…'
      setTimeout(() => router.push('/login'), 2000)
    }
  } catch (error) {
    console.log(error)
    errorMessage.value = 'An unexpected error occurred.'
  }

  loading.value = false
}
</script>
