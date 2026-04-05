<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { technicienActivityApi, type TechnicienActivity, type TechnicienSummaryEntry } from '@/services/api/technicien-activity.api'
import { userApi, type UserData } from '@/services/api/user.api'
import { useCompanyStore } from '@/stores/company.store'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppBadge from '@/components/ui/AppBadge.vue'

const companyStore = useCompanyStore()

const techniciens = ref<UserData[]>([])
const selectedCompanyId = ref<string>('')
const selectedTechnicienId = ref<string>('')
const selectedView = ref<'activities' | 'summary'>('summary')

const activities = ref<TechnicienActivity[]>([])
const summary = ref<TechnicienSummaryEntry[]>([])
const isLoading = ref(false)
const totalActivities = ref(0)
const currentPage = ref(1)

const companyOptions = computed(() =>
  companyStore.companies.map((c) => ({ label: c.name, value: c.id })),
)

const technicienOptions = computed(() => [
  { label: 'Tous les techniciens', value: '' },
  ...techniciens.value.map((t) => ({ label: `${t.firstName} ${t.lastName}`, value: t.id })),
])

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

const actionVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  create: 'success',
  update: 'info',
  delete: 'danger',
  assign: 'success',
  enroll: 'success',
  activate: 'success',
  deactivate: 'warning',
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

async function loadSummary() {
  if (!selectedCompanyId.value) return
  isLoading.value = true
  try {
    summary.value = await technicienActivityApi.getSummaryByCompany(selectedCompanyId.value)
  } finally {
    isLoading.value = false
  }
}

async function loadActivities() {
  isLoading.value = true
  try {
    const params: Record<string, unknown> = {
      per_page: 30,
      page: currentPage.value,
    }
    if (selectedCompanyId.value) params.company_id = selectedCompanyId.value
    if (selectedTechnicienId.value) params.technicien_id = selectedTechnicienId.value

    const res = await technicienActivityApi.getActivities(params)
    activities.value = res.data
    totalActivities.value = res.meta?.total ?? 0
  } finally {
    isLoading.value = false
  }
}

async function load() {
  if (selectedView.value === 'summary') {
    await loadSummary()
  } else {
    await loadActivities()
  }
}

watch(selectedCompanyId, () => {
  currentPage.value = 1
  load()
})

watch(selectedTechnicienId, () => {
  currentPage.value = 1
  if (selectedView.value === 'activities') loadActivities()
})

watch(selectedView, () => {
  currentPage.value = 1
  load()
})

