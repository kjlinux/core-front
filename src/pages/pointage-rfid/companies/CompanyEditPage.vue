<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCompanyStore } from '@/stores/company.store'
import { useToast } from '@/composables/useToast'
import type { Company } from '@/types'
import CompanyForm from '@/components/forms/CompanyForm.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const companyStore = useCompanyStore()
const toast = useToast()

const companyId = computed(() => route.params.id as string)
const formData = ref<Partial<Company>>({})

onMounted(async () => {
  try {
    await companyStore.fetchCompany(companyId.value)
    if (companyStore.currentCompany) {
      formData.value = {
        name: companyStore.currentCompany.name,
        email: companyStore.currentCompany.email,
        phone: companyStore.currentCompany.phone,
        address: companyStore.currentCompany.address,
        logo: companyStore.currentCompany.logo,
        isActive: companyStore.currentCompany.isActive,
        subscription: companyStore.currentCompany.subscription,
      }
    }
  } catch (error: any) {
    toast.error('Erreur', error.message || 'Erreur lors du chargement de l\'entreprise')
    router.push({ name: 'rfid-companies' })
  }
})

async function handleSubmit() {
  try {
    await companyStore.updateCompany(companyId.value, formData.value)
    toast.success('Succès', 'Entreprise modifiée avec succès')
    router.push({ name: 'rfid-company-detail', params: { id: companyId.value } })
  } catch (error: any) {
    toast.error('Erreur', error.message || 'Erreur lors de la modification de l\'entreprise')
  }
}

function handleCancel() {
  router.push({ name: 'rfid-company-detail', params: { id: companyId.value } })
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
      <div v-if="companyStore.isLoading && !companyStore.currentCompany" class="flex justify-center py-12">
        <div class="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
      </div>

      <div v-else>
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900">Modifier entreprise</h1>
          <p class="mt-1 text-sm text-gray-500">
            Modifier les informations de l'entreprise {{ companyStore.currentCompany?.name }}
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
            Enregistrer les modifications
          </AppButton>
        </div>
      </div>
    </AppCard>
  </div>
</template>
