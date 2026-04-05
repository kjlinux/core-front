<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFeelbackStore } from '@/stores/feelback.store'
import { useCompanyStore } from '@/stores/company.store'
import dayjs from 'dayjs'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import StatCard from '@/components/data-display/StatCard.vue'
import GaugeChart from '@/components/charts/GaugeChart.vue'
import PieChart from '@/components/charts/PieChart.vue'
import LineChart from '@/components/charts/LineChart.vue'

const { t } = useI18n()
const store = useFeelbackStore()
const companyStore = useCompanyStore()

const selectedPeriod = ref('week')
const selectedCompany = ref('')

const periodOptions = computed(() => [
  { label: t('feelback.today'), value: 'today' },
  { label: t('feelback.thisWeek'), value: 'week' },
  { label: t('feelback.thisMonth'), value: 'month' },
])

const companyOptions = computed(() => [
  { label: t('feelback.allCompanies'), value: '' },
  ...companyStore.companies.map((c) => ({ label: c.name, value: c.id })),
])

const stats = computed(() => store.stats)
const unreadAlerts = computed(() => store.alerts.filter((a) => !a.isRead))

const pieData = computed(() => {
  if (!stats.value) return []
  return [
    { name: t('feelback.good'), value: stats.value.bon },
    { name: t('feelback.neutral'), value: stats.value.neutre },
    { name: t('feelback.bad'), value: stats.value.mauvais },
  ]
})

const lineData = computed(() => {
  if (!stats.value) return []
  return [
    { name: t('feelback.good'), value: stats.value.bon },
    { name: t('feelback.neutral'), value: stats.value.neutre },
    { name: t('feelback.bad'), value: stats.value.mauvais },
  ]
})

const topSites = computed(() =>
  store.comparison
    .filter((s) => s.totalResponses > 0)
    .sort((a, b) => b.satisfactionRate - a.satisfactionRate)
    .slice(0, 5)
    .map((s) => ({
      name: s.siteName ?? '',
      responses: s.totalResponses,
      bon: s.totalResponses > 0 ? Math.round((s.bon / s.totalResponses) * 100) : 0,
      neutre: s.totalResponses > 0 ? Math.round((s.neutre / s.totalResponses) * 100) : 0,
      mauvais: s.totalResponses > 0 ? Math.round((s.mauvais / s.totalResponses) * 100) : 0,
    }))
)

function buildParams() {
  const params: Record<string, unknown> = {}
  if (selectedCompany.value) params.companyId = selectedCompany.value
  if (selectedPeriod.value === 'today') {
    params.startDate = dayjs().format('YYYY-MM-DD')
    params.endDate = dayjs().format('YYYY-MM-DD')
  } else if (selectedPeriod.value === 'week') {
    params.startDate = dayjs().startOf('week').format('YYYY-MM-DD')
    params.endDate = dayjs().format('YYYY-MM-DD')
  } else if (selectedPeriod.value === 'month') {
    params.startDate = dayjs().startOf('month').format('YYYY-MM-DD')
    params.endDate = dayjs().format('YYYY-MM-DD')
  }
  return params
}

async function applyFilters() {
  await Promise.allSettled([
    store.fetchStats(buildParams()),
    store.fetchComparison(buildParams()),
  ])
}

watch([selectedPeriod, selectedCompany], applyFilters)

function getAlertTypeLabel(type: string) {
  switch (type) {
    case 'threshold_exceeded': return t('feelback.thresholdExceeded')
    case 'device_offline': return t('feelback.deviceOffline')
    default: return type
  }
}

function getAlertVariant(type: string) {
  switch (type) {
    case 'threshold_exceeded': return 'danger'
    case 'device_offline': return 'warning'
    default: return 'neutral'
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleString('fr-FR')
}

onMounted(async () => {
  await Promise.allSettled([
    store.fetchStats(buildParams()),
    store.fetchAlerts(),
    store.fetchComparison(buildParams()),
    companyStore.fetchCompanies(),
  ])
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('feelback.dashboardTitle') }}</h1>
        <p class="text-sm text-gray-500 mt-1">{{ t('feelback.dashboardSubtitle') }}</p>
      </div>
      <div class="flex gap-3">
        <AppSelect v-model="selectedCompany" :options="companyOptions" class="w-48" />
        <div class="flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            v-for="opt in periodOptions"
            :key="opt.value"
            class="px-3 py-1.5 text-sm font-medium transition-colors"
            :class="selectedPeriod === opt.value ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'"
            @click="selectedPeriod = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard :title="t('feelback.totalResponses')" :value="stats?.totalResponses ?? 0" />
      <StatCard :title="t('feelback.good')" :value="`${stats?.bon ?? 0} (${stats?.totalResponses ? Math.round((stats.bon / stats.totalResponses) * 100) : 0}%)`" />
      <StatCard :title="t('feelback.neutral')" :value="`${stats?.neutre ?? 0} (${stats?.totalResponses ? Math.round((stats.neutre / stats.totalResponses) * 100) : 0}%)`" />
      <StatCard :title="t('feelback.bad')" :value="`${stats?.mauvais ?? 0} (${stats?.totalResponses ? Math.round((stats.mauvais / stats.totalResponses) * 100) : 0}%)`" />
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AppCard :title="t('feelback.satisfactionRate')">
        <GaugeChart :value="stats?.satisfactionRate ?? 0" :title="t('feelback.satisfaction')" />
      </AppCard>
      <AppCard :title="t('feelback.votesDistrib')">
        <PieChart :data="pieData" :title="t('feelback.distribution')" />
      </AppCard>
    </div>

    <!-- Trends -->
    <AppCard :title="t('feelback.weeklyEvolution')">
      <LineChart :data="lineData" :title="t('feelback.trends')" />
    </AppCard>

    <!-- Top sites -->
    <AppCard :title="t('feelback.top5Sites')">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('feelback.site') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('feelback.responses') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('feelback.goodPct') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('feelback.neutralPct') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('feelback.badPct') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="site in topSites" :key="site.name" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ site.name }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ site.responses }}</td>
              <td class="px-4 py-3 text-sm text-green-600 font-medium">{{ site.bon }}%</td>
              <td class="px-4 py-3 text-sm text-amber-600">{{ site.neutre }}%</td>
              <td class="px-4 py-3 text-sm text-red-600">{{ site.mauvais }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>

    <!-- Alerts -->
    <AppCard v-if="unreadAlerts.length > 0" :title="t('feelback.ongoingAlerts')">
      <div class="space-y-3">
        <div
          v-for="alert in unreadAlerts"
          :key="alert.id"
          class="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200"
        >
          <AppBadge :variant="getAlertVariant(alert.type) as any">
            {{ getAlertTypeLabel(alert.type) }}
          </AppBadge>
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-900">{{ alert.siteName }}</p>
            <p class="text-sm text-gray-600">{{ alert.message }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ formatDate(alert.createdAt) }}</p>
          </div>
        </div>
      </div>
    </AppCard>
  </div>
</template>
