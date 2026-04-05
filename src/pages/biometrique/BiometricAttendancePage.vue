<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('biometric.attendanceTitle') }}</h1>
        <p class="mt-1 text-sm text-gray-500">
          {{ t('biometric.attendanceSubtitle') }}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <input
          v-model="selectedDate"
          type="date"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          @change="fetchData"
        />
        <AppButton variant="secondary" size="sm" @click="fetchData">
          <ArrowPathIcon class="w-4 h-4 mr-1" />
          {{ t('common.refresh') }}
        </AppButton>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        :title="t('biometric.totalAttendance')"
        :value="stats.totalEmployees"
        :icon="ClipboardDocumentListIcon"
        icon-bg-class="bg-blue-100"
        icon-color-class="text-blue-600"
      />
      <StatCard
        :title="t('biometric.present')"
        :value="stats.present"
        :icon="CheckCircleIcon"
        icon-bg-class="bg-green-100"
        icon-color-class="text-green-600"
      />
      <StatCard
        :title="t('biometric.late')"
        :value="stats.late"
        :icon="ClockIcon"
        icon-bg-class="bg-orange-100"
        icon-color-class="text-orange-600"
      />
      <StatCard
        :title="t('biometric.doubleBadge')"
        :value="stats.doubleBadgeCount"
        :icon="ExclamationTriangleIcon"
        icon-bg-class="bg-red-100"
        icon-color-class="text-red-600"
      />
    </div>

    <!-- Tableau des pointages -->
    <AppCard :title="t('biometric.attendanceOfDay')" :subtitle="formattedDate">
      <div v-if="loading" class="flex justify-center py-12">
        <AppSpinner />
      </div>

      <div v-else-if="records.length === 0" class="py-12 text-center text-sm text-gray-500">
        {{ t('biometric.noAttendance') }}
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                {{ t('biometric.employee') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                {{ t('biometric.dept') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                {{ t('biometric.entry') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                {{ t('biometric.exit') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                {{ t('biometric.status') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                {{ t('biometric.lateTime') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                {{ t('biometric.doubleBadgeCol') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                {{ t('biometric.notes') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr
              v-for="record in records"
              :key="record.id"
              class="transition-colors hover:bg-gray-50"
              :class="{ 'bg-red-50': record.isDoubleBadge }"
            >
              <td class="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                {{ record.employeeName }}
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                {{ record.department }}
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                {{ formatTime(record.entryTime) }}
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                {{ formatTime(record.exitTime) }}
              </td>
              <td class="whitespace-nowrap px-4 py-4">
                <AppBadge :variant="statusVariant(record.status)" size="sm">
                  {{ statusLabel(record.status) }}
                </AppBadge>
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-sm">
                <span v-if="record.lateMinutes > 0" class="font-medium text-orange-600">
                  {{ record.lateMinutes }} {{ t('biometric.min') }}
                </span>
                <span v-else class="text-gray-400">—</span>
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-sm">
                <AppBadge v-if="record.isDoubleBadge" variant="danger" size="sm">
                  {{ t('common.yes') }} ({{ record.ignoredBadges }} {{ record.ignoredBadges > 1 ? t('biometric.ignoredPl') : t('biometric.ignored') }})
                </AppBadge>
                <span v-else class="text-gray-400">—</span>
              </td>
              <td class="px-4 py-4 text-sm text-gray-500">
                {{ record.notes || '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!loading && allRecords.length > bioPerPage" class="mt-4">
        <AppPagination
          :current-page="bioPage"
          :total-pages="totalBioPages"
          :per-page="bioPerPage"
          @page-change="bioPage = $event"
        />
      </div>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAttendanceStore } from '@/stores/attendance.store'
import StatCard from '@/components/data-display/StatCard.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline'

const { t } = useI18n()
const attendanceStore = useAttendanceStore()

const selectedDate = ref(new Date().toISOString().split('T')[0])
const today = new Date().toISOString().split('T')[0]
const loading = ref(false)
const rawReport = ref<any>(null)

const formattedDate = computed(() =>
  new Date(selectedDate.value ?? '').toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
)

// Update rawReport in realtime when a biometric record arrives today
watch(
  () => attendanceStore.recentActivity,
  (activity) => {
    if (selectedDate.value !== today || !rawReport.value) return
    const incoming = activity.filter((r) => r.source === 'biometric')
    if (incoming.length === 0) return
    const existing = rawReport.value.records as any[]
    let changed = false
    for (const r of incoming) {
      const idx = existing.findIndex((e: any) => e.id === r.id)
      if (idx !== -1) {
        existing[idx] = r
        changed = true
      } else {
        existing.unshift(r)
        changed = true
      }
    }
    if (changed) {
      rawReport.value = { ...rawReport.value, records: [...existing] }
    }
  },
  { deep: true },
)

const allRecords = computed(() => {
  const recs = [...(rawReport.value?.records ?? [])]
  return recs.sort((a, b) => {
    const ta = a.entryTime ? new Date(a.entryTime).getTime() : 0
    const tb = b.entryTime ? new Date(b.entryTime).getTime() : 0
    return tb - ta
  })
})

const bioPage = ref(1)
const bioPerPage = 20

const totalBioPages = computed(() => Math.ceil(allRecords.value.length / bioPerPage) || 1)

const records = computed(() => {
  const start = (bioPage.value - 1) * bioPerPage
  return allRecords.value.slice(start, start + bioPerPage)
})

const stats = computed(() => {
  const recs = rawReport.value?.records ?? []
  return {
    totalEmployees: rawReport.value?.totalEmployees ?? recs.length,
    present: recs.filter((r: any) => r.status === 'present').length,
    late: recs.filter((r: any) => r.status === 'late').length,
    doubleBadgeCount: recs.filter((r: any) => r.isDoubleBadge).length,
  }
})

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    present: t('biometric.present_status'),
    absent: t('biometric.absent_status'),
    late: t('biometric.late_status'),
    left_early: t('biometric.early_leave_status'),
  }
  return map[status] ?? status
}

function statusVariant(status: string): 'success' | 'danger' | 'warning' | 'neutral' {
  const map: Record<string, 'success' | 'danger' | 'warning' | 'neutral'> = {
    present: 'success',
    absent: 'danger',
    late: 'warning',
    left_early: 'warning',
  }
  return map[status] ?? 'neutral'
}

async function fetchData() {
  loading.value = true
  bioPage.value = 1
  try {
    rawReport.value = await attendanceStore.fetchBiometricAttendance(selectedDate.value ?? '')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>
