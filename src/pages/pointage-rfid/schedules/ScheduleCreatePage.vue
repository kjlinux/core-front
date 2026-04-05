<template>
  <div>
    <div class="mb-6">
      <AppButton variant="outline" size="sm" @click="handleCancel">
        <ArrowLeftIcon class="h-4 w-4 mr-2 inline" />
        {{ t('common.back') }}
      </AppButton>
    </div>

    <AppCard>
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">{{ t('schedules.create') }}</h1>
        <p class="mt-1 text-sm text-gray-500">{{ t('schedules.createSubtitle') }}</p>
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
import { useI18n } from 'vue-i18n'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ScheduleForm from '@/components/forms/ScheduleForm.vue'
import { useScheduleStore } from '@/stores/schedule.store'
import { useCompanyStore } from '@/stores/company.store'
import { useDepartmentStore } from '@/stores/department.store'
import { useToast } from '@/composables/useToast'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import type { Schedule } from '@/types'

const { t } = useI18n()
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
    toast.success(t('common.success'), t('schedules.createdSuccess'))
    router.push('/pointage-rfid/schedules')
  } catch (error: any) {
    toast.error(t('common.error'), error.message || t('schedules.createError'))
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.push('/pointage-rfid/schedules')
}
</script>
