<script setup lang="ts">
import { ref, computed } from 'vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppInput from '@/components/ui/AppInput.vue'
import BarChart from '@/components/charts/BarChart.vue'

const startDate = ref('')
const endDate = ref('')

const allSites = [
  { id: '1', name: 'Siege Social', bon: 78, neutre: 15, mauvais: 7, total: 234, rate: 78 },
  { id: '2', name: 'Agence Nord', bon: 72, neutre: 18, mauvais: 10, total: 187, rate: 72 },
  { id: '3', name: 'Agence Est', bon: 65, neutre: 22, mauvais: 13, total: 156, rate: 65 },
  { id: '4', name: 'Agence Sud', bon: 61, neutre: 25, mauvais: 14, total: 143, rate: 61 },
  { id: '5', name: 'Agence Ouest', bon: 55, neutre: 28, mauvais: 17, total: 128, rate: 55 },
  { id: '6', name: 'Agence Centre', bon: 48, neutre: 30, mauvais: 22, total: 98, rate: 48 },
]

const selectedSiteIds = ref<string[]>(['1', '2', '3'])

function toggleSite(id: string) {
  const idx = selectedSiteIds.value.indexOf(id)
  if (idx === -1) {
    if (selectedSiteIds.value.length < 5) {
      selectedSiteIds.value.push(id)
    }
  } else {
    selectedSiteIds.value.splice(idx, 1)
  }
}

const selectedSites = computed(() =>
  allSites.filter((s) => selectedSiteIds.value.includes(s.id)),
)

const barXData = computed(() => selectedSites.value.map((s) => s.name))
const barSeries = computed(() => [
  { name: 'Bon', data: selectedSites.value.map((s) => s.bon), color: '#22c55e' },
  { name: 'Neutre', data: selectedSites.value.map((s) => s.neutre), color: '#f59e0b' },
  { name: 'Mauvais', data: selectedSites.value.map((s) => s.mauvais), color: '#ef4444' },
])
const barData = computed(() => selectedSites.value.map((s) => ({ name: s.name, value: s.bon })))

const sortedSites = computed(() =>
  [...selectedSites.value].sort((a, b) => b.rate - a.rate),
)

const bestSite = computed(() => sortedSites.value[0])
const worstSite = computed(() => sortedSites.value[sortedSites.value.length - 1])
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Comparaison par site</h1>
      <div class="flex gap-3">
        <AppInput v-model="startDate" type="date" placeholder="Date debut" />
        <AppInput v-model="endDate" type="date" placeholder="Date fin" />
      </div>
    </div>

    <AppCard title="Selectionner les sites a comparer (max 5)">
      <div class="flex flex-wrap gap-3">
        <button
          v-for="site in allSites"
          :key="site.id"
          class="px-4 py-2 rounded-lg border text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
          :class="selectedSiteIds.includes(site.id)
            ? 'border-primary-600 bg-primary-600 text-white'
            : 'border-gray-300 text-gray-600 bg-white hover:border-primary-600'"
          :disabled="!selectedSiteIds.includes(site.id) && selectedSiteIds.length >= 5"
          @click="toggleSite(site.id)"
        >
          {{ site.name }}
        </button>
      </div>
      <p class="text-xs text-gray-400 mt-3">{{ selectedSiteIds.length }}/5 site(s) selectionne(s)</p>
    </AppCard>

    <AppCard v-if="selectedSites.length > 0" title="Comparaison graphique">
      <BarChart :data="barData" title="Bon / Neutre / Mauvais par site" />
    </AppCard>

    <AppCard v-if="sortedSites.length > 0" title="Classement des sites selectionnes">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rang</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bon %</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Neutre %</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mauvais %</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Satisfaction</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="(site, index) in sortedSites" :key="site.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-bold text-gray-700">{{ index + 1 }}</td>
              <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ site.name }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ site.total }}</td>
              <td class="px-4 py-3 text-sm text-green-600 font-medium">{{ site.bon }}%</td>
              <td class="px-4 py-3 text-sm text-amber-600">{{ site.neutre }}%</td>
              <td class="px-4 py-3 text-sm text-red-600">{{ site.mauvais }}%</td>
              <td class="px-4 py-3 text-sm font-semibold">{{ site.rate }}%</td>
              <td class="px-4 py-3">
                <AppBadge v-if="site.id === bestSite?.id" variant="success">Meilleur</AppBadge>
                <AppBadge v-else-if="site.id === worstSite?.id && sortedSites.length > 1" variant="warning">A ameliorer</AppBadge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>
  </div>
</template>
