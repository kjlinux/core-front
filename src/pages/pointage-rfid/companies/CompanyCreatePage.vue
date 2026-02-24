<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCompanyStore } from '@/stores/company.store'
import { useToast } from '@/composables/useToast'
import type { Company } from '@/types'
import CompanyForm from '@/components/forms/CompanyForm.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const companyStore = useCompanyStore()
const toast = useToast()

const formData = ref<Partial<Company>>({
  name: '',
  email: '',
  phone: '',
  address: '',
  isActive: true,
  subscription: 'basic',
})

async function handleSubmit() {
  try {
    await companyStore.createCompany(formData.value)
    toast.success('Succès', 'Entreprise créée avec succès')
    router.push({ name: 'rfid-companies' })
  } catch (error: any) {
    toast.error('Erreur', error.message || 'Erreur lors de la création de l\'entreprise')
  }
}

function handleCancel() {
  router.push({ name: 'rfid-companies' })
}
</script>

<template>
  <div>
    <div class="mb-6">
      <AppButton variant="outline" size="sm" @click="handleCancel">
        <ArrowLeftIcon class="h-4 w-4 mr-2 inline" />
        Retour
      </AppButton>
    </div>

    <AppCard>
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Nouvelle entreprise</h1>
        <p class="mt-1 text-sm text-gray-500">
          Créer une nouvelle entreprise dans le système
        </p>
      </div>

      <CompanyForm
        v-model="formData"
        :loading="companyStore.isLoading"
        @submit="handleSubmit"
      />

      <div class="mt-6 flex justify-end gap-3">
        <AppButton variant="outline" @click="handleCancel" :disabled="companyStore.isLoading">
          Annuler
        </AppButton>
        <AppButton
          type="submit"
          :loading="companyStore.isLoading"
          @click="handleSubmit"
        >
          Créer l'entreprise
        </AppButton>
      </div>
    </AppCard>
  </div>
</template>
