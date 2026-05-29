<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { technicienActivityApi, type TechnicienActivity } from '@/services/api/technicien-activity.api'
import { userApi, type UserData } from '@/services/api/user.api'
import { useCompanyStore } from '@/stores/company.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppSearchInput from '@/components/ui/AppSearchInput.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import DataTable from '@/components/data-display/DataTable.vue'
import BarChart from '@/components/charts/BarChart.vue'
import HeatmapChart from '@/components/charts/HeatmapChart.vue'
import type { TableColumn } from '@/types/common'

const companyStore = useCompanyStore()
const toast = useToast()

const techniciens = ref<UserData[]>([])
const selectedCompanyId = ref<string>('')
const selectedTechnicienId = ref<string>('')
const selectedResourceType = ref<string>('')
const dateFrom = ref<string>('')
const dateTo = ref<string>('')
const search = ref<string>('')

const activities = ref<TechnicienActivity[]>([])
const isLoading = ref(false)
const totalActivities = ref(0)
const currentPage = ref(1)
const perPage = 50

const companyOptions = computed(() =>
  companyStore.companies.map((c) => ({ label: c.name, value: c.id })),
)

const technicienOptions = computed(() => [
  { label: 'Tous les techniciens', value: '' },
  ...techniciens.value.map((t) => ({ label: `${t.firstName} ${t.lastName}`, value: t.id })),
])

