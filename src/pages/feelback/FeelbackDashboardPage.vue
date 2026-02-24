<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFeelbackStore } from '@/stores/feelback.store'
import { useCompanyStore } from '@/stores/company.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import StatCard from '@/components/data-display/StatCard.vue'
import GaugeChart from '@/components/charts/GaugeChart.vue'
import PieChart from '@/components/charts/PieChart.vue'
import LineChart from '@/components/charts/LineChart.vue'

const store = useFeelbackStore()
const companyStore = useCompanyStore()
const toast = useToast()

const selectedPeriod = ref('week')
const selectedCompany = ref('')

const periodOptions = [
  { label: 'Aujourd\'hui', value: 'today' },
  { label: 'Cette semaine', value: 'week' },
  { label: 'Ce mois', value: 'month' },
]

const companyOptions = computed(() => [
  { label: 'Toutes les entreprises', value: '' },
  ...companyStore.companies.map((c) => ({ label: c.name, value: c.id })),
])

const stats = computed(() => store.stats)
const unreadAlerts = computed(() => store.alerts.filter((a) => !a.isRead))

const pieData = computed(() => {
  if (!stats.value) return []
  return [
    { name: 'Bon', value: stats.value.bon },
    { name: 'Neutre', value: stats.value.neutre },
    { name: 'Mauvais', value: stats.value.mauvais },
  ]
})

const lineXData = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const lineSeries = computed(() => [
  { name: 'Bon', data: [45, 52, 48, 61, 58, 42, 39] },
  { name: 'Neutre', data: [20, 18, 22, 19, 24, 18, 21] },
  { name: 'Mauvais', data: [12, 8, 15, 10, 11, 9, 14] },
])
const lineData = computed(() => lineXData.map((name, i) => ({ name, value: (lineSeries.value[0]?.data[i] ?? 0) })))

const topSites = [
  { name: 'Siege Social', responses: 234, bon: 78, neutre: 15, mauvais: 7 },
  { name: 'Agence Nord', responses: 187, bon: 72, neutre: 18, mauvais: 10 },
  { name: 'Agence Est', responses: 156, bon: 65, neutre: 22, mauvais: 13 },
  { name: 'Agence Sud', responses: 143, bon: 61, neutre: 25, mauvais: 14 },
  { name: 'Agence Ouest', responses: 128, bon: 55, neutre: 28, mauvais: 17 },
]

function getAlertTypeLabel(type: string) {
  switch (type) {
    case 'threshold_exceeded': return 'Seuil depasse'
    case 'device_offline': return 'Terminal hors ligne'
    case 'low_battery': return 'Batterie faible'
    default: return type
  }
}

function getAlertVariant(type: string) {
  switch (type) {
    case 'threshold_exceeded': return 'danger'
    case 'device_offline': return 'warning'
    case 'low_battery': return 'warning'
    default: return 'neutral'
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleString('fr-FR')
}

onMounted(async () => {
  await Promise.all([
    store.fetchStats(),
    store.fetchAlerts(),
    companyStore.fetchCompanies(),
  ])
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Tableau de bord Feelback</h1>
        <p class="text-sm text-gray-500 mt-1">Suivi de la satisfaction client en temps reel</p>
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
      <StatCard title="Total reponses" :value="stats?.totalResponses ?? 0" />
      <StatCard title="Bon" :value="`${stats?.bon ?? 0} (${stats ? Math.round(stats.bon / stats.totalResponses * 100) : 0}%)`" />
      <StatCard title="Neutre" :value="`${stats?.neutre ?? 0} (${stats ? Math.round(stats.neutre / stats.totalResponses * 100) : 0}%)`" />
      <StatCard title="Mauvais" :value="`${stats?.mauvais ?? 0} (${stats ? Math.round(stats.mauvais / stats.totalResponses * 100) : 0}%)`" />
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AppCard title="Taux de satisfaction global">
        <GaugeChart :value="stats?.satisfactionRate ?? 0" title="Satisfaction" />
      </AppCard>
      <AppCard title="Repartition des votes">
        <PieChart :data="pieData" title="Distribution" />
      </AppCard>
    </div>

    <!-- Trends -->
    <AppCard title="Evolution hebdomadaire">
      <LineChart :data="lineData" title="Tendances" />
    </AppCard>

    <!-- Top sites -->
    <AppCard title="Top 5 sites par satisfaction">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reponses</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bon %</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Neutre %</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mauvais %</th>
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
    <AppCard v-if="unreadAlerts.length > 0" title="Alertes en cours">
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
