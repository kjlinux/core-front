<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEmployeeStore } from '@/stores/employee.store'
import { useCompanyStore } from '@/stores/company.store'
import { useSiteStore } from '@/stores/site.store'
import { useDepartmentStore } from '@/stores/department.store'
import { useToast } from '@/composables/useToast'
import type { Employee } from '@/types'
import EmployeeForm from '@/components/forms/EmployeeForm.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'

const router = useRouter()
const employeeStore = useEmployeeStore()
const companyStore = useCompanyStore()
const siteStore = useSiteStore()
const departmentStore = useDepartmentStore()
const toast = useToast()

const formData = ref<Partial<Employee>>({
  isActive: true,
})

const isLoadingData = ref(false)

onMounted(async () => {
  isLoadingData.value = true
  try {
    await Promise.all([
      companyStore.fetchCompanies({ perPage: 100 }),
      siteStore.fetchSites({ perPage: 200 }),
      departmentStore.fetchDepartments({ perPage: 200 }),
    ])
  } finally {
    isLoadingData.value = false
  }
})

const handleSubmit = async () => {
  try {
    await employeeStore.createEmployee(formData.value)
    toast.success('Succes', 'Employe cree avec succes')
    router.push({ name: 'rfid-employees' })
  } catch (error: any) {
    toast.error('Erreur', error.message || "Erreur lors de la creation de l'employe")
  }
}

const handleCancel = () => {
  router.push({ name: 'rfid-employees' })
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Nouvel employe</h1>
      <AppButton variant="secondary" @click="handleCancel">
        Retour
      </AppButton>
    </div>

    <AppCard>
      <div v-if="isLoadingData" class="py-12 text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent" />
        <p class="mt-4 text-sm text-gray-500">Chargement des données...</p>
      </div>

      <div v-else>
        <EmployeeForm
          v-model="formData"
          :companies="companyStore.companies"
          :sites="siteStore.sites"
          :departments="departmentStore.departments"
          :loading="employeeStore.isLoading"
          @submit="handleSubmit"
        />

        <div class="mt-6 flex justify-end space-x-3">
          <AppButton variant="secondary" @click="handleCancel" :disabled="employeeStore.isLoading">
            Annuler
          </AppButton>
          <AppButton :loading="employeeStore.isLoading" @click="handleSubmit">
            Creer l'employe
          </AppButton>
        </div>
      </div>
    </AppCard>
  </div>
</template>
