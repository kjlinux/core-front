<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSupportStore } from '@/stores/support.store'
import { useServerTable } from '@/composables/useServerTable'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'
import { extractApiErrorMessage } from '@/utils/api-error'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import DataTable from '@/components/data-display/DataTable.vue'
import { PhoneIcon } from '@heroicons/vue/24/outline'
import type { TableColumn } from '@/types/common'
import type { SupportCompanyRow } from '@/services/api/support.api'

const store = useSupportStore()
const toast = useToast()
const { t } = useI18n()
const router = useRouter()

const { search, handlePageChange, reload } = useServerTable({
  initialFilters: {},
  fetcher: async (p) => {
    try {
      await store.fetchCompanies({ page: p.page, perPage: p.perPage, search: p.search || undefined })
    } catch (e) {
      toast.error(t('toast.support.loadError'), extractApiErrorMessage(e, t('common.genericError')))
    }
  },
})

const columns: TableColumn[] = [
  { key: 'name', label: 'Compagnie', sortable: false },
  { key: 'devices', label: 'Capteurs', sortable: false },
  { key: 'offline', label: 'Hors ligne', sortable: false },
  { key: 'openAlerts', label: 'Alertes', sortable: false },
  { key: 'contact', label: 'Contact', sortable: false },
  { key: 'actions', label: '', sortable: false, align: 'right' },
]

function offlineDays(iso: string | null): number | null {
  if (!iso) return null
  const ms = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(ms)) return null
  return Math.floor(ms / 86_400_000)
}

function offlineLabel(c: SupportCompanyRow): string {
  if (c.devicesOffline === 0) return '-'
  const d = offlineDays(c.oldestOfflineSince)
  if (d === null) return `${c.devicesOffline} hors ligne`
  return `${c.devicesOffline} hors ligne · depuis ${d} j`
}

function rowVariant(c: SupportCompanyRow): 'danger' | 'warning' | 'success' {
  if (c.devicesOffline > 0 || c.openAlerts > 0) {
    const d = offlineDays(c.oldestOfflineSince)
    return d !== null && d >= 2 ? 'danger' : 'warning'
  }
  return 'success'
}

function openCompany(row: { id: string }) {
  router.push(`/support-it/companies/${row.id}`)
}

onMounted(reload)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-gray-900">Compagnies</h1>
      <p class="text-sm text-gray-500">Santé des capteurs par compagnie. Détecter et appeler avant le client.</p>
    </div>

    <AppCard>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AppInput v-model="search" :placeholder="t('common.search') || 'Rechercher...'" :label="t('common.search') || 'Rechercher'" />
      </div>
    </AppCard>

    <AppCard padding="none">
      <DataTable
        :columns="columns"
        :data="store.companies"
        :loading="store.isLoading"
        :pagination="store.companiesMeta ?? undefined"
        empty-message="Aucune compagnie."
        @row-click="openCompany"
        @page-change="handlePageChange"
      >
        <template #name="{ row }">
          <span class="inline-block w-2 h-2 rounded-full mr-2 align-middle" :class="{
            'bg-red-500': rowVariant(row) === 'danger',
            'bg-amber-500': rowVariant(row) === 'warning',
            'bg-green-500': rowVariant(row) === 'success',
          }" />
          <span class="text-sm font-medium text-gray-900">{{ row.name }}</span>
        </template>
        <template #devices="{ row }">
          <span class="text-sm text-gray-600">{{ row.devicesOnline }}/{{ row.devicesTotal }} en ligne</span>
        </template>
        <template #offline="{ row }">
          <AppBadge :variant="row.devicesOffline > 0 ? rowVariant(row) : 'neutral'" size="sm">{{ offlineLabel(row) }}</AppBadge>
        </template>
        <template #openAlerts="{ row }">
          <AppBadge :variant="row.openAlerts > 0 ? 'danger' : 'neutral'" size="sm">{{ row.openAlerts }}</AppBadge>
        </template>
        <template #contact="{ row }">
          <span class="text-sm text-gray-600">{{ row.phone ?? row.email ?? '-' }}</span>
        </template>
        <template #actions="{ row }">
          <div class="text-right" @click.stop>
            <a v-if="row.phone" :href="`tel:${row.phone}`">
              <AppButton variant="outline" size="sm"><PhoneIcon class="w-4 h-4" /> Appeler</AppButton>
            </a>
          </div>
        </template>
      </DataTable>
    </AppCard>
  </div>
</template>
