<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-primary-900">Nouveau mot de passe</h2>
      <p class="mt-1 text-sm text-primary-500">
        Choisissez un nouveau mot de passe securise pour votre compte.
      </p>
    </div>

    <div
      v-if="errorMessage"
      class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
    >
      {{ errorMessage }}
    </div>

    <div
      v-if="successMessage"
      class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm"
    >
      {{ successMessage }}
      <router-link to="/login" class="underline font-medium ml-1">Se connecter</router-link>
    </div>

    <form v-if="!successMessage && tokenValid" @submit.prevent="handleSubmit" class="space-y-5">
      <AppInput
        v-model="form.password"
        type="password"
        label="Nouveau mot de passe"
        placeholder="Minimum 8 caracteres"
        :disabled="isLoading"
      />
      <AppInput
        v-model="form.passwordConfirmation"
        type="password"
        label="Confirmer le mot de passe"
        :disabled="isLoading"
      />

      <div class="text-xs text-gray-500 space-y-1">
        <p class="font-medium text-gray-700">Exigences :</p>
        <p>- Minimum 8 caracteres</p>
        <p>- Au moins une majuscule</p>
        <p>- Au moins une minuscule</p>
        <p>- Au moins un chiffre</p>
      </div>

      <AppButton
        type="submit"
        variant="primary"
        class="w-full"
        :loading="isLoading"
        :disabled="isLoading"
      >
        Reinitialiser le mot de passe
      </AppButton>
    </form>

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
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { authApi } from '@/services/api/auth.api'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'

const route = useRoute()

const form = ref({ password: '', passwordConfirmation: '' })
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const tokenValid = ref(true)

const token = ref('')
const email = ref('')

onMounted(() => {
  token.value = (route.query.token as string) ?? ''
  email.value = (route.query.email as string) ?? ''
  if (!token.value || !email.value) {
    tokenValid.value = false
    errorMessage.value = 'Lien de reinitialisation invalide ou expire. Veuillez faire une nouvelle demande.'
  }
})

function validate(): boolean {
  errorMessage.value = ''
  if (form.value.password.length < 8) {
    errorMessage.value = 'Le mot de passe doit contenir au moins 8 caracteres'
    return false
  }
  if (!/[A-Z]/.test(form.value.password)) {
    errorMessage.value = 'Le mot de passe doit contenir au moins une majuscule'
    return false
  }
  if (!/[a-z]/.test(form.value.password)) {
    errorMessage.value = 'Le mot de passe doit contenir au moins une minuscule'
    return false
  }
  if (!/\d/.test(form.value.password)) {
    errorMessage.value = 'Le mot de passe doit contenir au moins un chiffre'
    return false
  }
  if (form.value.password !== form.value.passwordConfirmation) {
    errorMessage.value = 'Les mots de passe ne correspondent pas'
    return false
  }
  return true
}

async function handleSubmit() {
  if (!validate()) return
  isLoading.value = true
  try {
    await authApi.resetPassword({
      token: token.value,
      email: email.value,
      password: form.value.password,
      password_confirmation: form.value.passwordConfirmation,
    })
    successMessage.value = 'Mot de passe reinitialise avec succes.'
  } catch (err: any) {
    errorMessage.value = err?.response?.data?.message ?? 'Lien invalide ou expire. Veuillez faire une nouvelle demande.'
  } finally {
    isLoading.value = false
  }
}
</script>
