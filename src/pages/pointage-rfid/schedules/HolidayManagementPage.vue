<template>
  <div class="holiday-management-page">
    <AppCard>
      <template #header>
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold">{{ t('holidays.title') }}</h1>
          <div class="flex gap-4 items-center">
            <div class="w-48">
              <AppSelect v-model="filters.year" :options="yearOptions" @update:model-value="applyFilters" />
            </div>
            <AppButton
              v-if="canCreate"
              @click="openCreateModal"
              variant="primary"
            >
              <PlusIcon class="w-4 h-4 mr-1" />
              {{ t('holidays.add') }}
            </AppButton>
          </div>
        </div>
      </template>

      <div class="mb-4">
        <AppInput
          v-model="search"
          :placeholder="t('common.search') || 'Rechercher...'"
          :label="t('common.search') || 'Rechercher'"
        />
      </div>

      <DataTable
        :data="holidays"
        :columns="columns"
        :loading="scheduleStore.isLoading"
        :pagination="scheduleStore.holidayPagination"
        @page-change="handlePageChange"
      >
        <template #date="{ row }">
          {{ formatDate(row.date) }}
        </template>

        <template #isRecurring="{ row }">
          <AppBadge :variant="row.isRecurring ? 'success' : 'neutral'">
            {{ row.isRecurring ? t('common.yes') : t('common.no') }}
          </AppBadge>
        </template>

        <template #actions="{ row }">
          <div class="flex gap-1">
            <AppButton @click="openEditModal(row)" variant="ghost" size="sm" :title="t('common.edit')">
              <PencilIcon class="w-4 h-4" />
            </AppButton>
            <AppButton
              v-if="canDelete"
              @click="handleDelete(row)"
              variant="ghost"
              size="sm"
              class="text-red-600 hover:text-red-700"
              :title="t('common.delete')"
            >
              <TrashIcon class="w-4 h-4" />
            </AppButton>
          </div>
        </template>
      </DataTable>
    </AppCard>

    <AppModal
      v-model="formModalVisible"
      :title="editingHoliday ? t('holidays.editTitle') : t('holidays.createTitle')"
    >
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">{{ t('holidays.name') }}</label>
          <input
            v-model="formData.name"
            type="text"
            required
            class="w-full border rounded-md px-3 py-2"
            :placeholder="t('holidays.namePlaceholder')"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">{{ t('holidays.date') }}</label>
          <input
            v-model="formData.date"
            type="date"
            required
            class="w-full border rounded-md px-3 py-2"
          />
        </div>

        <div class="flex items-center gap-2">
          <input
            v-model="formData.isRecurring"
            type="checkbox"
            id="isRecurring"
            class="rounded"
          />
          <label for="isRecurring" class="text-sm font-medium">
            {{ t('holidays.recurringLabel') }}
          </label>
        </div>
      </form>

      <template #footer>
        <AppButton variant="secondary" size="sm" @click="formModalVisible = false">{{ t('common.cancel') }}</AppButton>
        <AppButton variant="primary" size="sm" @click="handleSubmit">{{ t('common.save') }}</AppButton>
      </template>
    </AppModal>

    <AppConfirmDialog
      :open="deleteModalVisible"
      :title="t('holidays.confirmDelete')"
      :message="t('holidays.deleteConfirm', { name: holidayToDelete?.name })"
      @confirm="confirmDelete"
      @cancel="deleteModalVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import DataTable from '@/components/data-display/DataTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import { useScheduleStore } from '@/stores/schedule.store'
import { useServerTable } from '@/composables/useServerTable'
import { usePermissions } from '@/composables/usePermissions'
import { useToast } from '@/composables/useToast'
import { formatDate } from '@/utils/format'
import { extractApiErrorMessage } from '@/utils/api-error'
import type { Holiday } from '@/types/schedule'
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const scheduleStore = useScheduleStore()
const permissions = usePermissions()
const toast = useToast()

const formModalVisible = ref(false)
const deleteModalVisible = ref(false)
const editingHoliday = ref<Holiday | null>(null)
const holidayToDelete = ref<Holiday | null>(null)
const currentYear = new Date().getFullYear()

const yearOptions = computed(() => [
  { value: '', label: t('holidays.allYears') },
  { value: currentYear, label: String(currentYear) },
  { value: currentYear + 1, label: String(currentYear + 1) },
])

const formData = ref({
  name: '',
  date: '',
  isRecurring: false
})

const canCreate = computed(() => permissions.isAdminOrSuperOrTech.value)
const canDelete = computed(() => permissions.isAdminOrSuperOrTech.value)

const { filters, search, applyFilters, handlePageChange, reload } = useServerTable({
  initialFilters: { year: '' as '' | number },
  fetcher: (p) =>
    scheduleStore.fetchHolidays({
      page: p.page,
      perPage: p.perPage,
      search: p.search || undefined,
      year: p.year === '' ? undefined : p.year,
    }),
})

const holidays = computed(() => scheduleStore.holidays || [])

const columns = computed(() => [
  { key: 'name', label: t('holidays.name'), sortable: true },
  { key: 'date', label: t('holidays.date'), sortable: true },
  { key: 'isRecurring', label: t('holidays.recurring'), sortable: true },
  { key: 'actions', label: t('common.actions'), sortable: false }
])

const openCreateModal = () => {
  editingHoliday.value = null
  formData.value = {
    name: '',
    date: '',
    isRecurring: false
  }
  formModalVisible.value = true
}

const openEditModal = (holiday: Holiday) => {
  editingHoliday.value = holiday
  formData.value = {
    name: holiday.name,
    date: holiday.date,
    isRecurring: holiday.isRecurring
  }
  formModalVisible.value = true
}

const handleSubmit = async () => {
  try {
    if (editingHoliday.value) {
      await scheduleStore.updateHoliday(editingHoliday.value.id, formData.value)
    } else {
      await scheduleStore.createHoliday(formData.value)
    }
    formModalVisible.value = false
    resetForm()
    await reload()
  } catch (error: unknown) {
    toast.error(t('common.error'), extractApiErrorMessage(error, t('holidays.saveError')))
  }
}

const handleDelete = (holiday: Holiday) => {
  holidayToDelete.value = holiday
  deleteModalVisible.value = true
}

const confirmDelete = async () => {
  if (holidayToDelete.value) {
    try {
      await scheduleStore.deleteHoliday(holidayToDelete.value.id)
      deleteModalVisible.value = false
      holidayToDelete.value = null
      await reload()
    } catch (error: unknown) {
      toast.error(t('common.error'), extractApiErrorMessage(error, t('holidays.deleteError')))
    }
  }
}

const resetForm = () => {
  formData.value = {
    name: '',
    date: '',
    isRecurring: false
  }
  editingHoliday.value = null
}

onMounted(reload)
</script>

<style scoped>
.holiday-management-page {
  padding: 1.5rem;
}
</style>
