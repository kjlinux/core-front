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

const columns = [
  { key: 'employeeName', label: 'Employe' },
  { key: 'date', label: 'Date' },
  { key: 'entryTime', label: 'Entree' },
  { key: 'exitTime', label: 'Sortie' },
  { key: 'status', label: 'Statut' },
  { key: 'gpsVerified', label: 'GPS' },
  { key: 'scannedAt', label: 'Scanne le' },
]

onMounted(() => loadData())

async function loadData() {
  await store.fetchAttendance({ date: dateFilter.value })
}

function formatDateTime(dt: string) {
  return new Date(dt).toLocaleString('fr-FR')
}

function getStatusVariant(status: string): 'success' | 'danger' | 'warning' | 'info' | 'neutral' {
  const map: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'neutral'> = { present: 'success', absent: 'danger', late: 'warning', left_early: 'info' }
  return map[status] ?? 'neutral'
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = { present: 'Present', absent: 'Absent', late: 'En retard', left_early: 'Parti tot' }
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
    </AppCard>
  </div>
</template>
