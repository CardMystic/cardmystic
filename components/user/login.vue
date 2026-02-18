<script setup lang="ts">
import { useSupabase } from '~/composables/useSupabase'
import { useRecaptcha } from '~/composables/useRecaptcha'

const supabase = useSupabase()
const { verifyRecaptcha } = useRecaptcha()
const config = useRuntimeConfig()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const honeypot = ref('')

const signInWithGoogle = async () => {
  errorMessage.value = null
  loading.value = true

  const verified = await verifyRecaptcha('login_google')
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

const signInWithEmail = async () => {
  loading.value = true
  errorMessage.value = null

  if (honeypot.value) {
    loading.value = false
    return
  }

  const verified = await verifyRecaptcha('login')
  if (!verified) {
    errorMessage.value = 'Security verification failed. Please try again.'
    loading.value = false
    return
  }

  try {
    const res = await fetch(`${config.public.backendUrl}/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    })

    const data = await res.json()

    if (!res.ok) {
      errorMessage.value = data.message || 'Login failed.'
      loading.value = false
      return
    }

    // Set the Supabase session from the tokens returned by the backend
    await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    })

    navigateTo('/')
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
      Sign in to CardMystic
    </h1>

    <UButton class="w-full cursor-pointer" color="neutral" variant="solid" label="Continue with Google"
      @click="signInWithGoogle">
      <template #leading>
        <img src="/icons-google.svg" alt="Google" class="w-5 h-5" />
      </template>
    </UButton>

    <div class="text-center text-zinc-400 text-sm">or</div>

    <UInput class="w-full" v-model="email" type="email" placeholder="Email" size="lg" />

    <UInput class="w-full" v-model="password" type="password" placeholder="Password" size="lg" />

    <UButton color="primary" variant="solid" size="md" :loading="loading" :disabled="loading" @click="signInWithEmail">
      {{ loading ? 'Signing in…' : 'Sign in' }}
    </UButton>

    <p v-if="errorMessage" class="text-red-400 text-sm text-center">
      {{ errorMessage }}
    </p>

    <div class="text-center text-zinc-400 text-sm">
      Don't have an account?
      <UButton variant="link" color="primary" size="sm" :padded="false" @click="navigateTo('/register')">
        Register Instead
      </UButton>
    </div>

  </div>
</template>
