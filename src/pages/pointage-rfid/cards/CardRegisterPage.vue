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
        <h1 class="text-2xl font-bold text-gray-900">Enregistrer une carte RFID</h1>
        <p class="mt-1 text-sm text-gray-500">Enregistrer une nouvelle carte dans le systeme</p>
      </div>

      <CardForm
        v-model="formData"
        :companies="companyStore.companies"
        :loading="loading"
        @submit="handleSubmit"
      />
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import CardForm from '@/components/forms/CardForm.vue'
import { useCardStore } from '@/stores/card.store'
import { useCompanyStore } from '@/stores/company.store'
import { useToast } from '@/composables/useToast'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import type { RfidCard } from '@/types'

const router = useRouter()
const cardStore = useCardStore()
const companyStore = useCompanyStore()
const toast = useToast()

const loading = ref(false)
const formData = ref<Partial<RfidCard>>({})

onMounted(() => {
  companyStore.fetchCompanies({ perPage: 100 })
})

const handleSubmit = async () => {
  loading.value = true
  try {
    await cardStore.registerCard(formData.value)
    toast.success('Succes', 'Carte enregistree avec succes')
    router.push('/pointage-rfid/cards')
  } catch (error: any) {
    toast.error('Erreur', error.message || "Erreur lors de l'enregistrement de la carte")
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.push('/pointage-rfid/cards')
}
</script>
