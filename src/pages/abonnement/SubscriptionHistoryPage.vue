<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSubscriptionStore } from '@/stores/subscription.store'
import { useToast } from '@/composables/useToast'
import { formatCurrency } from '@/utils/format'
import { extractApiErrorMessage } from '@/utils/api-error'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import DataTable from '@/components/data-display/DataTable.vue'
import type { TableColumn } from '@/types/common'

const store = useSubscriptionStore()
const toast = useToast()
const { t } = useI18n()

const search = ref('')
const currentPage = ref(1)
const perPage = 10

const columns: TableColumn[] = [
  { key: 'created_at', label: 'Date' },
  { key: 'plans', label: 'De → Vers', sortable: false },
  { key: 'amount_xof', label: 'Montant', align: 'right' },
  { key: 'is_prorata', label: 'Type' },
  { key: 'payment_status', label: 'Statut' },
]

const EVENT_LABELS: Record<string, string> = {
  subscribed: 'Souscription',
  upgraded: 'Upgrade',
  downgraded: 'Downgrade',
  renewed: 'Renouvellement',
  prepaid: 'Prépaiement',
  rolled_over: 'Bascule de période',
  expired: 'Expiration',
  admin_changed: 'Modification admin',
}

const eventColumns: TableColumn[] = [
  { key: 'created_at', label: 'Date' },
  { key: 'event', label: 'Événement' },
  { key: 'plans', label: 'De → Vers', sortable: false },
  { key: 'notes', label: 'Détails', sortable: false },
]

const eventsPage = ref(1)
const eventsPerPage = 10

const sortedEvents = computed(() =>
  [...store.events].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
)

const pagedEvents = computed(() =>
  sortedEvents.value.slice((eventsPage.value - 1) * eventsPerPage, eventsPage.value * eventsPerPage),
)

const eventsPagination = computed(() => ({
  currentPage: eventsPage.value,
  perPage: eventsPerPage,
  total: sortedEvents.value.length,
  totalPages: Math.max(1, Math.ceil(sortedEvents.value.length / eventsPerPage)),
}))

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return store.payments
  return store.payments.filter(
    (p) =>
      (p.from_plan ?? '').toLowerCase().includes(q) ||
      (p.to_plan ?? '').toLowerCase().includes(q) ||
      (p.payment_status ?? '').toLowerCase().includes(q),
  )
})

const sorted = computed(() =>
  [...filtered.value].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  ),
)

const pagedPayments = computed(() =>
  sorted.value.slice((currentPage.value - 1) * perPage, currentPage.value * perPage),
)

const paginationObj = computed(() => ({
  currentPage: currentPage.value,
  perPage,
  total: sorted.value.length,
  totalPages: Math.max(1, Math.ceil(sorted.value.length / perPage)),
}))

onMounted(async () => {
  try {
    await Promise.all([store.fetchHistory(), store.fetchEvents()])
  } catch (e) {
    toast.error(t('toast.abonnement.loadHistoryError'), extractApiErrorMessage(e, t('common.genericError')))
  }
})
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">Historique des paiements</h1>

    <AppCard>
      <DataTable
        :columns="columns"
        :data="pagedPayments"
        :loading="store.isLoading"
        :pagination="paginationObj"
        searchable
        v-model:search-query="search"
        search-placeholder="Rechercher (plan, statut)..."
        default-sort-column="created_at"
        default-sort-direction="desc"
        empty-message="Aucun paiement."
        @page-change="(p) => (currentPage = p)"
      >
        <template #created_at="{ row }">{{ new Date(row.created_at).toLocaleString('fr-FR') }}</template>
        <template #plans="{ row }">{{ row.from_plan }} → {{ row.to_plan }}</template>
        <template #amount_xof="{ row }">
          <span class="text-right block">{{ formatCurrency(row.amount_xof) }}</span>
        </template>
        <template #is_prorata="{ row }">{{ row.is_prorata ? 'Prorata' : 'Mois plein' }}</template>
        <template #payment_status="{ row }">
          <AppBadge :variant="row.payment_status === 'paid' ? 'success' : (row.payment_status === 'failed' ? 'danger' : 'neutral')">
            {{ row.payment_status }}
          </AppBadge>
        </template>
      </DataTable>
    </AppCard>

    <h2 class="text-xl font-bold text-gray-900">Historique des changements</h2>

    <AppCard>
      <DataTable
        :columns="eventColumns"
        :data="pagedEvents"
        :loading="store.isLoading"
        :pagination="eventsPagination"
        default-sort-column="created_at"
        default-sort-direction="desc"
        empty-message="Aucun changement enregistré."
        @page-change="(p) => (eventsPage = p)"
      >
        <template #created_at="{ row }">{{ new Date(row.created_at).toLocaleString('fr-FR') }}</template>
        <template #event="{ row }">{{ EVENT_LABELS[row.event] ?? row.event }}</template>
        <template #plans="{ row }">{{ row.from_plan ?? '-' }} → {{ row.to_plan ?? '-' }}</template>
        <template #notes="{ row }">{{ row.notes ?? '' }}</template>
      </DataTable>
    </AppCard>
  </div>
</template>
