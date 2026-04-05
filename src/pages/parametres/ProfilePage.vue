<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'

const { t } = useI18n()
const authStore = useAuthStore()
const toast = useToast()

const user = computed(() => authStore.user)
const isSavingProfile = ref(false)
const isSavingPassword = ref(false)

const profileForm = ref({
  firstName: '',
  lastName: '',
  email: '',
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const roleLabels = computed<Record<string, string>>(() => ({
  super_admin: t('roles.super_admin'),
  admin_enterprise: t('roles.admin_enterprise'),
  manager: t('roles.manager'),
}))

const initials = computed(() => {
  const first = profileForm.value.firstName[0] ?? ''
  const last = profileForm.value.lastName[0] ?? ''
  return (first + last).toUpperCase()
})

async function saveProfile() {
  isSavingProfile.value = true
  try {
    await authStore.updateProfile({
      firstName: profileForm.value.firstName,
      lastName: profileForm.value.lastName,
    })
    toast.showSuccess(t('parametres.profileUpdated'))
  } catch {
    toast.showError(t('parametres.profileUpdateError'))
  } finally {
    isSavingProfile.value = false
  }
}

async function changePassword() {
  if (!passwordForm.value.currentPassword) {
    toast.showError(t('parametres.currentPasswordRequired'))
    return
  }
  if (passwordForm.value.newPassword.length < 8) {
    toast.showError(t('parametres.min8'))
    return
  }
  if (!/[A-Z]/.test(passwordForm.value.newPassword)) {
    toast.showError(t('parametres.uppercase'))
    return
  }
  if (!/[a-z]/.test(passwordForm.value.newPassword)) {
    toast.showError(t('parametres.lowercase'))
    return
  }
  if (!/\d/.test(passwordForm.value.newPassword)) {
    toast.showError(t('parametres.digit'))
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    toast.showError(t('parametres.mismatch'))
    return
  }
  isSavingPassword.value = true
  try {
    await authStore.changePassword({
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword,
      newPassword_confirmation: passwordForm.value.confirmPassword,
    })
    toast.showSuccess(t('parametres.passwordUpdated'))
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  } catch {
    toast.showError(t('parametres.passwordUpdateError'))
  } finally {
    isSavingPassword.value = false
  }
}

onMounted(() => {
  if (user.value) {
    profileForm.value.firstName = user.value.firstName
    profileForm.value.lastName = user.value.lastName
    profileForm.value.email = user.value.email
  }
})
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">{{ t('parametres.profileTitle') }}</h1>

    <AppCard :title="t('parametres.personalInfo')">
      <div class="flex items-start gap-6 mb-6">
        <div class="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {{ initials || 'U' }}
        </div>
        <div>
          <p class="font-semibold text-gray-900">{{ profileForm.firstName }} {{ profileForm.lastName }}</p>
          <p class="text-sm text-gray-500">{{ profileForm.email }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        <AppInput v-model="profileForm.firstName" :label="t('parametres.firstName')" />
        <AppInput v-model="profileForm.lastName" :label="t('parametres.lastName')" />
        <div class="sm:col-span-2">
          <AppInput
            v-model="profileForm.email"
            :label="t('common.email')"
            type="email"
            :disabled="true"
          />
          <p class="text-xs text-gray-400 mt-1">{{ t('parametres.emailNote') }}</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-700 mb-1">{{ t('parametres.role') }}</p>
          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {{ roleLabels[user?.role ?? ''] ?? user?.role }}
          </span>
        </div>
      </div>

      <div class="mt-6">
        <AppButton variant="primary" :loading="isSavingProfile" @click="saveProfile">{{ t('parametres.saveBtn') }}</AppButton>
      </div>
    </AppCard>

    <AppCard :title="t('parametres.changePassword')">
      <div class="space-y-4 max-w-sm">
        <AppInput v-model="passwordForm.currentPassword" :label="t('parametres.currentPassword')" type="password" />
        <AppInput v-model="passwordForm.newPassword" :label="t('parametres.newPassword')" type="password" />
        <AppInput v-model="passwordForm.confirmPassword" :label="t('parametres.confirmPassword')" type="password" />
        <div class="text-xs text-gray-500 space-y-1">
          <p class="font-medium text-gray-700">{{ t('parametres.requirements') }}</p>
          <p>{{ t('parametres.req8chars') }}</p>
          <p>{{ t('parametres.reqUppercase') }}</p>
          <p>{{ t('parametres.reqLowercase') }}</p>
          <p>{{ t('parametres.reqDigit') }}</p>
        </div>
        <AppButton variant="primary" :loading="isSavingPassword" @click="changePassword">{{ t('parametres.changePasswordBtn') }}</AppButton>
      </div>
    </AppCard>
  </div>
</template>
