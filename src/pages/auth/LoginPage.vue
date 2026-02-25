<template>
  <div class="space-y-6">
    <!-- Form Header -->
    <div>
      <h2 class="text-2xl font-bold text-primary-900">Connexion</h2>
      <p class="mt-1 text-sm text-primary-500">Connectez-vous à votre compte</p>
    </div>

    <!-- Error Message -->
    <div
      v-if="errorMessage"
      class="bg-danger-50 border border-danger-200 text-danger-600 px-4 py-3 rounded-lg text-sm"
    >
      {{ errorMessage }}
    </div>

    <!-- Login Form -->
    <form @submit.prevent="handleLogin" class="space-y-5">
      <AppInput
        v-model="formData.email"
        type="email"
        label="Email"
        placeholder="admin@tanga.com"
        :error="errors.email"
        :disabled="authStore.isLoading"
      />

      <AppInput
        v-model="formData.password"
        type="password"
        label="Mot de passe"
        placeholder="••••••••"
        :error="errors.password"
        :disabled="authStore.isLoading"
      />

      <div class="flex items-center justify-end">
        <router-link
          to="/forgot-password"
          class="text-sm text-primary-600 hover:text-primary-800 font-medium transition-colors"
        >
          Mot de passe oublié ?
        </router-link>
      </div>

      <AppButton
        type="submit"
        variant="primary"
        class="w-full"
        :loading="authStore.isLoading"
        :disabled="authStore.isLoading"
      >
        Se connecter
      </AppButton>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'

const router = useRouter()
const authStore = useAuthStore()

const formData = reactive({
  email: '',
  password: '',
})

const errors = reactive({
  email: '',
  password: '',
})

const errorMessage = ref('')

function validateForm(): boolean {
  errors.email = ''
  errors.password = ''
  errorMessage.value = ''

  let isValid = true

  if (!formData.email) {
    errors.email = 'L\'email est requis'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'L\'email n\'est pas valide'
    isValid = false
  }

  if (!formData.password) {
    errors.password = 'Le mot de passe est requis'
    isValid = false
  }

  return isValid
}

async function handleLogin() {
  if (!validateForm()) {
    return
  }

  try {
    await authStore.login({
      email: formData.email,
      password: formData.password,
    })

    authStore.persistUser()
    router.push('/')
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || error.message || 'Echec de la connexion. Verifiez vos identifiants.'
  }
}
</script>
