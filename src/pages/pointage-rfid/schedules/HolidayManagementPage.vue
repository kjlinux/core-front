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
              <PlusIcon class="w-4 h-4 mr-1" />
              Ajouter un jour ferie
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
          <AppBadge :variant="row.isRecurring ? 'success' : 'neutral'">
            {{ row.isRecurring ? 'Oui' : 'Non' }}
          </AppBadge>
        </template>

        <template #actions="{ row }">
          <div class="flex gap-1">
            <AppButton @click="openEditModal(row)" variant="ghost" size="sm" title="Modifier">
              <PencilIcon class="w-4 h-4" />
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

    <AppModal
      v-model="formModalVisible"
      :title="editingHoliday ? 'Modifier le jour ferie' : 'Nouveau jour ferie'"
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
            Recurrent chaque annee
          </label>
        </div>
      </form>

      <template #footer>
        <AppButton variant="secondary" size="sm" @click="formModalVisible = false">Annuler</AppButton>
        <AppButton variant="primary" size="sm" @click="handleSubmit">Enregistrer</AppButton>
      </template>
    </AppModal>

    <AppConfirmDialog
      :open="deleteModalVisible"
      title="Confirmer la suppression"
      :message="`Etes-vous sur de vouloir supprimer le jour ferie &quot;${holidayToDelete?.name}&quot; ? Cette action est irreversible.`"
      @confirm="confirmDelete"
      @cancel="deleteModalVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted } from 'vue'
import DataTable from '@/components/data-display/DataTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import { useScheduleStore } from '@/stores/schedule.store'
import { usePermissions } from '@/composables/usePermissions'
import { formatDate } from '@/utils/format'
import type { Holiday } from '@/types/schedule'
import dayjs from 'dayjs'
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/vue/24/outline'

const scheduleStore = useScheduleStore()
const { isSuperAdmin, isAdminEnterprise } = usePermissions()

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

const canCreate = computed(() => isSuperAdmin.value || isAdminEnterprise.value)
const canDelete = computed(() => isSuperAdmin.value || isAdminEnterprise.value)

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
      await scheduleStore.createHoliday({ ...formData.value, id: editingHoliday.value.id })
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
