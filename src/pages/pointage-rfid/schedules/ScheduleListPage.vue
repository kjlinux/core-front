<template>
  <div class="schedule-list-page">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">{{ t('schedules.title') }}</h1>
      <AppButton
        v-if="canCreate"
        @click="navigateToCreate"
        variant="primary"
      >
        <PlusIcon class="w-4 h-4 mr-1" />
        {{ t('schedules.create') }}
      </AppButton>
    </div>

    <AppCard class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AppInput
          v-model="search"
          :placeholder="t('common.search') || 'Rechercher...'"
          :label="t('common.search') || 'Rechercher'"
        />
        <AppSelect
          v-model="filters.companyId"
          :options="companyOptions"
          :label="t('schedules.company')"
          @update:model-value="applyFilters"
        />
      </div>
    </AppCard>

    <AppCard>
      <DataTable
        :data="tableData"
        :columns="columns"
        :loading="scheduleStore.isLoading"
        :pagination="scheduleStore.pagination"
        @page-change="handlePageChange"
        @row-click="handleRowClick"
      >
        <template #companyName="{ row }">
          {{ row.companyName }}
        </template>

        <template #type="{ row }">
          <AppBadge :variant="typeBadgeVariant(row.type)">
            {{ typeLabel(row.type) }}
          </AppBadge>
        </template>

        <template #workedDays="{ row }">
          <div class="flex gap-1">
            <AppBadge
              v-for="day in getWorkedDayBadges(row._raw)"
              :key="day"
              variant="neutral"
              size="sm"
            >
              {{ day }}
            </AppBadge>
          </div>
        </template>

        <template #lateTolerance="{ row }">
          {{ row.defaultLateTolerance ?? 0 }} min
        </template>

        <template #departmentCount="{ row }">
          {{ row.departmentCount }}
        </template>

        <template #actions="{ row }">
          <div class="flex gap-1" @click.stop>
            <AppButton v-if="canEdit" @click="navigateToEdit(row.id)" variant="ghost" size="sm" :title="t('common.edit')">
              <PencilIcon class="w-4 h-4" />
            </AppButton>
            <AppButton v-if="canCreate" @click="handleDuplicate(row._raw)" variant="ghost" size="sm" :title="t('schedules.duplicate')">
              <DocumentDuplicateIcon class="w-4 h-4" />
            </AppButton>
            <AppButton
              v-if="canDelete"
              @click="handleDelete(row._raw)"
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

    <AppConfirmDialog
      :open="deleteModalVisible"
      :title="t('schedules.confirmDelete')"
      :message="t('schedules.deleteConfirm', { name: scheduleToDelete?.name })"
      @confirm="confirmDelete"
      @cancel="deleteModalVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import DataTable from '@/components/data-display/DataTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import { useScheduleStore } from '@/stores/schedule.store'
import { useCompanyStore } from '@/stores/company.store'
import { useServerTable } from '@/composables/useServerTable'
import { usePermissions } from '@/composables/usePermissions'
import { useToast } from '@/composables/useToast'
import type { Schedule } from '@/types/schedule'
import { PencilIcon, DocumentDuplicateIcon, TrashIcon, PlusIcon } from '@heroicons/vue/24/outline'
import { sortByRecent } from '@/utils/sort'
import { extractApiErrorMessage } from '@/utils/api-error'

const { t } = useI18n()
const router = useRouter()
const scheduleStore = useScheduleStore()
const companyStore = useCompanyStore()
const permissions = usePermissions()
const toast = useToast()

const deleteModalVisible = ref(false)
const scheduleToDelete = ref<Schedule | null>(null)

const canCreate = computed(() => permissions.isAdminOrSuperOrTech.value)
const canEdit = computed(() => permissions.isAdminOrSuperOrTech.value)
const canDelete = computed(() => permissions.isAdminOrSuperOrTech.value)

