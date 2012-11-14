<template>
  <div class="holiday-management-page">
    <AppCard>
      <template #header>
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold">Jours feries</h1>
          <div class="flex gap-4 items-center">
            <select
              v-model="selectedYear"
              class="border rounded-md px-3 py-2"
              @change="filterHolidays"
            >
              <option value="all">Toutes les années</option>
              <option :value="currentYear">{{ currentYear }}</option>
              <option :value="currentYear + 1">{{ currentYear + 1 }}</option>
            </select>
            <AppButton
              v-if="canCreate"
              @click="openCreateModal"
              variant="primary"
            >
              Ajouter un jour férié
            </AppButton>
          </div>
        </div>
      </template>

      <DataTable
        :data="filteredHolidays"
        :columns="columns"
        :loading="loading"
      >
        <template #date="{ row }">
          {{ formatDate(row.date) }}
        </template>

        <template #isRecurring="{ row }">
          <AppBadge :variant="row.isRecurring ? 'green' : 'gray'">
            {{ row.isRecurring ? 'Oui' : 'Non' }}
          </AppBadge>
        </template>

        <template #actions="{ row }">
          <div class="flex gap-2">
            <AppButton
              @click="openEditModal(row)"
              variant="ghost"
              size="sm"
            >
              Modifier
            </AppButton>
            <AppButton
              v-if="canDelete"
              @click="handleDelete(row)"
              variant="ghost"
              size="sm"
              class="text-red-600 hover:text-red-700"
            >
              Supprimer
            </AppButton>
          </div>
        </template>
      </DataTable>
    </AppCard>

    <AppModal
      v-model:visible="formModalVisible"
      :title="editingHoliday ? 'Modifier le jour férié' : 'Nouveau jour férié'"
      @confirm="handleSubmit"
    >
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Nom</label>
          <input
            v-model="formData.name"
            type="text"
            required
            class="w-full border rounded-md px-3 py-2"
            placeholder="Ex: Nouvel An"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Date</label>
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
            Récurrent chaque année
          </label>
        </div>
      </form>
    </AppModal>

    <AppModal
      v-model:visible="deleteModalVisible"
      title="Confirmer la suppression"
      @confirm="confirmDelete"
    >
      <p>Êtes-vous sûr de vouloir supprimer le jour férié "{{ holidayToDelete?.name }}" ?</p>
      <p class="text-sm text-gray-600 mt-2">Cette action est irréversible.</p>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DataTable from '@/components/common/DataTable.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppModal from '@/components/common/AppModal.vue'
import { useScheduleStore } from '@/stores/scheduleStore'
import { usePermissions } from '@/composables/usePermissions'
import { formatDate } from '@/utils/format'
import type { Holiday } from '@/types/schedule'
import dayjs from 'dayjs'

const scheduleStore = useScheduleStore()
const { hasPermission } = usePermissions()

const loading = ref(false)
const formModalVisible = ref(false)
const deleteModalVisible = ref(false)
const editingHoliday = ref<Holiday | null>(null)
const holidayToDelete = ref<Holiday | null>(null)
const selectedYear = ref<string | number>('all')
const currentYear = new Date().getFullYear()

const formData = ref({
  name: '',
  date: '',
  isRecurring: false
})

const canCreate = computed(() => hasPermission('schedules.create'))
const canDelete = computed(() => hasPermission('schedules.delete'))

const holidays = computed(() => scheduleStore.holidays || [])

const filteredHolidays = computed(() => {
  let filtered = [...holidays.value]

  if (selectedYear.value !== 'all') {
    filtered = filtered.filter(holiday => {
      const year = dayjs(holiday.date).year()
      return year === Number(selectedYear.value)
    })
  }

  return filtered.sort((a, b) => {
    const dateA = dayjs(a.date)
    const dateB = dayjs(b.date)
    const now = dayjs()

    const isAUpcoming = dateA.isAfter(now)
    const isBUpcoming = dateB.isAfter(now)

    if (isAUpcoming && !isBUpcoming) return -1
    if (!isAUpcoming && isBUpcoming) return 1

    return dateA.diff(dateB)
  })
})

const columns = [
  { key: 'name', label: 'Nom', sortable: true },
  { key: 'date', label: 'Date', sortable: true },
  { key: 'isRecurring', label: 'Récurrent', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false }
]

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
  } catch (error) {
    console.error('Failed to save holiday:', error)
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
    } catch (error) {
      console.error('Failed to delete holiday:', error)
    }
  }
}

const filterHolidays = () => {
  // Filtering is handled by computed property
}

const resetForm = () => {
  formData.value = {
    name: '',
    date: '',
    isRecurring: false
  }
  editingHoliday.value = null
}

onMounted(async () => {
  loading.value = true
  try {
    await scheduleStore.fetchHolidays()
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.holiday-management-page {
  padding: 1.5rem;
}
</style>
