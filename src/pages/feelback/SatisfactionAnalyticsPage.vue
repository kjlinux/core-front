<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
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

const store = useFeelbackStore()
const companyStore = useCompanyStore()
const siteStore = useSiteStore()

const selectedPeriod = ref('month')
const selectedCompany = ref('')
const selectedSite = ref('')
const customStart = ref('')
const customEnd = ref('')

const periodOptions = [
  { label: "Aujourd'hui", value: 'today' },
  { label: 'Cette semaine', value: 'week' },
  { label: 'Ce mois', value: 'month' },
  { label: 'Personnalise', value: 'custom' },
]

const companyOptions = computed(() => [
  { label: 'Toutes les entreprises', value: '' },
  ...companyStore.companies.map((c) => ({ label: c.name, value: c.id })),
])

const siteOptions = computed(() => {
  const sites = selectedCompany.value
    ? siteStore.sites.filter((s) => s.companyId === selectedCompany.value)
    : siteStore.sites
  return [
    { label: 'Tous les sites', value: '' },
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
    { name: 'Bon', value: stats.value.bon },
    { name: 'Neutre', value: stats.value.neutre },
    { name: 'Mauvais', value: stats.value.mauvais },
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
    { name: 'Bon', value: stats.value.bon },
    { name: 'Neutre', value: stats.value.neutre },
    { name: 'Mauvais', value: stats.value.mauvais },
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
      <h1 class="text-2xl font-bold text-gray-900">Analyse de satisfaction</h1>
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
      <StatCard title="Total reponses" :value="stats?.totalResponses ?? 0" />
      <StatCard title="Bon" :value="stats?.bon ?? 0" />
      <StatCard title="Neutre" :value="stats?.neutre ?? 0" />
      <StatCard title="Mauvais" :value="stats?.mauvais ?? 0" />
      <StatCard title="Taux de satisfaction" :value="`${stats?.satisfactionRate ?? 0}%`" />
      <StatCard title="vs periode precedente" value="+3.2%" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AppCard title="Repartition globale">
        <PieChart :data="pieData" title="Bon / Neutre / Mauvais" />
      </AppCard>
      <AppCard v-if="hasSiteData" title="Par site">
        <BarChart :data="siteBarData" title="Taux de satisfaction par site (%)" />
      </AppCard>
    </div>

    <AppCard v-if="hasLineData" title="Repartition par niveau">
      <LineChart :data="lineData" title="Bon / Neutre / Mauvais" />
    </AppCard>

    <AppCard title="Repartition">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
        <div class="text-center">
          <p class="text-2xl font-bold text-gray-900">{{ stats?.totalResponses ?? 0 }}</p>
          <p class="text-xs text-gray-500 mt-0.5">Total reponses</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-green-600">{{ stats?.bon ?? 0 }}</p>
          <p class="text-xs text-gray-500 mt-0.5">Bon</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-amber-500">{{ stats?.neutre ?? 0 }}</p>
          <p class="text-xs text-gray-500 mt-0.5">Neutre</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-red-600">{{ stats?.mauvais ?? 0 }}</p>
          <p class="text-xs text-gray-500 mt-0.5">Mauvais</p>
        </div>
      </div>
    </AppCard>
  </div>
</template>
