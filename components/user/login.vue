<script setup lang="ts">
import { useSupabase } from '~/composables/useSupabase'

const supabase = useSupabase()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref<string | null>(null)

const signInWithGoogle = async () => {
  errorMessage.value = null
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google'
  })
}

const signInWithEmail = async () => {
  loading.value = true
  errorMessage.value = null

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value
  })

  loading.value = false

  if (error) {
    errorMessage.value = error.message
  } else {
    navigateTo('/')
  }
}
</script>

<template>
  <div class="flex flex-col space-y-4 rounded-xl bg-zinc-900 p-6 shadow-xl">

    <h1 class="text-xl font-bold text-white text-center">
      Sign in to CardMystic
    </h1>

    <UButton class="w-full" color="neutral" variant="solid" icon="i-simple-icons-google" label="Continue with Google"
      @click="signInWithGoogle" />

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
      <UButton variant="link" color="primary" size="sm" :padded="false" @click="$emit('switch-to-register')">
        Register Instead
      </UButton>
    </div>

  </div>
</template>