onMounted(async () => {
  const [, techs] = await Promise.all([
    companyStore.fetchCompanies({ perPage: 200 }),
    userApi.getAll({ role: 'technicien', perPage: 200 }),
  ])
  techniciens.value = techs
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Activites des techniciens</h1>
        <p class="mt-1 text-sm text-gray-500">
          Suivi de toutes les actions effectuees par les techniciens sur chaque entreprise
        </p>
      </div>
    </div>

    <!-- Filtres -->
    <AppCard>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-55 flex-1">
          <label class="mb-1 block text-sm font-medium text-gray-700">Entreprise</label>
          <AppSelect
            v-model="selectedCompanyId"
            :options="[{ label: 'Toutes les entreprises', value: '' }, ...companyOptions]"
            placeholder="Selectionner une entreprise"
          />
        </div>
        <div class="min-w-55 flex-1">
          <label class="mb-1 block text-sm font-medium text-gray-700">Technicien</label>
          <AppSelect
            v-model="selectedTechnicienId"
            :options="technicienOptions"
            placeholder="Tous les techniciens"
          />
        </div>
        <div class="flex gap-2">
          <AppButton
            :variant="selectedView === 'summary' ? 'primary' : 'ghost'"
            size="sm"
            @click="selectedView = 'summary'"
          >
            Synthese
          </AppButton>
          <AppButton
            :variant="selectedView === 'activities' ? 'primary' : 'ghost'"
            size="sm"
            @click="selectedView = 'activities'"
          >
            Detail
          </AppButton>
        </div>
        <AppButton variant="ghost" size="sm" :disabled="isLoading" @click="load">
          Actualiser
        </AppButton>
      </div>
    </AppCard>

    <div v-if="isLoading" class="flex items-center justify-center py-16 text-gray-400">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-500" />
    </div>

    <!-- Vue synthese par technicien -->
    <template v-else-if="selectedView === 'summary'">
      <div v-if="!selectedCompanyId" class="rounded-lg border border-dashed border-gray-300 p-12 text-center text-gray-400">
        Selectionnez une entreprise pour voir la synthese des activites techniciens
      </div>

      <div v-else-if="summary.length === 0" class="rounded-lg border border-dashed border-gray-300 p-12 text-center text-gray-400">
        Aucune activite technicien enregistree pour cette entreprise
      </div>

      <div v-else class="space-y-4">
        <AppCard
          v-for="entry in summary"
          :key="entry.technicien.id"
        >
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-semibold text-gray-900">{{ entry.technicien.fullName }}</h3>
              <p class="text-sm text-gray-500">{{ entry.technicien.email }}</p>
            </div>
            <div class="text-right">
              <p class="text-2xl font-bold text-gray-900">{{ entry.totalActions }}</p>
              <p class="text-xs text-gray-400">actions au total</p>
            </div>
          </div>

          <p class="mt-1 text-xs text-gray-400">
            Derniere activite : {{ formatDate(entry.lastActivity) }}
          </p>

          <div v-if="entry.breakdown.length > 0" class="mt-4">
            <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Repartition</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="b in entry.breakdown"
                :key="b.resourceType + b.action"
                class="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
              >
                {{ actionLabel[b.action] ?? b.action }} {{ resourceTypeLabel[b.resourceType] ?? b.resourceType }} ({{ b.count }})
              </span>
            </div>
          </div>
        </AppCard>
      </div>
    </template>

    <!-- Vue detail des activites -->
    <template v-else>
      <AppCard v-if="activities.length === 0 && !isLoading">
        <p class="py-8 text-center text-gray-400">Aucune activite trouvee</p>
      </AppCard>

      <AppCard v-else class="overflow-hidden p-0">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <tr>
              <th class="px-4 py-3 text-left">Date</th>
              <th class="px-4 py-3 text-left">Technicien</th>
              <th class="px-4 py-3 text-left">Entreprise</th>
              <th class="px-4 py-3 text-left">Action</th>
              <th class="px-4 py-3 text-left">Ressource</th>
              <th class="px-4 py-3 text-left">Detail</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="activity in activities"
              :key="activity.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="whitespace-nowrap px-4 py-3 text-gray-500 text-xs">
                {{ formatDate(activity.createdAt) }}
              </td>
              <td class="px-4 py-3">
                <p class="font-medium text-gray-900">{{ activity.technicien?.fullName ?? '-' }}</p>
                <p class="text-xs text-gray-400">{{ activity.technicien?.email }}</p>
              </td>
              <td class="px-4 py-3 text-gray-700">
                {{ activity.company?.name ?? '-' }}
              </td>
              <td class="px-4 py-3">
                <AppBadge :variant="actionVariant[activity.action] ?? 'default'" size="sm">
                  {{ actionLabel[activity.action] ?? activity.action }}
                </AppBadge>
              </td>
              <td class="px-4 py-3 text-gray-700">
                {{ resourceTypeLabel[activity.resourceType] ?? activity.resourceType }}
              </td>
              <td class="px-4 py-3 text-gray-500 text-xs">
                {{ activity.resourceLabel ?? '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </AppCard>

      <!-- Pagination simple -->
      <div v-if="totalActivities > 30" class="flex items-center justify-between text-sm text-gray-500">
        <span>{{ totalActivities }} activites au total</span>
        <div class="flex gap-2">
          <AppButton
            variant="ghost"
            size="sm"
            :disabled="currentPage <= 1"
            @click="currentPage--; loadActivities()"
          >
            Precedent
          </AppButton>
          <span class="flex items-center px-2">Page {{ currentPage }}</span>
          <AppButton
            variant="ghost"
            size="sm"
            :disabled="currentPage * 30 >= totalActivities"
            @click="currentPage++; loadActivities()"
          >
            Suivant
          </AppButton>
        </div>
      </div>
    </template>
  </div>
</template>
