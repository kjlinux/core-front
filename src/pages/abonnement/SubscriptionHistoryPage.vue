<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSubscriptionStore } from '@/stores/subscription.store'
import { useToast } from '@/composables/useToast'
import { formatCurrency } from '@/utils/format'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSearchInput from '@/components/ui/AppSearchInput.vue'
import DataTable from '@/components/data-display/DataTable.vue'
import type { TableColumn } from '@/types/common'

const store = useSubscriptionStore()
const toast = useToast()

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
    await store.fetchHistory()
  } catch (e) {
    toast.error("Impossible de charger l'historique", String((e as Error).message))
  }
})
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">Historique des paiements</h1>

    <AppCard padding="sm">
      <div class="flex flex-wrap gap-3 items-end">
        <div class="flex-1 min-w-55">
          <AppSearchInput v-model="search" placeholder="Rechercher (plan, statut)..." />
        </div>
      </div>
    </AppCard>

    <AppCard padding="none">
      <DataTable
        :columns="columns"
        :data="pagedPayments"
        :loading="store.isLoading"
        :pagination="paginationObj"
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
  </div>
</template>
