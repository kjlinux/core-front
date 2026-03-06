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
        <h1 class="text-2xl font-bold text-gray-900">Nouvel horaire</h1>
        <p class="mt-1 text-sm text-gray-500">Creer un nouvel horaire de travail</p>
      </div>

      <ScheduleForm
        :companies="companyStore.companies"
        :departments="departmentStore.departments"
        :loading="loading"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ScheduleForm from '@/components/forms/ScheduleForm.vue'
import { useScheduleStore } from '@/stores/schedule.store'
import { useCompanyStore } from '@/stores/company.store'
import { useDepartmentStore } from '@/stores/department.store'
import { useToast } from '@/composables/useToast'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import type { Schedule } from '@/types'

const router = useRouter()
const scheduleStore = useScheduleStore()
const companyStore = useCompanyStore()
const departmentStore = useDepartmentStore()
const toast = useToast()

const loading = ref(false)

onMounted(() => {
  companyStore.fetchCompanies({ perPage: 100 })
  departmentStore.fetchDepartments({ perPage: 500 })
})

const handleSubmit = async (data: Partial<Schedule>) => {
  loading.value = true
  try {
    await scheduleStore.createSchedule(data)
    toast.success('Succes', 'Horaire cree avec succes')
    router.push('/pointage-rfid/schedules')
  } catch (error: any) {
    toast.error('Erreur', error.message || "Erreur lors de la creation de l'horaire")
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.push('/pointage-rfid/schedules')
}
</script>
