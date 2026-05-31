<script setup lang="ts">
import { onMounted } from 'vue'
import { useSupportStore } from '@/stores/support.store'
import { useServerTable } from '@/composables/useServerTable'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import DataTable from '@/components/data-display/DataTable.vue'
import { CheckIcon, EyeIcon } from '@heroicons/vue/24/outline'
import type { AlertSeverity, AlertStatus } from '@/types'
import type { TableColumn } from '@/types/common'
import { extractApiErrorMessage } from '@/utils/api-error'
import {
  alertSeverityLabel,
  alertSeverityVariant,
  alertStatusLabel,
  alertStatusVariant,
  deviceKindLabel,
  labelOf,
  variantOf,
} from '@/utils/support-labels'

const store = useSupportStore()
const toast = useToast()
const { t } = useI18n()

const { filters, applyFilters, handlePageChange, reload } = useServerTable({
  initialFilters: {
    status: 'open' as AlertStatus | '',
    severity: '' as AlertSeverity | '',
  },
  fetcher: async (p) => {
    await store.fetchAlerts({
      page: p.page,
      perPage: p.perPage,
      status: (p.status || undefined) as AlertStatus | undefined,
      severity: (p.severity || undefined) as AlertSeverity | undefined,
    })
  },
})

const statusOptions = [
  { value: '', label: 'Tous statuts' },
  { value: 'open', label: 'Ouvertes' },
  { value: 'acknowledged', label: 'Reconnues' },
  { value: 'resolved', label: 'Résolues' },
]
const severityOptions = [
  { value: '', label: 'Toutes sévérités' },
  { value: 'critical', label: 'Critique' },
  { value: 'high', label: 'Haute' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'low', label: 'Faible' },
]

const columns: TableColumn[] = [
  { key: 'title', label: 'Alerte', sortable: false },
  { key: 'severity', label: 'Sévérité', sortable: false },
  { key: 'type', label: 'Type', sortable: false },
  { key: 'status', label: 'Statut', sortable: false },
  { key: 'created_at', label: 'Détecté', sortable: false },
  { key: 'actions', label: '', sortable: false, align: 'right' },
]

async function ack(id: string) {
  try {
    await store.acknowledgeAlert(id)
    toast.success(t('toast.support.alertAcknowledged'))
  } catch (e) {
    toast.error(t('common.failed'), extractApiErrorMessage(e, t('common.genericError')))
  }
}
async function resolve(id: string) {
  try {
    await store.resolveAlert(id)
    toast.success(t('toast.support.alertResolved'))
  } catch (e) {
    toast.error(t('common.failed'), extractApiErrorMessage(e, t('common.genericError')))
  }
}

function fmtDate(s: string | null | undefined) {
  if (!s) return '-'
  return new Date(s).toLocaleString('fr-FR')
}

onMounted(reload)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-gray-900">Alertes</h1>
      <p class="text-sm text-gray-500">Détectées automatiquement par le système</p>
    </div>

    <AppCard padding="sm">
      <div class="flex flex-wrap gap-3 items-end">
        <AppSelect v-model="filters.status" :options="statusOptions" label="Statut" @update:model-value="applyFilters" />
        <AppSelect v-model="filters.severity" :options="severityOptions" label="Sévérité" @update:model-value="applyFilters" />
        <div class="ml-auto text-sm text-gray-500">{{ store.alertsTotal }} résultat(s)</div>
      </div>
    </AppCard>

    <AppCard padding="none">
      <DataTable
        :columns="columns"
        :data="store.alerts"
        :loading="store.isLoading"
        :pagination="store.alertsMeta ?? undefined"
        empty-message="Aucune alerte"
        @page-change="handlePageChange"
      >
        <template #title="{ row }">
          <div class="font-medium text-gray-900">{{ row.title }}</div>
          <div class="text-xs text-gray-500">{{ row.message }}</div>
        </template>
        <template #severity="{ row }">
          <AppBadge :variant="variantOf(alertSeverityVariant, row.severity)" size="sm">
            {{ labelOf(alertSeverityLabel, row.severity) }}
          </AppBadge>
        </template>
        <template #type="{ row }">
          <span class="text-xs text-gray-500">{{ labelOf(deviceKindLabel, row.device_kind) }} · {{ row.type }}</span>
        </template>
        <template #status="{ row }">
          <AppBadge :variant="variantOf(alertStatusVariant, row.status)" size="sm">
            {{ labelOf(alertStatusLabel, row.status) }}
          </AppBadge>
        </template>
        <template #created_at="{ row }">
          <span class="text-sm text-gray-700">{{ fmtDate(row.created_at) }}</span>
        </template>
        <template #actions="{ row }">
          <div class="text-right space-x-2 whitespace-nowrap" @click.stop>
            <AppButton v-if="row.status === 'open'" size="sm" variant="outline" @click="ack(row.id)">
              <EyeIcon class="w-4 h-4" /> Reconnaître
            </AppButton>
            <AppButton v-if="row.status !== 'resolved'" size="sm" variant="success" @click="resolve(row.id)">
              <CheckIcon class="w-4 h-4" /> Résoudre
            </AppButton>
          </div>
        </template>
      </DataTable>
    </AppCard>
  </div>
</template>
