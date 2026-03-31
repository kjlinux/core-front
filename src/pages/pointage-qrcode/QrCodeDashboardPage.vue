<script setup lang="ts">
import { onMounted } from 'vue'
import { useQrcodeStore } from '@/stores/qrcode.store'
import StatCard from '@/components/data-display/StatCard.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import { QrCodeIcon, UsersIcon, ClockIcon, ChartBarIcon, DevicePhoneMobileIcon } from '@heroicons/vue/24/outline'

const store = useQrcodeStore()

onMounted(async () => {
  await Promise.all([store.fetchStats(), store.fetchAttendance({ perPage: 10 })])
})

function formatDateTime(dt: string) {
  return new Date(dt).toLocaleString('fr-FR')
}

function getStatusVariant(status: string): 'success' | 'danger' | 'warning' | 'info' | 'neutral' {
  const map: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'neutral'> = {
    present: 'success',
    absent: 'danger',
    late: 'warning',
    left_early: 'info',
  }
  return map[status] ?? 'neutral'
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    present: 'Present',
    absent: 'Absent',
    late: 'En retard',
    left_early: 'Parti tot',
  }
  return map[status] || status
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Tableau de bord QR Code</h1>
      <AppButton variant="outline" :loading="store.isLoading" @click="store.fetchStats()">
        Actualiser
      </AppButton>
    </div>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="QR Codes de sites"
        :value="store.stats?.activeQrCodes ?? 0"
        :icon="QrCodeIcon"
        icon-bg-class="bg-blue-100"
        icon-color-class="text-blue-600"
      />
      <StatCard
        title="Telephones enroles"
        :value="store.stats?.enrolledDevices ?? 0"
        :suffix="store.stats ? ` / ${store.stats.totalEmployees}` : ''"
        :icon="DevicePhoneMobileIcon"
        icon-bg-class="bg-green-100"
        icon-color-class="text-green-600"
      />
      <StatCard
        title="Scans aujourd'hui"
        :value="store.stats?.scansToday ?? 0"
        :icon="ClockIcon"
        icon-bg-class="bg-orange-100"
        icon-color-class="text-orange-600"
      />
      <StatCard
        title="Taux de presence"
        :value="store.stats?.attendanceRate ?? 0"
        suffix="%"
        :icon="ChartBarIcon"
        icon-bg-class="bg-purple-100"
        icon-color-class="text-purple-600"
      />
    </div>

    <AppCard title="Activite recente">
      <div v-if="store.isLoading" class="py-8 text-center text-gray-500">Chargement...</div>
      <div v-else-if="store.attendanceRecords.length === 0" class="py-8 text-center text-gray-500">
        Aucune activite recente
      </div>
      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="record in store.attendanceRecords"
          :key="record.id"
          class="flex items-center justify-between py-3"
        >
          <div>
            <p class="text-sm font-medium text-gray-900">{{ record.employeeName }}</p>
            <p class="text-xs text-gray-500">{{ formatDateTime(record.scannedAt) }}</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xs text-gray-500">
              {{ record.entryTime ?? '-' }} → {{ record.exitTime ?? '-' }}
            </span>
            <AppBadge v-if="record.gpsVerified !== undefined" :variant="record.gpsVerified ? 'success' : 'warning'" class="text-xs">
              {{ record.gpsVerified ? 'GPS ok' : 'GPS non verifie' }}
            </AppBadge>
            <AppBadge :variant="getStatusVariant(record.status)">
              {{ getStatusLabel(record.status) }}
            </AppBadge>
          </div>
        </div>
      </div>
    </AppCard>
  </div>
</template>