// Stats calculees depuis les activites chargees
const statsByTechnicien = computed(() => {
  const map = new Map<string, { name: string; email: string; count: number; lastAt: string }>()
  for (const a of activities.value) {
    if (!a.technicien) continue
    const existing = map.get(a.technicien.id)
    if (existing) {
      existing.count++
      if (a.createdAt > existing.lastAt) existing.lastAt = a.createdAt
    } else {
      map.set(a.technicien.id, {
        name: a.technicien.fullName,
        email: a.technicien.email,
        count: 1,
        lastAt: a.createdAt,
      })
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
})

const resourceTypeLabel: Record<string, string> = {
  site: 'Site',
  employee: 'Employe',
  card: 'Carte RFID',
  rfid_device: 'Terminal RFID',
  biometric_device: 'Terminal biometrique',
  biometric_enrollment: 'Enrolement biometrique',
  department: 'Departement',
}

const actionLabel: Record<string, string> = {
  create: 'Creation',
  update: 'Modification',
  delete: 'Suppression',
  assign: 'Assignation',
  enroll: 'Enrolement',
  activate: 'Activation',
  deactivate: 'Desactivation',
}

const actionVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  create: 'success',
  update: 'info',
  delete: 'danger',
  assign: 'success',
  enroll: 'success',
  activate: 'success',
  deactivate: 'warning',
}

const columns: TableColumn[] = [
  { key: 'createdAt', label: 'Date' },
  { key: 'technicien', label: 'Technicien' },
  { key: 'company', label: 'Entreprise' },
  { key: 'action', label: 'Action' },
  { key: 'resourceType', label: 'Ressource' },
  { key: 'resourceLabel', label: 'Element' },
]

const filteredActivities = computed(() => {
  const q = search.value.trim().toLowerCase()
  let list = activities.value
  if (q) {
    list = list.filter(
      (a) =>
        (a.technicien?.fullName ?? '').toLowerCase().includes(q) ||
        (a.technicien?.email ?? '').toLowerCase().includes(q) ||
        (a.company?.name ?? '').toLowerCase().includes(q) ||
        (a.resourceLabel ?? '').toLowerCase().includes(q) ||
        (resourceTypeLabel[a.resourceType] ?? a.resourceType).toLowerCase().includes(q),
    )
  }
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
})

const paginationObj = computed(() => ({
  currentPage: currentPage.value,
  perPage,
  total: totalActivities.value,
  totalPages: Math.max(1, Math.ceil(totalActivities.value / perPage)),
}))

function onPageChange(p: number) {
  currentPage.value = p
  loadActivities()
}

function formatDate(iso: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function loadActivities() {
  isLoading.value = true
  try {
    const params: Record<string, unknown> = {
      per_page: perPage,
      page: currentPage.value,
    }
    if (selectedCompanyId.value) params.company_id = selectedCompanyId.value
    if (selectedTechnicienId.value) params.technicien_id = selectedTechnicienId.value
    if (selectedResourceType.value) params.resource_type = selectedResourceType.value
    if (dateFrom.value) params.date_from = dateFrom.value
    if (dateTo.value) params.date_to = dateTo.value

    const res = await technicienActivityApi.getActivities(params)
    activities.value = res.data ?? []
    totalActivities.value = res.meta?.total ?? 0
  } catch (e) {
    toast.error('Impossible de charger les activités', String((e as Error).message))
  } finally {
    isLoading.value = false
  }
}

watch([selectedCompanyId, selectedTechnicienId, selectedResourceType, dateFrom, dateTo], () => {
  currentPage.value = 1
  loadActivities()
})

const resourceTypeOptions = computed(() => [
  { label: 'Toutes les ressources', value: '' },
  ...Object.entries(resourceTypeLabel).map(([value, label]) => ({ label, value })),
])

// Repartition des actions par jour (chart)
const activityByDay = computed(() => {
  const map = new Map<string, number>()
  for (const a of activities.value) {
    const day = a.createdAt.slice(0, 10)
    map.set(day, (map.get(day) ?? 0) + 1)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([d, v]) => ({ name: d.slice(5), value: v }))
})

// Heatmap : jour x heure du jour (24h)
const heatmap = computed(() => {
  const days = new Map<string, number>() // day key -> col index
  const counts = new Map<string, number>() // `${day}|${hour}` -> count
  for (const a of activities.value) {
    const d = a.createdAt.slice(0, 10)
    const h = new Date(a.createdAt).getHours()
    if (!days.has(d)) days.set(d, days.size)
    const k = `${d}|${h}`
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  const xAxis = [...days.keys()].sort().map((d) => d.slice(5))
  const xIndex = new Map(xAxis.map((d, i) => [d, i]))
  const yAxis = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}h`)
  const data: Array<[number, number, number]> = []
  for (const [k, v] of counts.entries()) {
    const [d, h] = k.split('|')
    const xi = xIndex.get(d.slice(5))
    if (xi == null) continue
    data.push([xi, Number(h), v])
  }
  return { xAxis, yAxis, data }
})

// Repartition par type d'action
const actionDistribution = computed(() => {
  const map = new Map<string, number>()
  for (const a of activities.value) {
    map.set(a.action, (map.get(a.action) ?? 0) + 1)
  }
  return [...map.entries()].map(([k, v]) => ({
    name: actionLabel[k] ?? k,
    value: v,
  })).sort((a, b) => b.value - a.value)
})

onMounted(async () => {
  try {
    const [, techs] = await Promise.all([
      companyStore.fetchCompanies({ perPage: 200 }),
      userApi.getAll({ role: 'technicien', perPage: 200 }),
    ])
    techniciens.value = techs
  } catch (e) {
    toast.error('Impossible de charger les filtres', String((e as Error).message))
  }
  await loadActivities()
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Activites des techniciens</h1>
      <p class="mt-1 text-sm text-gray-500">
        Historique de toutes les actions effectuees par les techniciens
      </p>
    </div>

    <!-- Filtres -->
    <AppCard>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-55 flex-1">
          <label class="mb-1 block text-sm font-medium text-gray-700">Entreprise</label>
          <AppSelect
            v-model="selectedCompanyId"
            :options="[{ label: 'Toutes les entreprises', value: '' }, ...companyOptions]"
          />
        </div>
        <div class="min-w-55 flex-1">
          <label class="mb-1 block text-sm font-medium text-gray-700">Technicien</label>
          <AppSelect
            v-model="selectedTechnicienId"
            :options="technicienOptions"
          />
        </div>
        <div class="min-w-55 flex-1">
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Type de ressource</label>
          <AppSelect v-model="selectedResourceType" :options="resourceTypeOptions" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Du</label>
          <input
            type="date"
            v-model="dateFrom"
            class="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:ring-2 focus:ring-primary-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Au</label>
          <input
            type="date"
            v-model="dateTo"
            class="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-700 focus:ring-2 focus:ring-primary-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
          />
        </div>
        <div class="min-w-55 flex-1">
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Recherche</label>
          <AppSearchInput v-model="search" placeholder="Rechercher (technicien, entreprise, element)..." />
        </div>
        <AppButton variant="ghost" size="sm" :disabled="isLoading" @click="loadActivities">
          Actualiser
        </AppButton>
      </div>
    </AppCard>

    <!-- Synthese visuelle : heatmap jour/heure + repartition actions -->
    <div v-if="activities.length > 0" class="grid gap-4 lg:grid-cols-3">
      <AppCard class="lg:col-span-2">
        <h3 class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Heatmap activite (jour x heure)</h3>
        <HeatmapChart
          v-if="heatmap.xAxis.length > 0"
          :x-axis="heatmap.xAxis"
          :y-axis="heatmap.yAxis"
          :data="heatmap.data"
          height="280px"
        />
        <BarChart
          v-else
          :data="activityByDay"
          series-name="Actions"
          height="220px"
        />
      </AppCard>
      <AppCard>
        <h3 class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Top actions</h3>
        <ul class="space-y-2">
          <li
            v-for="a in actionDistribution.slice(0, 6)"
            :key="a.name"
            class="flex items-center justify-between text-sm"
          >
            <span class="text-gray-600 dark:text-gray-300">{{ a.name }}</span>
            <span class="font-semibold text-gray-900 dark:text-gray-100">{{ a.value }}</span>
          </li>
        </ul>
      </AppCard>
    </div>

    <!-- Stats par technicien (quand des activites existent) -->
    <div v-if="statsByTechnicien.length > 0" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <AppCard
        v-for="stat in statsByTechnicien"
        :key="stat.email"
        class="flex items-center justify-between"
      >
        <div>
          <p class="font-medium text-gray-900">{{ stat.name }}</p>
          <p class="text-xs text-gray-400">{{ stat.email }}</p>
          <p class="mt-1 text-xs text-gray-500">Derniere action : {{ formatDate(stat.lastAt) }}</p>
        </div>
        <div class="text-right">
          <p class="text-2xl font-bold text-gray-900">{{ stat.count }}</p>
          <p class="text-xs text-gray-400">{{ stat.count > 1 ? 'actions' : 'action' }}</p>
        </div>
      </AppCard>
    </div>

    <!-- Tableau chronologique -->
    <AppCard padding="none">
      <DataTable
        :columns="columns"
        :data="filteredActivities"
        :loading="isLoading"
        :pagination="paginationObj"
        default-sort-column="createdAt"
        default-sort-direction="desc"
        empty-message="Aucune activite enregistree"
        @page-change="onPageChange"
      >
        <template #createdAt="{ row }">
          <span class="whitespace-nowrap text-xs text-gray-500">{{ formatDate(row.createdAt) }}</span>
        </template>
        <template #technicien="{ row }">
          <p class="font-medium text-gray-900">{{ row.technicien?.fullName ?? '-' }}</p>
          <p class="text-xs text-gray-400">{{ row.technicien?.email ?? '' }}</p>
        </template>
        <template #company="{ row }">{{ row.company?.name ?? '-' }}</template>
        <template #action="{ row }">
          <AppBadge :variant="actionVariant[row.action] ?? 'neutral'" size="sm">
            {{ actionLabel[row.action] ?? row.action }}
          </AppBadge>
        </template>
        <template #resourceType="{ row }">
          {{ resourceTypeLabel[row.resourceType] ?? row.resourceType }}
        </template>
        <template #resourceLabel="{ row }">
          <span class="text-xs text-gray-500">{{ row.resourceLabel ?? '-' }}</span>
        </template>
      </DataTable>
    </AppCard>
  </div>
</template>