const { filters, search, applyFilters, handlePageChange, reload } = useServerTable({
  initialFilters: { companyId: '' as string },
  fetcher: (p) =>
    scheduleStore.fetchSchedules({
      page: p.page,
      perPage: p.perPage,
      search: p.search || undefined,
      companyId: p.companyId || undefined,
    }),
})

const companyOptions = computed(() => [
  { value: '', label: t('schedules.allCompanies') },
  ...companyStore.companies.map(c => ({ value: c.id, label: c.name })),
])

const tableData = computed(() =>
  sortByRecent(scheduleStore.schedules).map(s => ({
    id: s.id,
    name: s.name,
    type: s.type,
    defaultLateTolerance: s.defaultLateTolerance,
    companyName: companyStore.companies.find(c => c.id === s.companyId)?.name || '-',
    departmentCount: s.assignedDepartments?.length || 0,
    _raw: s,
  })),
)

const columns = computed(() => [
  { key: 'name', label: t('common.name'), sortable: true },
  { key: 'companyName', label: t('schedules.company'), sortable: true },
  { key: 'type', label: t('schedules.type'), sortable: true },
  { key: 'workedDays', label: t('schedules.workedDays'), sortable: false },
  { key: 'lateTolerance', label: t('schedules.lateTolerance'), sortable: true },
  { key: 'departmentCount', label: t('schedules.departments'), sortable: true },
  { key: 'actions', label: t('common.actions'), sortable: false }
])

const typeLabel = (type: string): string => {
  const map: Record<string, string> = {
    standard: t('schedules.standard'),
    custom: t('schedules.custom'),
    day: t('schedules.day'),
    night: t('schedules.night'),
  }
  return map[type] ?? type
}

type BadgeVariant = 'success' | 'warning' | 'info' | 'neutral' | 'danger'
const typeBadgeVariant = (type: string): BadgeVariant => {
  const map: Record<string, BadgeVariant> = {
    standard: 'info',
    custom: 'warning',
    day: 'success',
    night: 'neutral',
  }
  return map[type] ?? 'neutral'
}

const getWorkedDayBadges = (row: Schedule): string[] => {
  // 1=lundi .. 7=dimanche (ISO). Mardi/Mercredi distincts (Ma/Me) pour ne pas confondre.
  const dayLabels: Record<number, string> = { 1: 'L', 2: 'Ma', 3: 'Me', 4: 'J', 5: 'V', 6: 'S', 7: 'D' }
  return (row.days ?? [])
    .filter((d) => d.worked && d.segments.length > 0)
    .map((d) => dayLabels[d.weekday] ?? String(d.weekday))
}

const navigateToCreate = () => {
  router.push('/organisation/schedules/create')
}

const navigateToEdit = (id: string) => {
  router.push(`/organisation/schedules/${id}/edit`)
}

const handleRowClick = (row: { id: string }) => {
  navigateToEdit(row.id)
}

const handleDuplicate = async (schedule: Schedule) => {
  try {
    const duplicatedData = {
      ...schedule,
      name: `${schedule.name} (Copie)`,
      id: undefined
    }
    await scheduleStore.createSchedule(duplicatedData)
    toast.success(t('common.success'), t('schedules.duplicatedSuccess'))
    await reload()
  } catch (error) {
    toast.error(t('common.error'), extractApiErrorMessage(error, t('schedules.duplicateError')))
  }
}

const handleDelete = (schedule: Schedule) => {
  scheduleToDelete.value = schedule
  deleteModalVisible.value = true
}

const confirmDelete = async () => {
  if (scheduleToDelete.value) {
    try {
      await scheduleStore.deleteSchedule(scheduleToDelete.value.id)
      deleteModalVisible.value = false
      scheduleToDelete.value = null
      await reload()
    } catch (error) {
      toast.error(t('common.error'), extractApiErrorMessage(error, t('schedules.deleteError')))
    }
  }
}

onMounted(async () => {
  await companyStore.fetchCompanies({ perPage: 100 })
  await reload()
})
</script>

<style scoped>
.schedule-list-page {
  padding: 1.5rem;
}
</style>
