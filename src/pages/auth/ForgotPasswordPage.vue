<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-2xl font-bold text-primary-900">Mot de passe oublie</h2>
      <p class="mt-1 text-sm text-primary-500">
        Entrez votre email pour recevoir un lien de reinitialisation
      </p>
    </div>

    <!-- Success Message -->
    <div
      v-if="successMessage"
      class="bg-primary-100 border border-primary-300 text-primary-700 px-4 py-3 rounded-lg text-sm"
    >
      {{ successMessage }}
    </div>

    <!-- Form -->
    <form v-if="!successMessage" @submit.prevent="handleSubmit" class="space-y-5">
      <AppInput
        v-model="email"
        type="email"
        label="Email"
        placeholder="votre.email@example.com"
        :error="emailError"
        :disabled="isLoading"
      />

      <AppButton
        type="submit"
        variant="primary"
        class="w-full"
        :loading="isLoading"
        :disabled="isLoading"
      >
        Envoyer le lien
      </AppButton>
    </form>

    <!-- Back to Login -->
    <div class="text-center">
      <router-link
        to="/login"
        class="text-sm text-primary-600 hover:text-primary-800 font-medium inline-flex items-center gap-1 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour a la connexion
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { authApi } from '@/services/api/auth.api'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'

const email = ref('')
const emailError = ref('')
const successMessage = ref('')
const isLoading = ref(false)

function validateEmail(): boolean {
  emailError.value = ''

  if (!email.value) {
    emailError.value = 'L\'email est requis'
    return false
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    emailError.value = 'L\'email n\'est pas valide'
    return false
  }

  return true
}

async function handleSubmit() {
  if (!validateEmail()) {
    return
  }

  isLoading.value = true

  try {
    await authApi.forgotPassword(email.value)
    successMessage.value = `Un lien de reinitialisation a ete envoye a ${email.value}. Veuillez verifier votre boite de reception.`
  } catch {
    emailError.value = 'Une erreur est survenue. Veuillez reessayer.'
  } finally {
    isLoading.value = false
  }
}
</script>
