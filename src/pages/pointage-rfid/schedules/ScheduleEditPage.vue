<template>
  <div class="schedule-edit-page">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">{{ t('schedules.editTitle') }}</h1>
      <AppButton
        v-if="canDelete && schedule"
        @click="showDeleteModal = true"
        variant="danger"
      >
        <TrashIcon class="w-4 h-4 mr-1" />
        {{ t('schedules.deleteBtn') }}
      </AppButton>
    </div>

    <AppCard>
      <div v-if="loadingSchedule" class="flex justify-center py-8">
        <p>{{ t('common.loading') }}</p>
      </div>

      <ScheduleForm
        v-else-if="schedule"
        :initial-data="schedule"
        :companies="companyStore.companies"
        :departments="departmentStore.departments"
        :loading="loading"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />

      <div v-else class="text-center py-8">
        <p class="text-gray-600">{{ t('schedules.notFound') }}</p>
      </div>
    </AppCard>

    <AppConfirmDialog
      :open="showDeleteModal"
      :title="t('schedules.confirmDelete')"
      :message="t('schedules.deleteConfirm', { name: schedule?.name })"
      @confirm="handleDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import ScheduleForm from '@/components/forms/ScheduleForm.vue'
import { useScheduleStore } from '@/stores/schedule.store'
import { useCompanyStore } from '@/stores/company.store'
import { useDepartmentStore } from '@/stores/department.store'
import { usePermissions } from '@/composables/usePermissions'
import { useToast } from '@/composables/useToast'
import type { Schedule } from '@/types/schedule'
import { TrashIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const scheduleStore = useScheduleStore()
const companyStore = useCompanyStore()
const departmentStore = useDepartmentStore()
const permissions = usePermissions()
const { isSuperAdmin, isAdminEnterprise } = permissions
const toast = useToast()

const loading = ref(false)
const loadingSchedule = ref(false)
const showDeleteModal = ref(false)
const schedule = ref<Schedule | null>(null)

const canDelete = computed(() => permissions.isAdminOrSuperOrTech.value)

const scheduleId = computed(() => String(route.params.id))

const handleSubmit = async (data: Partial<Schedule>) => {
  loading.value = true
  try {
    await scheduleStore.updateSchedule(scheduleId.value, data)
    toast.success(t('common.success'), t('schedules.updatedSuccess'))
    router.push('/pointage-rfid/schedules')
  } catch (error: any) {
    toast.error(t('common.error'), error.message || t('schedules.updateError'))
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.back()
}

const handleDelete = async () => {
  try {
    await scheduleStore.deleteSchedule(scheduleId.value)
    showDeleteModal.value = false
    router.push('/pointage-rfid/schedules')
  } catch (error: any) {
    toast.error(t('common.error'), error.message || t('schedules.deleteError'))
  }
}

onMounted(async () => {
  loadingSchedule.value = true
  try {
    await Promise.all([
      companyStore.fetchCompanies({ perPage: 100 }),
      departmentStore.fetchDepartments({ perPage: 500 }),
    ])
    schedule.value = await scheduleStore.fetchScheduleById(scheduleId.value)
  } catch {
    toast.error(t('common.error'), t('schedules.loadError'))
  } finally {
    loadingSchedule.value = false
  }
})
</script>

<style scoped>
.schedule-edit-page {
  padding: 1.5rem;
}
</style>
