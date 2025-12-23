<script setup lang="ts">
import { useSupabase } from '~/composables/useSupabase'

const supabase = useSupabase()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const signUpWithGoogle = async () => {
  errorMessage.value = null
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google'
  })

  if (!error) {
    console.log('Registration successful with Google:', data)
  }
}

const signUpWithEmail = async () => {
  loading.value = true
  errorMessage.value = null
  successMessage.value = null

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match'
    loading.value = false
    return
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value
  })

  loading.value = false

  if (error) {
    errorMessage.value = error.message
  } else {
    console.log('Registration successful:', {
      user: data.user,
      session: data.session
    })
    successMessage.value = 'Account created! Please check your email to verify your account before logging in.'
    email.value = ''
    password.value = ''
    confirmPassword.value = ''
  }
}
</script>

<template>
  <div class="flex flex-col space-y-4 rounded-xl bg-zinc-900 p-6 shadow-xl">

    <h1 class="text-xl font-bold text-white text-center">
      Create your CardMystic account
    </h1>

    <UButton class="w-full" color="neutral" variant="solid" icon="i-simple-icons-google" label="Continue with Google"
      @click="signUpWithGoogle" />

    <div class="text-center text-zinc-400 text-sm">or</div>

    <UInput class="w-full" v-model="email" type="email" placeholder="Email" size="lg" />

    <UInput class="w-full" v-model="password" type="password" placeholder="Password" size="lg" />

    <UInput class="w-full" v-model="confirmPassword" type="password" placeholder="Confirm Password" size="lg" />

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
      <UButton variant="link" color="primary" size="sm" :padded="false" @click="$emit('switch-to-login')">
        Login Instead
      </UButton>
    </div>

  </div>
</template>
