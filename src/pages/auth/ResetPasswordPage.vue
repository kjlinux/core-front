<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-primary-900">{{ t('auth.newPassword') }}</h2>
      <p class="mt-1 text-sm text-primary-500">
        {{ t('auth.newPasswordSubtitle') }}
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
      <router-link to="/login" class="underline font-medium ml-1">{{ t('auth.signIn') }}</router-link>
    </div>

    <form v-if="!successMessage && tokenValid" @submit.prevent="handleSubmit" class="space-y-5">
      <AppInput
        v-model="form.password"
        type="password"
        :label="t('auth.newPasswordLabel')"
        :placeholder="t('auth.newPasswordPlaceholder')"
        :disabled="isLoading"
      />
      <AppInput
        v-model="form.passwordConfirmation"
        type="password"
        :label="t('auth.confirmPassword')"
        :disabled="isLoading"
      />

      <div class="text-xs text-gray-500 space-y-1">
        <p class="font-medium text-gray-700">{{ t('auth.requirements') }}</p>
        <p>{{ t('auth.req8chars') }}</p>
        <p>{{ t('auth.reqUppercase') }}</p>
        <p>{{ t('auth.reqLowercase') }}</p>
        <p>{{ t('auth.reqDigit') }}</p>
      </div>

      <AppButton
        type="submit"
        variant="primary"
        class="w-full"
        :loading="isLoading"
        :disabled="isLoading"
      >
        {{ t('auth.resetButton') }}
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
        {{ t('auth.backToLogin') }}
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { authApi } from '@/services/api/auth.api'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'

const { t } = useI18n()
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
    errorMessage.value = t('auth.invalidResetLink')
  }
})

function validate(): boolean {
  errorMessage.value = ''
  if (form.value.password.length < 8) {
    errorMessage.value = t('auth.passwordMin8')
    return false
  }
  if (!/[A-Z]/.test(form.value.password)) {
    errorMessage.value = t('auth.passwordUppercase')
    return false
  }
  if (!/[a-z]/.test(form.value.password)) {
    errorMessage.value = t('auth.passwordLowercase')
    return false
  }
  if (!/\d/.test(form.value.password)) {
    errorMessage.value = t('auth.passwordDigit')
    return false
  }
  if (form.value.password !== form.value.passwordConfirmation) {
    errorMessage.value = t('auth.passwordMismatch')
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
    successMessage.value = t('auth.passwordResetSuccess')
  } catch (err: any) {
    errorMessage.value = err?.response?.data?.message ?? t('auth.invalidLinkFallback')
  } finally {
    isLoading.value = false
  }
}
</script>
