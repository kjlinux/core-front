<template>
  <div class="schedule-list-page">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Horaires de travail</h1>
      <AppButton
        v-if="canCreate"
        @click="navigateToCreate"
        variant="primary"
      >
        <PlusIcon class="w-4 h-4 mr-1" />
        Nouvel horaire
      </AppButton>
    </div>

    <AppCard class="mb-6">
      <AppSelect
        v-model="filterCompanyId"
        :options="companyOptions"
        label="Entreprise"
        class="w-full sm:w-64"
      />
    </AppCard>

    <AppCard>
      <DataTable
        :data="filteredSchedules"
        :columns="columns"
        :loading="loading"
        @row-click="handleRowClick"
      >
        <template #companyName="{ row }">
          {{ row.companyName }}
        </template>

        <template #type="{ row }">
          <AppBadge :variant="row.type === 'standard' ? 'blue' : 'purple'">
            {{ row.type === 'standard' ? 'Standard' : 'Personnalise' }}
          </AppBadge>
        </template>

        <template #startTime="{ row }">
          {{ row.startTime }}
        </template>

        <template #endTime="{ row }">
          {{ row.endTime }}
        </template>

        <template #workDays="{ row }">
          <div class="flex gap-1">
            <AppBadge
              v-for="day in getDayBadges(row.workDays)"
              :key="day"
              variant="gray"
              size="sm"
            >
              {{ day }}
            </AppBadge>
          </div>
        </template>

        <template #lateTolerance="{ row }">
          {{ row.lateTolerance }} min
        </template>

        <template #departmentCount="{ row }">
          {{ row.assignedDepartments?.length || 0 }}
        </template>

        <template #actions="{ row }">
          <div class="flex gap-1" @click.stop>
            <AppButton v-if="canEdit" @click="navigateToEdit(row.id)" variant="ghost" size="sm" title="Modifier">
              <PencilIcon class="w-4 h-4" />
            </AppButton>
            <AppButton v-if="canCreate" @click="handleDuplicate(row)" variant="ghost" size="sm" title="Dupliquer">
              <DocumentDuplicateIcon class="w-4 h-4" />
            </AppButton>
            <AppButton
              v-if="canDelete"
              @click="handleDelete(row)"
              variant="ghost"
              size="sm"
              class="text-red-600 hover:text-red-700"
              title="Supprimer"
            >
              <TrashIcon class="w-4 h-4" />
            </AppButton>
          </div>
        </template>
      </DataTable>
    </AppCard>

    <AppConfirmDialog
      :open="deleteModalVisible"
      title="Confirmer la suppression"
      :message="`Etes-vous sur de vouloir supprimer l\'horaire &quot;${scheduleToDelete?.name}&quot; ? Cette action est irreversible.`"
      @confirm="confirmDelete"
      @cancel="deleteModalVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '@/components/data-display/DataTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import { useScheduleStore } from '@/stores/schedule.store'
import { useCompanyStore } from '@/stores/company.store'
import { usePermissions } from '@/composables/usePermissions'
import { useToast } from '@/composables/useToast'
import type { Schedule } from '@/types/schedule'
import { PencilIcon, DocumentDuplicateIcon, TrashIcon, PlusIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const scheduleStore = useScheduleStore()
const companyStore = useCompanyStore()
const permissions = usePermissions()
const { isSuperAdmin, isAdminEnterprise } = permissions
const toast = useToast()

const loading = ref(false)
const deleteModalVisible = ref(false)
const scheduleToDelete = ref<Schedule | null>(null)
const filterCompanyId = ref('')

const canCreate = computed(() => permissions.isAdminOrSuperOrTech.value)
const canEdit = computed(() => permissions.isAdminOrSuperOrTech.value)
const canDelete = computed(() => permissions.isAdminOrSuperOrTech.value)

const companyOptions = computed(() => [
  { value: '', label: 'Toutes les entreprises' },
  ...companyStore.companies.map(c => ({ value: c.id, label: c.name })),
])

const filteredSchedules = computed(() => {
  const list = scheduleStore.schedules.map(s => ({
    ...s,
    companyName: companyStore.companies.find(c => c.id === s.companyId)?.name || '-',
  }))
  if (!filterCompanyId.value) return list
  return list.filter(s => s.companyId === filterCompanyId.value)
})

const columns = [
  { key: 'name', label: 'Nom', sortable: true },
  { key: 'companyName', label: 'Entreprise', sortable: true },
  { key: 'type', label: 'Type', sortable: true },
  { key: 'startTime', label: 'Heure debut', sortable: true },
  { key: 'endTime', label: 'Heure fin', sortable: true },
  { key: 'workDays', label: 'Jours travailles', sortable: false },
  { key: 'lateTolerance', label: 'Tolerance retard', sortable: true },
  { key: 'departmentCount', label: 'Departements', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false }
]

const getDayBadges = (workDays: number[]): string[] => {
  const dayLabels: Record<number, string> = { 1: 'L', 2: 'M', 3: 'M', 4: 'J', 5: 'V', 6: 'S', 7: 'D' }
  return workDays.map(day => dayLabels[day] ?? String(day))
}

const navigateToCreate = () => {
  router.push('/pointage-rfid/schedules/create')
}

const navigateToEdit = (id: string) => {
  router.push(`/pointage-rfid/schedules/${id}/edit`)
}

const handleRowClick = (schedule: Schedule) => {
  navigateToEdit(schedule.id)
}

const handleDuplicate = async (schedule: Schedule) => {
  try {
    const duplicatedData = {
      ...schedule,
      name: `${schedule.name} (Copie)`,
      id: undefined
    }
    await scheduleStore.createSchedule(duplicatedData)
    toast.success('Succes', 'Horaire duplique avec succes')
  } catch (error: any) {
    toast.error('Erreur', error.message || 'Erreur lors de la duplication')
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
    } catch (error: any) {
      toast.error('Erreur', error.message || 'Erreur lors de la suppression')
    }
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      scheduleStore.fetchSchedules(),
      companyStore.fetchCompanies({ perPage: 100 }),
    ])
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.schedule-list-page {
  padding: 1.5rem;
}
</style>
