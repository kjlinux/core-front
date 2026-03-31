<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useQrcodeStore } from '@/stores/qrcode.store'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import BarChart from '@/components/charts/BarChart.vue'

const store = useQrcodeStore()
const month = ref(new Date().toISOString().slice(0, 7))

onMounted(() => loadData())

async function loadData() {
  await store.fetchAttendance({ perPage: 100 })
}

const statusChartOption = computed(() => {
  const records = store.attendanceRecords
  const counts: Record<string, number> = { present: 0, absent: 0, late: 0, left_early: 0 }
  for (const r of records) {
    counts[r.status] = (counts[r.status] || 0) + 1
  }
  return {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['Present', 'Absent', 'En retard', 'Parti tot'] },
    yAxis: { type: 'value' },
    series: [
      {
        type: 'bar',
        data: [counts.present, counts.absent, counts.late, counts.left_early],
        itemStyle: {
          color: (params: { dataIndex: number }) => {
            const colors = ['#22c55e', '#ef4444', '#f97316', '#3b82f6']
            return colors[params.dataIndex]
          },
        },
      },
    ],
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Rapports QR Code</h1>
      <AppButton variant="outline" :loading="store.isLoading" @click="loadData">
        Actualiser
      </AppButton>
    </div>

    <AppCard title="Repartition des statuts">
      <BarChart :option="statusChartOption" style="height: 300px" />
    </AppCard>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
      <AppCard>
        <p class="text-sm text-gray-600">Total pointages</p>
        <p class="text-3xl font-bold text-gray-900">{{ store.attendanceRecords.length }}</p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-gray-600">Presents</p>
        <p class="text-3xl font-bold text-green-600">
          {{ store.attendanceRecords.filter((r) => r.status === 'present').length }}
        </p>
      </AppCard>
      <AppCard>
        <p class="text-sm text-gray-600">En retard</p>
        <p class="text-3xl font-bold text-orange-600">
          {{ store.attendanceRecords.filter((r) => r.status === 'late').length }}
        </p>
      </AppCard>
    </div>
  </div>
</template>
