<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
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
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const employeeStore = useEmployeeStore()
const companyStore = useCompanyStore()
const siteStore = useSiteStore()
const departmentStore = useDepartmentStore()
const toast = useToast()

const employeeId = route.params.id as string

const formData = ref<Partial<Employee>>({})
const isLoadingData = ref(false)

onMounted(async () => {
  isLoadingData.value = true
  try {
    await Promise.all([
      employeeStore.fetchEmployee(employeeId),
      companyStore.fetchCompanies({ perPage: 100 }),
      siteStore.fetchSites({ perPage: 200 }),
      departmentStore.fetchDepartments({ perPage: 200 }),
    ])

    if (employeeStore.currentEmployee) {
      formData.value = { ...employeeStore.currentEmployee }
    }
  } finally {
    isLoadingData.value = false
  }
})

const handleSubmit = async () => {
  try {
    const { employeeNumber, ...updateData } = formData.value as any
    await employeeStore.updateEmployee(employeeId, updateData)
    toast.success(t('common.success'), t('employees.updatedSuccess'))
    router.push({ name: 'rfid-employee-detail', params: { id: employeeId } })
  } catch (error: any) {
    toast.error(t('common.error'), error.message || t('employees.updateError'))
  }
}

const handleCancel = () => {
  router.push({ name: 'rfid-employee-detail', params: { id: employeeId } })
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('common.edit') }} {{ t('employees.title').toLowerCase() }}</h1>
      <AppButton variant="secondary" @click="handleCancel">
        <ArrowLeftIcon class="w-4 h-4 mr-1" />
        {{ t('common.back') }}
      </AppButton>
    </div>

    <AppCard>
      <div v-if="isLoadingData" class="py-12 text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent" />
        <p class="mt-4 text-sm text-gray-500">{{ t('employees.loadingData') }}</p>
      </div>

      <div v-else-if="!employeeStore.currentEmployee" class="py-12 text-center">
        <p class="text-sm text-gray-500">{{ t('employees.notFound') }}</p>
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
            {{ t('common.saveChanges') }}
          </AppButton>
        </div>
      </div>
    </AppCard>
  </div>
</template>
