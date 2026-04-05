<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQrcodeStore } from '@/stores/qrcode.store'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import BarChart from '@/components/charts/BarChart.vue'

const { t } = useI18n()
const store = useQrcodeStore()
const month = ref(new Date().toISOString().slice(0, 7))

onMounted(() => loadData())

async function loadData() {
  await store.fetchAttendance({ perPage: 100 })
}

const statusChartData = computed(() => {
  const records = store.attendanceRecords
  const counts: Record<string, number> = { present: 0, absent: 0, late: 0, left_early: 0 }
  for (const r of records) {
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
      <AppButton variant="outline" :loading="store.isLoading" @click="loadData">
        {{ t('common.refresh') }}
      </AppButton>
    </div>

    <AppCard :title="t('qrcode.statusDistrib')">
      <BarChart :data="statusChartData" height="300px" />
    </AppCard>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
      <AppCard>
        <p class="text-sm text-gray-600">{{ t('qrcode.totalAttendance') }}</p>
        <p class="text-3xl font-bold text-gray-900">{{ store.attendanceRecords.length }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-gray-600">{{ t('attendance.status.present') }}</p>
        <p class="text-3xl font-bold text-green-600">
          {{ store.attendanceRecords.filter((r) => r.status === 'present').length }}
        </p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-gray-600">{{ t('attendance.status.late') }}</p>
        <p class="text-3xl font-bold text-orange-600">
          {{ store.attendanceRecords.filter((r) => r.status === 'late').length }}
        </p>
      </AppCard>
    </div>
  </div>
</template>
