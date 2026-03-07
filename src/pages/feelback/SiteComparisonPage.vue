<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useFeelbackStore } from '@/stores/feelback.store'
import { useCompanyStore } from '@/stores/company.store'
import { usePermissions } from '@/composables/usePermissions'
import type { SatisfactionStats } from '@/types'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import BarChart from '@/components/charts/BarChart.vue'

const store = useFeelbackStore()
const companyStore = useCompanyStore()
const permissions = usePermissions()

const startDate = ref('')
const endDate = ref('')
const selectedCompany = ref('')
const selectedSiteIds = ref<string[]>([])

const isSuperAdmin = computed(() => permissions.isSuperAdmin.value)

const companyOptions = computed(() => [
  { label: 'Toutes les entreprises', value: '' },
  ...companyStore.companies.map((c) => ({ label: c.name, value: c.id })),
])

function buildParams() {
  const params: Record<string, unknown> = {}
  if (selectedCompany.value) params.companyId = selectedCompany.value
  if (startDate.value) params.startDate = startDate.value
  if (endDate.value) params.endDate = endDate.value
  return params
}

async function load() {
  await store.fetchComparison(buildParams())
  // Sélectionner tous les sites par défaut au premier chargement
  if (selectedSiteIds.value.length === 0) {
    selectedSiteIds.value = store.comparison.map((s) => s.siteId ?? '').filter(Boolean).slice(0, 5)
  }
}

watch([selectedCompany, startDate, endDate], () => {
  selectedSiteIds.value = []
  load()
})

watch(selectedCompany, () => {
  selectedSiteIds.value = []
})

function toggleSite(id: string) {
  const idx = selectedSiteIds.value.indexOf(id)
  if (idx === -1) {
    if (selectedSiteIds.value.length < 5) selectedSiteIds.value.push(id)
  } else {
    selectedSiteIds.value.splice(idx, 1)
  }
}

const allSites = computed(() => store.comparison)

const selectedSites = computed(() =>
  allSites.value.filter((s) => selectedSiteIds.value.includes(s.siteId ?? ''))
)

const barData = computed(() =>
  selectedSites.value.map((s) => ({ name: s.siteName ?? '', value: s.satisfactionRate }))
)

const sortedSites = computed(() =>
  [...selectedSites.value].sort((a, b) => b.satisfactionRate - a.satisfactionRate)
)

const bestSite = computed(() => sortedSites.value[0])
const worstSite = computed(() => sortedSites.value[sortedSites.value.length - 1])

function pct(val: number, total: number) {
  return total > 0 ? Math.round((val / total) * 100) : 0
}

onMounted(async () => {
  await Promise.all([
    load(),
    isSuperAdmin.value ? companyStore.fetchCompanies() : Promise.resolve(),
  ])
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h1 class="text-2xl font-bold text-gray-900">Comparaison par site</h1>
      <div class="flex flex-wrap gap-3">
        <AppSelect
          v-if="isSuperAdmin"
          v-model="selectedCompany"
          :options="companyOptions"
          class="w-48"
        />
        <AppInput v-model="startDate" type="date" placeholder="Date debut" />
        <AppInput v-model="endDate" type="date" placeholder="Date fin" />
      </div>
    </div>

    <div v-if="store.isLoading" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>

    <template v-else>
      <AppCard title="Selectionner les sites a comparer (max 5)">
        <div v-if="allSites.length === 0" class="text-sm text-gray-500">
          Aucun site avec des donnees pour cette periode.
        </div>
        <div v-else class="flex flex-wrap gap-3">
          <button
            v-for="site in allSites"
            :key="site.siteId"
            class="px-4 py-2 rounded-lg border text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
            :class="selectedSiteIds.includes(site.siteId ?? '')
              ? 'border-primary-600 bg-primary-600 text-white'
              : 'border-gray-300 text-gray-600 bg-white hover:border-primary-600'"
            :disabled="!selectedSiteIds.includes(site.siteId ?? '') && selectedSiteIds.length >= 5"
            @click="toggleSite(site.siteId ?? '')"
          >
            {{ site.siteName }}
            <span class="ml-1 text-xs opacity-75">({{ site.totalResponses }})</span>
          </button>
        </div>
        <p class="text-xs text-gray-400 mt-3">{{ selectedSiteIds.length }}/5 site(s) selectionne(s)</p>
      </AppCard>

      <AppCard v-if="selectedSites.length > 0" title="Taux de satisfaction par site">
        <BarChart :data="barData" title="Taux de satisfaction (%)" />
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
              <tr v-for="(site, index) in sortedSites" :key="site.siteId" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm font-bold text-gray-700">{{ index + 1 }}</td>
                <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ site.siteName }}</td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ site.totalResponses }}</td>
                <td class="px-4 py-3 text-sm text-green-600 font-medium">{{ pct(site.bon, site.totalResponses) }}%</td>
                <td class="px-4 py-3 text-sm text-amber-600">{{ pct(site.neutre, site.totalResponses) }}%</td>
                <td class="px-4 py-3 text-sm text-red-600">{{ pct(site.mauvais, site.totalResponses) }}%</td>
                <td class="px-4 py-3 text-sm font-semibold">{{ site.satisfactionRate }}%</td>
                <td class="px-4 py-3">
                  <AppBadge v-if="sortedSites.length > 1 && site.siteId === bestSite?.siteId" variant="success">Meilleur</AppBadge>
                  <AppBadge v-else-if="sortedSites.length > 1 && site.siteId === worstSite?.siteId" variant="warning">A ameliorer</AppBadge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>
    </template>
  </div>
</template>
