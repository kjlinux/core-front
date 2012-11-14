<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-md">
      <AppCard class="shadow-lg">
        <div class="space-y-6">
          <!-- Logo -->
          <div class="text-center">
            <h1 class="text-3xl font-bold text-primary-600">CORE TANGA GROUP</h1>
            <p class="mt-2 text-sm text-gray-600">Connectez-vous a votre compte</p>
          </div>

          <!-- Error Message -->
          <div
            v-if="errorMessage"
            class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
          >
            {{ errorMessage }}
          </div>

          <!-- Login Form -->
          <form @submit.prevent="handleLogin" class="space-y-4">
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

            <div class="text-right">
              <router-link
                to="/auth/forgot-password"
                class="text-sm text-primary-600 hover:text-primary-700"
              >
                Mot de passe oublie?
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

          <!-- Test Credentials Hint -->
          <div class="text-center text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            <p class="font-medium mb-1">Identifiants de test:</p>
            <p>admin@tanga.com / admin123</p>
          </div>
        </div>
      </AppCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import AppCard from '@/components/ui/AppCard.vue'
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

    // Persist user data
    authStore.persistUser()

    // Navigate to dashboard on success
    router.push('/')
  } catch (error: any) {
    errorMessage.value = error.message || 'Echec de la connexion. Verifiez vos identifiants.'
  }
}
</script>
