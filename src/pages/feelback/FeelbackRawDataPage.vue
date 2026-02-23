<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useFeelbackStore } from '@/stores/feelback.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'

const store = useFeelbackStore()
const toast = useToast()

const filterStartDate = ref('')
const filterEndDate = ref('')
const filterLevel = ref('')
const filterSite = ref('')
const currentPage = ref(1)
const perPage = 20
const lastUpdated = ref(new Date().toLocaleTimeString('fr-FR'))
let refreshInterval: ReturnType<typeof setInterval>

const levelOptions = [
  { label: 'Tous les niveaux', value: '' },
  { label: 'Bon', value: 'bon' },
  { label: 'Neutre', value: 'neutre' },
  { label: 'Mauvais', value: 'mauvais' },
]

const filteredEntries = computed(() => {
  let list = store.entries
  if (filterLevel.value) {
    list = list.filter((e) => e.level === filterLevel.value)
  }
  if (filterSite.value) {
    list = list.filter((e) => e.siteId === filterSite.value)
  }
  return list
})

const paginatedEntries = computed(() => {
  const start = (currentPage.value - 1) * perPage
  return filteredEntries.value.slice(start, start + perPage)
})

const totalPages = computed(() => Math.ceil(filteredEntries.value.length / perPage))

function getLevelVariant(level: string) {
  switch (level) {
    case 'bon': return 'success'
    case 'neutre': return 'warning'
    case 'mauvais': return 'danger'
    default: return 'default'
  }
}

function getLevelLabel(level: string) {
  switch (level) {
    case 'bon': return 'Bon'
    case 'neutre': return 'Neutre'
    case 'mauvais': return 'Mauvais'
    default: return level
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleString('fr-FR')
}

async function refresh() {
  await store.fetchEntries()
  lastUpdated.value = new Date().toLocaleTimeString('fr-FR')
}

function exportData() {
  toast.showSuccess('Export CSV en cours...')
}

onMounted(async () => {
  await refresh()
  refreshInterval = setInterval(refresh, 30000)
})

onUnmounted(() => {
  clearInterval(refreshInterval)
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Donnees brutes Feelback</h1>
        <p class="text-xs text-gray-400 mt-1">Derniere mise a jour : {{ lastUpdated }}</p>
      </div>
      <AppButton variant="secondary" @click="exportData">Exporter CSV</AppButton>
    </div>

    <AppCard>
      <div class="flex flex-wrap gap-4 mb-6">
        <AppInput v-model="filterStartDate" type="date" placeholder="Date debut" />
        <AppInput v-model="filterEndDate" type="date" placeholder="Date fin" />
        <AppSelect v-model="filterLevel" :options="levelOptions" class="w-40" />
        <AppInput v-model="filterSite" placeholder="Filtrer par site..." />
      </div>

      <p class="text-sm text-gray-500 mb-4">{{ filteredEntries.length }} reponse(s) trouvee(s)</p>

      <div v-if="store.isLoading" class="flex justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>

      <div v-else-if="filteredEntries.length === 0" class="text-center py-12 text-gray-500">
        Aucune donnee disponible
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Heure</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avis</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Terminal</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-100">
            <tr v-for="entry in paginatedEntries" :key="entry.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{{ formatDate(entry.timestamp) }}</td>
              <td class="px-4 py-3 text-sm text-gray-900">{{ entry.siteName }}</td>
              <td class="px-4 py-3">
                <AppBadge :variant="getLevelVariant(entry.level) as any">
                  {{ getLevelLabel(entry.level) }}
                </AppBadge>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ entry.agentName ?? '-' }}</td>
              <td class="px-4 py-3 text-sm font-mono text-gray-500">{{ entry.deviceId }}</td>
            </tr>
          </tbody>
        </table>

        <div v-if="totalPages > 1" class="flex justify-center mt-6">
          <div class="flex gap-2">
            <AppButton size="sm" variant="ghost" :disabled="currentPage === 1" @click="currentPage--">
              Precedent
            </AppButton>
            <span class="px-3 py-1 text-sm text-gray-600">{{ currentPage }} / {{ totalPages }}</span>
            <AppButton size="sm" variant="ghost" :disabled="currentPage === totalPages" @click="currentPage++">
              Suivant
            </AppButton>
          </div>
        </div>
      </div>
    </AppCard>
  </div>
</template>
