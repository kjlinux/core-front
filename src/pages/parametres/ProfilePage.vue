<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'

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

const roleLabels: Record<string, string> = {
  super_admin: 'Super Administrateur',
  admin_enterprise: 'Administrateur Entreprise',
  manager: 'Manager',
}

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
    toast.showSuccess('Profil mis a jour avec succes')
  } catch {
    toast.showError('Erreur lors de la mise a jour du profil')
  } finally {
    isSavingProfile.value = false
  }
}

async function changePassword() {
  if (!passwordForm.value.currentPassword) {
    toast.showError('Veuillez saisir votre mot de passe actuel')
    return
  }
  if (passwordForm.value.newPassword.length < 8) {
    toast.showError('Le nouveau mot de passe doit contenir au moins 8 caracteres')
    return
  }
  if (!/[A-Z]/.test(passwordForm.value.newPassword)) {
    toast.showError('Le mot de passe doit contenir au moins une majuscule')
    return
  }
  if (!/[a-z]/.test(passwordForm.value.newPassword)) {
    toast.showError('Le mot de passe doit contenir au moins une minuscule')
    return
  }
  if (!/\d/.test(passwordForm.value.newPassword)) {
    toast.showError('Le mot de passe doit contenir au moins un chiffre')
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    toast.showError('Les mots de passe ne correspondent pas')
    return
  }
  isSavingPassword.value = true
  try {
    await authStore.changePassword({
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword,
      newPassword_confirmation: passwordForm.value.confirmPassword,
    })
    toast.showSuccess('Mot de passe mis a jour avec succes')
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  } catch {
    toast.showError('Erreur lors du changement de mot de passe')
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
    <h1 class="text-2xl font-bold text-gray-900">Mon profil</h1>

    <AppCard title="Informations personnelles">
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
        <AppInput v-model="profileForm.firstName" label="Prenom" />
        <AppInput v-model="profileForm.lastName" label="Nom" />
        <div class="sm:col-span-2">
          <AppInput
            v-model="profileForm.email"
            label="Email"
            type="email"
            :disabled="true"
          />
          <p class="text-xs text-gray-400 mt-1">Pour changer votre email, contactez l'administrateur</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-700 mb-1">Role</p>
          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {{ roleLabels[user?.role ?? ''] ?? user?.role }}
          </span>
        </div>
      </div>

      <div class="mt-6">
        <AppButton variant="primary" :loading="isSavingProfile" @click="saveProfile">Enregistrer les modifications</AppButton>
      </div>
    </AppCard>

    <AppCard title="Changer le mot de passe">
      <div class="space-y-4 max-w-sm">
        <AppInput v-model="passwordForm.currentPassword" label="Mot de passe actuel" type="password" />
        <AppInput v-model="passwordForm.newPassword" label="Nouveau mot de passe" type="password" />
        <AppInput v-model="passwordForm.confirmPassword" label="Confirmer le nouveau mot de passe" type="password" />
        <div class="text-xs text-gray-500 space-y-1">
          <p class="font-medium text-gray-700">Exigences :</p>
          <p>- Minimum 8 caracteres</p>
          <p>- Au moins une majuscule</p>
          <p>- Au moins une minuscule</p>
          <p>- Au moins un chiffre</p>
        </div>
        <AppButton variant="primary" :loading="isSavingPassword" @click="changePassword">Modifier le mot de passe</AppButton>
      </div>
    </AppCard>
  </div>
</template>
