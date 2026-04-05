<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQrcodeStore } from '@/stores/qrcode.store'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppInput from '@/components/ui/AppInput.vue'
import DataTable from '@/components/data-display/DataTable.vue'

const { t } = useI18n()
const store = useQrcodeStore()
const dateFilter = ref(new Date().toISOString().split('T')[0])
const currentPage = ref(1)
const perPage = 20

const columns = computed(() => [
  { key: 'employeeName', label: t('biometric.employee') },
  { key: 'date', label: t('common.date') },
  { key: 'entryTime', label: t('qrcode.entryLabel') },
  { key: 'exitTime', label: t('qrcode.exitLabel') },
  { key: 'status', label: t('common.status') },
  { key: 'gpsVerified', label: t('qrcode.gpsLabel') },
  { key: 'scannedAt', label: t('qrcode.scannedAt') },
])

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
  const map: Record<string, string> = {
    present: t('attendance.status.present'),
    absent: t('attendance.status.absent'),
    late: t('attendance.status.late'),
    left_early: t('attendance.status.left_early'),
  }
  return map[status] || status
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('qrcode.attendance') }}</h1>
    </div>

    <AppCard>
      <div class="mb-4 flex items-end gap-4">
        <AppInput
          v-model="dateFilter"
          :label="t('common.date')"
          type="date"
          class="w-48"
        />
        <AppButton variant="outline" :loading="store.isLoading" @click="loadData">
          {{ t('common.filter') }}
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
            {{ row.gpsVerified ? `${t('common.yes')} (${row.distanceMeters}m)` : t('common.no') }}
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
          {{ store.pagination.total }}
          {{ store.pagination.total > 1 ? t('qrcode.attendancePl') : t('qrcode.attendanceList') }} —
          {{ t('common.page') }} {{ currentPage }} / {{ store.pagination.totalPages }}
        </p>
        <div class="flex gap-2">
          <AppButton
            variant="outline"
            size="sm"
            :disabled="currentPage <= 1 || store.isLoading"
            @click="goToPage(currentPage - 1)"
          >
            {{ t('common.previous') }}
          </AppButton>
          <AppButton
            variant="outline"
            size="sm"
            :disabled="currentPage >= store.pagination.totalPages || store.isLoading"
            @click="goToPage(currentPage + 1)"
          >
            {{ t('common.next') }}
          </AppButton>
        </div>
      </div>
    </AppCard>
  </div>
</template>
