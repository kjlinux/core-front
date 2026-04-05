<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFeelbackStore } from '@/stores/feelback.store'
import { useCompanyStore } from '@/stores/company.store'
import { useSiteStore } from '@/stores/site.store'
import dayjs from 'dayjs'
import AppCard from '@/components/ui/AppCard.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppInput from '@/components/ui/AppInput.vue'
import StatCard from '@/components/data-display/StatCard.vue'
import PieChart from '@/components/charts/PieChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import LineChart from '@/components/charts/LineChart.vue'

const { t } = useI18n()
const store = useFeelbackStore()
const companyStore = useCompanyStore()
const siteStore = useSiteStore()

const selectedPeriod = ref('month')
const selectedCompany = ref('')
const selectedSite = ref('')
const customStart = ref('')
const customEnd = ref('')

const periodOptions = computed(() => [
  { label: t('feelback.today'), value: 'today' },
  { label: t('feelback.thisWeek'), value: 'week' },
  { label: t('feelback.thisMonth'), value: 'month' },
  { label: t('feelback.custom'), value: 'custom' },
])

const companyOptions = computed(() => [
  { label: t('feelback.allCompanies'), value: '' },
  ...companyStore.companies.map((c) => ({ label: c.name, value: c.id })),
])

const siteOptions = computed(() => {
  const sites = selectedCompany.value
    ? siteStore.sites.filter((s) => s.companyId === selectedCompany.value)
    : siteStore.sites
  return [
    { label: t('feelback.allSites'), value: '' },
    ...sites.map((s) => ({ label: s.name, value: s.id })),
  ]
})

function buildParams() {
  const params: Record<string, unknown> = {}
  if (selectedCompany.value) params.companyId = selectedCompany.value
  if (selectedSite.value) params.siteId = selectedSite.value

  if (selectedPeriod.value === 'today') {
    params.startDate = dayjs().format('YYYY-MM-DD')
    params.endDate = dayjs().format('YYYY-MM-DD')
  } else if (selectedPeriod.value === 'week') {
    params.startDate = dayjs().startOf('week').format('YYYY-MM-DD')
    params.endDate = dayjs().format('YYYY-MM-DD')
  } else if (selectedPeriod.value === 'month') {
    params.startDate = dayjs().startOf('month').format('YYYY-MM-DD')
    params.endDate = dayjs().format('YYYY-MM-DD')
  } else if (selectedPeriod.value === 'custom' && customStart.value && customEnd.value) {
    params.startDate = customStart.value
    params.endDate = customEnd.value
  }
  return params
}

async function applyFilters() {
  await Promise.all([
    store.fetchStats(buildParams()),
    store.fetchComparison(buildParams()),
  ])
}

watch([selectedPeriod, selectedCompany, selectedSite], () => {
  if (selectedPeriod.value !== 'custom') applyFilters()
})

watch([customStart, customEnd], () => {
  if (selectedPeriod.value === 'custom' && customStart.value && customEnd.value) applyFilters()
})

watch(selectedCompany, () => {
  selectedSite.value = ''
})

const stats = computed(() => store.stats)

const pieData = computed(() => {
  if (!stats.value) return []
  return [
    { name: t('feelback.good'), value: stats.value.bon },
    { name: t('feelback.neutral'), value: stats.value.neutre },
    { name: t('feelback.bad'), value: stats.value.mauvais },
  ]
})

const siteBarData = computed(() =>
  store.comparison
    .filter((s) => s.totalResponses > 0)
    .sort((a, b) => b.satisfactionRate - a.satisfactionRate)
    .map((s) => ({ name: s.siteName ?? '', value: s.satisfactionRate }))
)

const lineData = computed(() => {
  if (!stats.value) return []
  return [
    { name: t('feelback.good'), value: stats.value.bon },
    { name: t('feelback.neutral'), value: stats.value.neutre },
    { name: t('feelback.bad'), value: stats.value.mauvais },
  ]
})

const hasLineData = computed(() => lineData.value.some((d) => d.value > 0))
const hasSiteData = computed(() => siteBarData.value.length > 0)

onMounted(async () => {
  await Promise.all([
    store.fetchStats(buildParams()),
    store.fetchComparison(buildParams()),
    companyStore.fetchCompanies(),
    siteStore.fetchSites({ perPage: 200 }),
  ])
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('feelback.analyticsTitle') }}</h1>
      <div class="flex flex-wrap gap-3">
        <AppSelect v-model="selectedPeriod" :options="periodOptions" class="w-40" />
        <AppSelect v-model="selectedCompany" :options="companyOptions" class="w-48" />
        <AppSelect v-model="selectedSite" :options="siteOptions" class="w-48" />
        <template v-if="selectedPeriod === 'custom'">
          <AppInput v-model="customStart" type="date" />
          <AppInput v-model="customEnd" type="date" />
        </template>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard :title="t('feelback.totalResponses')" :value="stats?.totalResponses ?? 0" />
      <StatCard :title="t('feelback.good')" :value="stats?.bon ?? 0" />
      <StatCard :title="t('feelback.neutral')" :value="stats?.neutre ?? 0" />
      <StatCard :title="t('feelback.bad')" :value="stats?.mauvais ?? 0" />
      <StatCard :title="t('feelback.satisfactionRate')" :value="`${stats?.satisfactionRate ?? 0}%`" />
      <StatCard :title="t('feelback.vsLastPeriod')" value="+3.2%" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AppCard :title="t('feelback.globalDistrib')">
        <PieChart :data="pieData" :title="t('feelback.goodNeutralBad')" />
      </AppCard>
      <AppCard v-if="hasSiteData" :title="t('feelback.bySite')">
        <BarChart :data="siteBarData" :title="t('feelback.satisfactionBySite')" />
      </AppCard>
    </div>

    <AppCard v-if="hasLineData" :title="t('feelback.byLevel')">
      <LineChart :data="lineData" :title="t('feelback.goodNeutralBad')" />
    </AppCard>

    <AppCard :title="t('feelback.distribution')">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
        <div class="text-center">
          <p class="text-2xl font-bold text-gray-900">{{ stats?.totalResponses ?? 0 }}</p>
          <p class="text-xs text-gray-500 mt-0.5">{{ t('feelback.totalResponses') }}</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-green-600">{{ stats?.bon ?? 0 }}</p>
          <p class="text-xs text-gray-500 mt-0.5">{{ t('feelback.good') }}</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-amber-500">{{ stats?.neutre ?? 0 }}</p>
          <p class="text-xs text-gray-500 mt-0.5">{{ t('feelback.neutral') }}</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-red-600">{{ stats?.mauvais ?? 0 }}</p>
          <p class="text-xs text-gray-500 mt-0.5">{{ t('feelback.bad') }}</p>
        </div>
      </div>
    </AppCard>
  </div>
</template>
