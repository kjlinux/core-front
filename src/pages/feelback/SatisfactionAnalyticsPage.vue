<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFeelbackStore } from '@/stores/feelback.store'
import { useCompanyStore } from '@/stores/company.store'
import AppCard from '@/components/ui/AppCard.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppInput from '@/components/ui/AppInput.vue'
import StatCard from '@/components/data-display/StatCard.vue'
import PieChart from '@/components/charts/PieChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import LineChart from '@/components/charts/LineChart.vue'

const store = useFeelbackStore()
const companyStore = useCompanyStore()

const selectedPeriod = ref('month')
const selectedCompany = ref('')
const selectedSite = ref('')
const customStart = ref('')
const customEnd = ref('')

const periodOptions = [
  { label: 'Aujourd\'hui', value: 'today' },
  { label: 'Cette semaine', value: 'week' },
  { label: 'Ce mois', value: 'month' },
  { label: 'Personnalise', value: 'custom' },
]

const companyOptions = computed(() => [
  { label: 'Toutes les entreprises', value: '' },
  ...companyStore.companies.map((c) => ({ label: c.name, value: c.id })),
])

const stats = computed(() => store.stats)

const pieData = computed(() => {
  if (!stats.value) return []
  return [
    { name: 'Bon', value: stats.value.bon },
    { name: 'Neutre', value: stats.value.neutre },
    { name: 'Mauvais', value: stats.value.mauvais },
  ]
})

const siteBarXData = ['Siege', 'Nord', 'Est', 'Sud', 'Ouest', 'Centre']
const siteBarSeries = [
  { name: 'Bon', data: [45, 38, 52, 41, 35, 48] as number[], color: '#22c55e' },
  { name: 'Neutre', data: [20, 25, 18, 22, 28, 19], color: '#f59e0b' },
  { name: 'Mauvais', data: [12, 18, 10, 15, 20, 11], color: '#ef4444' },
]

const lineXData = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec']
const lineSeries = [
  { name: 'Bon', data: [60, 62, 65, 68, 70, 72, 71, 73, 75, 74, 72, 76] },
  { name: 'Neutre', data: [25, 24, 22, 21, 20, 19, 18, 18, 17, 18, 19, 17] },
  { name: 'Mauvais', data: [15, 14, 13, 11, 10, 9, 11, 9, 8, 8, 9, 7] },
]

const hourlyXData = Array.from({ length: 11 }, (_, i) => `${8 + i}h`)
const hourlyBarSeries = [
  { name: 'Reponses', data: [12, 28, 45, 52, 61, 48, 55, 63, 42, 35, 18] },
]

const siteBarData = computed(() => siteBarXData.map((name, i) => ({ name, value: siteBarSeries[0]?.data[i] ?? 0 })))
const lineData = computed(() => lineXData.map((name, i) => ({ name, value: lineSeries[0]?.data[i] ?? 0 })))
const hourlyBarData = computed(() => hourlyXData.map((name, i) => ({ name, value: hourlyBarSeries[0]?.data[i] ?? 0 })))

const siteResults = [
  { name: 'Siege Social', total: 234, bon: 78, neutre: 15, mauvais: 7, rate: 78 },
  { name: 'Agence Nord', total: 187, bon: 72, neutre: 18, mauvais: 10, rate: 72 },
  { name: 'Agence Est', total: 156, bon: 65, neutre: 22, mauvais: 13, rate: 65 },
  { name: 'Agence Sud', total: 143, bon: 61, neutre: 25, mauvais: 14, rate: 61 },
  { name: 'Agence Ouest', total: 128, bon: 55, neutre: 28, mauvais: 17, rate: 55 },
]

onMounted(async () => {
  await Promise.all([store.fetchStats(), companyStore.fetchCompanies()])
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h1 class="text-2xl font-bold text-gray-900">Analyse de satisfaction</h1>
      <div class="flex flex-wrap gap-3">
        <AppSelect v-model="selectedPeriod" :options="periodOptions" class="w-40" />
        <AppSelect v-model="selectedCompany" :options="companyOptions" class="w-48" />
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
      <AppCard title="Par site">
        <BarChart :data="siteBarData" title="Reponses par site" />
      </AppCard>
    </div>

    <AppCard title="Evolution dans le temps">
      <LineChart :data="lineData" title="Tendances mensuelles" />
    </AppCard>

    <AppCard title="Distribution horaire">
      <BarChart :data="hourlyBarData" title="Reponses par heure" />
    </AppCard>

    <AppCard title="Resultats par site">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bon %</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Neutre %</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mauvais %</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Satisfaction</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="site in siteResults" :key="site.name" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ site.name }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ site.total }}</td>
              <td class="px-4 py-3 text-sm text-green-600 font-medium">{{ site.bon }}%</td>
              <td class="px-4 py-3 text-sm text-amber-600">{{ site.neutre }}%</td>
              <td class="px-4 py-3 text-sm text-red-600">{{ site.mauvais }}%</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <div class="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      class="h-2 rounded-full"
                      :class="site.rate >= 70 ? 'bg-green-500' : site.rate >= 50 ? 'bg-amber-500' : 'bg-red-500'"
                      :style="{ width: `${site.rate}%` }"
                    ></div>
                  </div>
                  <span class="text-sm font-medium">{{ site.rate }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>
  </div>
</template>
