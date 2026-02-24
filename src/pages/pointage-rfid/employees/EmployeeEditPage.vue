<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useEmployeeStore } from '@/stores/employee.store'
import { useCompanyStore } from '@/stores/company.store'
import type { Employee, Company, Site, Department } from '@/types'
import EmployeeForm from '@/components/forms/EmployeeForm.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const employeeStore = useEmployeeStore()
const companyStore = useCompanyStore()

const employeeId = route.params.id as string

const formData = ref<Partial<Employee>>({})
const companies = ref<Company[]>([])
const sites = ref<Site[]>([])
const departments = ref<Department[]>([])
const isLoadingData = ref(false)

onMounted(async () => {
  isLoadingData.value = true
  try {
    await Promise.all([
      employeeStore.fetchEmployee(employeeId),
      companyStore.fetchCompanies({ perPage: 1000 })
    ])

    if (employeeStore.currentEmployee) {
      formData.value = { ...employeeStore.currentEmployee }
    }

    companies.value = companyStore.companies

    const allSites: Site[] = []
    const allDepartments: Department[] = []

    companies.value.forEach((company) => {
      if (company.sites) {
        allSites.push(...company.sites)
        company.sites.forEach((site) => {
          if (site.departments) {
            allDepartments.push(...site.departments)
          }
        })
      }
    })

    sites.value = allSites
    departments.value = allDepartments
  } finally {
    isLoadingData.value = false
  }
})

const handleSubmit = async () => {
  try {
    await employeeStore.updateEmployee(employeeId, formData.value)
    router.push({ name: 'rfid-employee-detail', params: { id: employeeId } })
  } catch (error) {
    console.error('Error updating employee:', error)
  }
}

const handleCancel = () => {
  router.push({ name: 'rfid-employee-detail', params: { id: employeeId } })
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Modifier employe</h1>
      <AppButton variant="secondary" @click="handleCancel">
        <ArrowLeftIcon class="w-4 h-4 mr-1" />
        Retour
      </AppButton>
    </div>

    <AppCard>
      <div v-if="isLoadingData" class="py-12 text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent" />
        <p class="mt-4 text-sm text-gray-500">Chargement des données...</p>
      </div>

      <div v-else-if="!employeeStore.currentEmployee" class="py-12 text-center">
        <p class="text-sm text-gray-500">Employe introuvable</p>
      </div>

      <div v-else>
        <EmployeeForm
          v-model="formData"
          :companies="companies"
          :sites="sites"
          :departments="departments"
          :loading="employeeStore.isLoading"
          @submit="handleSubmit"
        />

        <div class="mt-6 flex justify-end space-x-3">
          <AppButton variant="secondary" @click="handleCancel" :disabled="employeeStore.isLoading">
            Annuler
          </AppButton>
        </div>
      </div>
    </AppCard>
  </div>
</template>
