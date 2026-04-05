<template>
  <div class="space-y-6">
    <!-- Form Header -->
    <div>
      <h2 class="text-2xl font-bold text-primary-900">{{ t('auth.login') }}</h2>
      <p class="mt-1 text-sm text-primary-500">{{ t('auth.loginSubtitle') }}</p>
    </div>

    <!-- Session Expired Message -->
    <div
      v-if="sessionExpired"
      class="bg-warning-50 border border-warning-200 text-warning-700 px-4 py-3 rounded-lg text-sm"
    >
      {{ t('auth.sessionExpired') }}
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
        :label="t('auth.email')"
        placeholder=""
        :error="errors.email"
        :disabled="authStore.isLoading"
      />

      <AppInput
        v-model="formData.password"
        type="password"
        :label="t('auth.password')"
        placeholder="••••••••"
        :error="errors.password"
        :disabled="authStore.isLoading"
      />

      <div class="flex items-center justify-end">
        <router-link
          to="/forgot-password"
          class="text-sm text-primary-600 hover:text-primary-800 font-medium transition-colors"
        >
          {{ t('auth.forgotPassword') }}
        </router-link>
      </div>

      <AppButton
        type="submit"
        variant="primary"
        class="w-full"
        :loading="authStore.isLoading"
        :disabled="authStore.isLoading"
      >
        {{ t('auth.loginButton') }}
      </AppButton>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const sessionExpired = computed(() => route.query.expired === '1')

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
    errors.email = t('auth.emailRequired')
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = t('auth.emailInvalid')
    isValid = false
  }

  if (!formData.password) {
    errors.password = t('auth.passwordRequired')
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
    const redirect = route.query.redirect as string
    router.push(redirect || '/')
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || error.message || t('auth.loginErrorFallback')
  }
}
</script>
