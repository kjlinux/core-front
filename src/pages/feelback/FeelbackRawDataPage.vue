<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFeelbackStore } from '@/stores/feelback.store'
import { useSiteStore } from '@/stores/site.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'

const { t } = useI18n()
const store = useFeelbackStore()
const siteStore = useSiteStore()
const toast = useToast()

const filterStartDate = ref('')
const filterEndDate = ref('')
const filterLevel = ref('')
const filterSite = ref('')
const lastUpdated = ref(new Date().toLocaleTimeString('fr-FR'))
let refreshInterval: ReturnType<typeof setInterval>

const levelOptions = computed(() => [
  { label: t('feelback.allLevels'), value: '' },
  { label: t('feelback.good'), value: 'bon' },
  { label: t('feelback.neutral'), value: 'neutre' },
  { label: t('feelback.bad'), value: 'mauvais' },
])

const siteOptions = computed(() => [
  { label: t('feelback.allSites'), value: '' },
  ...siteStore.sites.map((s) => ({ label: s.name, value: s.id })),
])

function buildParams() {
  const params: Record<string, unknown> = {}
  if (filterLevel.value) params.level = filterLevel.value
  if (filterSite.value) params.siteId = filterSite.value
  if (filterStartDate.value) params.startDate = filterStartDate.value
  if (filterEndDate.value) params.endDate = filterEndDate.value
  return params
}

const entries = computed(() => store.entries)

function getLevelVariant(level: string) {
  switch (level) {
    case 'bon': return 'success'
    case 'neutre': return 'warning'
    case 'mauvais': return 'danger'
    default: return 'neutral'
  }
}

function getLevelLabel(level: string) {
  switch (level) {
    case 'bon': return t('feelback.good')
    case 'neutre': return t('feelback.neutral')
    case 'mauvais': return t('feelback.bad')
    default: return level
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleString('fr-FR')
}

async function refresh() {
  await store.fetchEntries(buildParams())
  lastUpdated.value = new Date().toLocaleTimeString('fr-FR')
}

watch([filterLevel, filterSite, filterStartDate, filterEndDate], () => {
  refresh()
})

function exportData() {
  toast.showSuccess(t('feelback.exportCsvLoading'))
}

onMounted(async () => {
  await Promise.all([refresh(), siteStore.fetchSites({ perPage: 200 })])
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
        <h1 class="text-2xl font-bold text-gray-900">{{ t('feelback.rawDataTitle') }}</h1>
        <p class="text-xs text-gray-400 mt-1">{{ t('feelback.lastUpdate') }} {{ lastUpdated }}</p>
      </div>
      <AppButton variant="secondary" @click="exportData">{{ t('feelback.exportCsv') }}</AppButton>
    </div>

    <AppCard>
      <div class="flex flex-wrap gap-4 mb-6">
        <AppInput v-model="filterStartDate" type="date" />
        <AppInput v-model="filterEndDate" type="date" />
        <AppSelect v-model="filterLevel" :options="levelOptions" class="w-40" />
        <AppSelect v-model="filterSite" :options="siteOptions" class="w-48" />
      </div>

      <p class="text-sm text-gray-500 mb-4">{{ store.entries.length }} {{ t('feelback.resultsCount') }}</p>

      <div v-if="store.isLoading" class="flex justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>

      <div v-else-if="entries.length === 0" class="text-center py-12 text-gray-500">
        {{ t('feelback.noData') }}
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('feelback.dateTime') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('feelback.site') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('feelback.avis') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('feelback.terminal') }}</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-100">
            <tr v-for="entry in entries" :key="entry.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{{ formatDate(entry.timestamp) }}</td>
              <td class="px-4 py-3 text-sm text-gray-900">{{ entry.siteName }}</td>
              <td class="px-4 py-3">
                <AppBadge :variant="getLevelVariant(entry.level) as any">
                  {{ getLevelLabel(entry.level) }}
                </AppBadge>
              </td>
              <td class="px-4 py-3 text-sm font-mono text-gray-500">{{ entry.deviceSerialNumber ?? '-' }}</td>
            </tr>
          </tbody>
        </table>

      </div>
    </AppCard>
  </div>
</template>
