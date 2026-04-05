<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useEmployeeStore } from '@/stores/employee.store'
import { useCompanyStore } from '@/stores/company.store'
import { useSiteStore } from '@/stores/site.store'
import { useDepartmentStore } from '@/stores/department.store'
import { useToast } from '@/composables/useToast'
import type { Employee } from '@/types'
import EmployeeForm from '@/components/forms/EmployeeForm.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'

const { t } = useI18n()
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
    toast.success(t('common.success'), t('employees.createdSuccess'))
    router.push({ name: 'rfid-employees' })
  } catch (error: any) {
    toast.error(t('common.error'), error.message || t('employees.createError'))
  }
}

const handleCancel = () => {
  router.push({ name: 'rfid-employees' })
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('employees.create') }}</h1>
      <AppButton variant="secondary" @click="handleCancel">
        {{ t('common.back') }}
      </AppButton>
    </div>

    <AppCard>
      <div v-if="isLoadingData" class="py-12 text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent" />
        <p class="mt-4 text-sm text-gray-500">{{ t('employees.loadingData') }}</p>
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
            {{ t('common.cancel') }}
          </AppButton>
          <AppButton :loading="employeeStore.isLoading" @click="handleSubmit">
            {{ t('employees.create') }}
          </AppButton>
        </div>
      </div>
    </AppCard>
  </div>
</template>
