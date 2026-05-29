<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { useQrcodeStore } from '@/stores/qrcode.store'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import BarChart from '@/components/charts/BarChart.vue'

const { t } = useI18n()
const store = useQrcodeStore()
const month = ref(new Date().toISOString().slice(0, 7))

const PAGE_SIZE = 500

function parseMonth(value: string): { year: number; month: number } | null {
  const ref = dayjs(value, 'YYYY-MM', true)
  if (!ref.isValid()) return null
  return { year: ref.year(), month: ref.month() + 1 }
}

onMounted(() => loadData())
watch(month, () => loadData())

async function loadData() {
  const parsed = parseMonth(month.value)
  if (!parsed) return
  const ref = dayjs(`${month.value}-01`)
  const startDate = ref.startOf('month').format('YYYY-MM-DD')
  const endDate = ref.endOf('month').format('YYYY-MM-DD')
  await store.fetchAttendance({ startDate, endDate, perPage: PAGE_SIZE })
}

const recordsForMonth = computed(() => {
  const parsed = parseMonth(month.value)
  if (!parsed) return []
  return store.attendanceRecords.filter((r) => {
    const d = new Date(r.date)
    return d.getFullYear() === parsed.year && d.getMonth() + 1 === parsed.month
  })
})

const statusChartData = computed(() => {
  const counts: Record<string, number> = { present: 0, absent: 0, late: 0, left_early: 0 }
  for (const r of recordsForMonth.value) {
    counts[r.status] = (counts[r.status] || 0) + 1
  }
  return [
    { name: t('attendance.status.present'), value: counts.present ?? 0 },
    { name: t('attendance.status.absent'), value: counts.absent ?? 0 },
    { name: t('attendance.status.late'), value: counts.late ?? 0 },
    { name: t('attendance.status.left_early'), value: counts.left_early ?? 0 },
  ]
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('qrcode.reports') }}</h1>
      <div class="flex items-center gap-3">
        <input
          v-model="month"
          type="month"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <AppButton variant="outline" :loading="store.isLoading" @click="loadData">
          {{ t('common.refresh') }}
        </AppButton>
      </div>
    </div>

    <AppCard :title="t('qrcode.statusDistrib')">
      <BarChart :data="statusChartData" height="300px" />
    </AppCard>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
      <AppCard>
        <p class="text-sm text-gray-600">{{ t('qrcode.totalAttendance') }}</p>
        <p class="text-3xl font-bold text-gray-900">{{ recordsForMonth.length }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-gray-600">{{ t('attendance.status.present') }}</p>
        <p class="text-3xl font-bold text-green-600">
          {{ recordsForMonth.filter((r) => r.status === 'present').length }}
        </p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-gray-600">{{ t('attendance.status.late') }}</p>
        <p class="text-3xl font-bold text-orange-600">
          {{ recordsForMonth.filter((r) => r.status === 'late').length }}
        </p>
      </AppCard>
    </div>
  </div>
</template>
