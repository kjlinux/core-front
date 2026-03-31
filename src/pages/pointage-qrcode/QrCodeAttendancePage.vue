<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQrcodeStore } from '@/stores/qrcode.store'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppInput from '@/components/ui/AppInput.vue'
import DataTable from '@/components/data-display/DataTable.vue'

const store = useQrcodeStore()
const dateFilter = ref(new Date().toISOString().split('T')[0])
const currentPage = ref(1)
const perPage = 20

const columns = [
  { key: 'employeeName', label: 'Employé' },
  { key: 'date', label: 'Date' },
  { key: 'entryTime', label: 'Entrée' },
  { key: 'exitTime', label: 'Sortie' },
  { key: 'status', label: 'Statut' },
  { key: 'gpsVerified', label: 'GPS' },
  { key: 'scannedAt', label: 'Scanné le' },
]

onMounted(() => loadData())

async function loadData() {
  currentPage.value = 1
  await store.fetchAttendance({ date: dateFilter.value, page: 1, perPage })
}

async function goToPage(page: number) {
  currentPage.value = page
  await store.fetchAttendance({ date: dateFilter.value, page, perPage })
}

function formatDateTime(dt: string) {
  return new Date(dt).toLocaleString('fr-FR')
}

function getStatusVariant(status: string): 'success' | 'danger' | 'warning' | 'info' | 'neutral' {
  const map: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'neutral'> = { present: 'success', absent: 'danger', late: 'warning', left_early: 'info' }
  return map[status] ?? 'neutral'
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = { present: 'Présent', absent: 'Absent', late: 'En retard', left_early: 'Parti tôt' }
  return map[status] || status
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Pointage QR Code</h1>
    </div>

    <AppCard>
      <div class="mb-4 flex items-end gap-4">
        <AppInput
          v-model="dateFilter"
          label="Date"
          type="date"
          class="w-48"
        />
        <AppButton variant="outline" :loading="store.isLoading" @click="loadData">
          Filtrer
        </AppButton>
      </div>

      <DataTable :columns="columns" :data="store.attendanceRecords" :loading="store.isLoading">
        <template #entryTime="{ row }">{{ row.entryTime ?? '-' }}</template>
        <template #exitTime="{ row }">{{ row.exitTime ?? '-' }}</template>
        <template #status="{ row }">
          <AppBadge :variant="getStatusVariant(row.status)">{{ getStatusLabel(row.status) }}</AppBadge>
        </template>
        <template #gpsVerified="{ row }">
          <AppBadge :variant="row.gpsVerified ? 'success' : 'warning'">
            {{ row.gpsVerified ? `Oui (${row.distanceMeters}m)` : 'Non' }}
          </AppBadge>
        </template>
        <template #scannedAt="{ row }">{{ formatDateTime(row.scannedAt) }}</template>
      </DataTable>

      <!-- Pagineur -->
      <div
        v-if="store.pagination.totalPages > 1"
        class="mt-4 flex items-center justify-between border-t border-gray-100 pt-4"
      >
        <p class="text-sm text-gray-500">
          {{ store.pagination.total }} pointage{{ store.pagination.total > 1 ? 's' : '' }} —
          page {{ currentPage }} / {{ store.pagination.totalPages }}
        </p>
        <div class="flex gap-2">
          <AppButton
            variant="outline"
            size="sm"
            :disabled="currentPage <= 1 || store.isLoading"
            @click="goToPage(currentPage - 1)"
          >
            Précédent
          </AppButton>
          <AppButton
            variant="outline"
            size="sm"
            :disabled="currentPage >= store.pagination.totalPages || store.isLoading"
            @click="goToPage(currentPage + 1)"
          >
            Suivant
          </AppButton>
        </div>
      </div>
    </AppCard>
  </div>
</template>
