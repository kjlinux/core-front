<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { technicienActivityApi, type TechnicienActivity } from '@/services/api/technicien-activity.api'
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

async function loadActivities() {
  isLoading.value = true
  try {
    const params: Record<string, unknown> = {
      per_page: perPage,
      page: currentPage.value,
    }
    if (selectedCompanyId.value) params.company_id = selectedCompanyId.value
    if (selectedTechnicienId.value) params.technicien_id = selectedTechnicienId.value

    const res = await technicienActivityApi.getActivities(params)
    activities.value = res.data ?? []
    totalActivities.value = res.meta?.total ?? 0
  } finally {
    isLoading.value = false
  }
}

watch([selectedCompanyId, selectedTechnicienId], () => {
  currentPage.value = 1
  loadActivities()
})

onMounted(async () => {
  const [, techs] = await Promise.all([
    companyStore.fetchCompanies({ perPage: 200 }),
    userApi.getAll({ role: 'technicien', perPage: 200 }),
  ])
  techniciens.value = techs
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
        <AppButton variant="ghost" size="sm" :disabled="isLoading" @click="loadActivities">
          Actualiser
        </AppButton>
      </div>
    </AppCard>

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
    <div v-if="isLoading" class="flex items-center justify-center py-16 text-gray-400">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-500" />
    </div>

    <template v-else>
      <div
        v-if="activities.length === 0"
        class="rounded-lg border border-dashed border-gray-300 p-16 text-center text-gray-400"
      >
        Aucune activite enregistree
        <span v-if="selectedCompanyId || selectedTechnicienId"> pour ces filtres</span>
      </div>

      <AppCard v-else class="overflow-hidden !p-0">
        <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <p class="text-sm font-medium text-gray-700">
            {{ totalActivities }} action{{ totalActivities > 1 ? 's' : '' }} au total
          </p>
        </div>
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <tr>
              <th class="px-4 py-3 text-left">Date</th>
              <th class="px-4 py-3 text-left">Technicien</th>
              <th class="px-4 py-3 text-left">Entreprise</th>
              <th class="px-4 py-3 text-left">Action</th>
              <th class="px-4 py-3 text-left">Ressource</th>
              <th class="px-4 py-3 text-left">Element</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="activity in activities"
              :key="activity.id"
              class="transition-colors hover:bg-gray-50"
            >
              <td class="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                {{ formatDate(activity.createdAt) }}
              </td>
              <td class="px-4 py-3">
                <p class="font-medium text-gray-900">{{ activity.technicien?.fullName ?? '-' }}</p>
                <p class="text-xs text-gray-400">{{ activity.technicien?.email ?? '' }}</p>
              </td>
              <td class="px-4 py-3 text-gray-700">
                {{ activity.company?.name ?? '-' }}
              </td>
              <td class="px-4 py-3">
                <AppBadge :variant="actionVariant[activity.action] ?? 'default'" size="sm">
                  {{ actionLabel[activity.action] ?? activity.action }}
                </AppBadge>
              </td>
              <td class="px-4 py-3 text-gray-600">
                {{ resourceTypeLabel[activity.resourceType] ?? activity.resourceType }}
              </td>
              <td class="px-4 py-3 text-xs text-gray-500">
                {{ activity.resourceLabel ?? '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </AppCard>

      <!-- Pagination -->
      <div v-if="totalActivities > perPage" class="flex items-center justify-between text-sm text-gray-500">
        <span>Page {{ currentPage }} / {{ Math.ceil(totalActivities / perPage) }}</span>
        <div class="flex gap-2">
          <AppButton
            variant="ghost"
            size="sm"
            :disabled="currentPage <= 1"
            @click="currentPage--; loadActivities()"
          >
            Precedent
          </AppButton>
          <AppButton
            variant="ghost"
            size="sm"
            :disabled="currentPage * perPage >= totalActivities"
            @click="currentPage++; loadActivities()"
          >
            Suivant
          </AppButton>
        </div>
      </div>
    </template>
  </div>
</template>
