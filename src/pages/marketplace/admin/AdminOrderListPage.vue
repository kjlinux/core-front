<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useOrderStore } from '@/stores/order.store'
import { useServerTable } from '@/composables/useServerTable'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppInput from '@/components/ui/AppInput.vue'
import DataTable from '@/components/data-display/DataTable.vue'
import { EyeIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const router = useRouter()
const store = useOrderStore()

const { filters, search, applyFilters, handlePageChange } = useServerTable({
  initialFilters: {
    status: '' as '' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
    paymentStatus: '' as '' | 'pending' | 'paid' | 'failed',
  },
  fetcher: (p) =>
    store.fetchAllOrders({
      page: p.page,
      perPage: p.perPage,
      search: p.search || undefined,
      status: p.status || undefined,
      paymentStatus: p.paymentStatus || undefined,
    }),
})

const statusOptions = computed(() => [
  { label: t('common.all'), value: '' },
  { label: t('marketplace.pending'), value: 'pending' },
  { label: t('marketplace.confirmed'), value: 'confirmed' },
  { label: t('marketplace.processing'), value: 'processing' },
  { label: t('marketplace.shipped'), value: 'shipped' },
  { label: t('marketplace.delivered'), value: 'delivered' },
  { label: t('marketplace.cancelled'), value: 'cancelled' },
])

const paymentStatusOptions = computed(() => [
  { label: t('marketplace.allPayments'), value: '' },
  { label: t('marketplace.pending'), value: 'pending' },
  { label: t('marketplace.paid'), value: 'paid' },
  { label: t('marketplace.failed'), value: 'failed' },
])

const statusVariants: Record<string, string> = {
  pending: 'warning', confirmed: 'info', processing: 'info',
  shipped: 'info', delivered: 'success', cancelled: 'danger',
}

const paymentVariants: Record<string, string> = {
  pending: 'warning', paid: 'success', failed: 'danger', refunded: 'neutral',
}

const statusLabels = computed<Record<string, string>>(() => ({
  pending: t('marketplace.pending'),
  confirmed: t('marketplace.confirmed'),
  processing: t('marketplace.processing'),
  shipped: t('marketplace.shipped'),
  delivered: t('marketplace.delivered'),
  cancelled: t('marketplace.cancelled'),
}))

const columns = computed(() => [
  { key: 'orderNumber', label: t('marketplace.orderNumber2'), sortable: false },
  { key: 'company', label: t('marketplace.company'), sortable: false },
  { key: 'date', label: t('marketplace.date'), sortable: false },
  { key: 'total', label: t('marketplace.total'), sortable: false },
  { key: 'status', label: t('marketplace.orderStatus'), sortable: false },
  { key: 'paymentStatus', label: t('marketplace.paymentStatus'), sortable: false },
  { key: 'actions', label: t('common.actions'), align: 'right' as const, width: '80px' },
])

const tableData = computed(() =>
  store.orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    company: o.companyName,
    date: formatDate(o.createdAt),
    total: formatPrice(o.total, o.currency),
    status: o.status,
    paymentStatus: o.paymentStatus,
  })),
)

function formatPrice(amount: number | undefined, currency = 'FCFA') {
  if (amount == null) return `-- ${currency}`
  return `${amount.toLocaleString('fr-FR')} ${currency}`
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR')
}

onMounted(async () => {
  await store.fetchAllOrders()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('marketplace.adminOrdersTitle') }}</h1>
    </div>

    <AppCard>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AppInput
          v-model="search"
          :placeholder="t('marketplace.searchOrderPlaceholder')"
          :label="t('common.search') || 'Rechercher'"
        />
        <AppSelect
          v-model="filters.status"
          :options="statusOptions"
          :label="t('marketplace.orderStatus')"
          @update:model-value="applyFilters"
        />
        <AppSelect
          v-model="filters.paymentStatus"
          :options="paymentStatusOptions"
          :label="t('marketplace.paymentStatus')"
          @update:model-value="applyFilters"
        />
      </div>

      <p class="text-sm text-gray-500 mt-4 mb-4">{{ store.adminPagination.total }} {{ t('marketplace.ordersCountLabel') }}</p>

      <DataTable
        :columns="columns"
        :data="tableData"
        :loading="store.isLoading"
        :pagination="store.adminPagination"
        @page-change="handlePageChange"
      >
        <template #orderNumber="{ row }">
          <span class="font-mono text-sm font-medium text-gray-900">{{ row.orderNumber }}</span>
        </template>

        <template #total="{ row }">
          <span class="text-sm font-semibold text-primary">{{ row.total }}</span>
        </template>

        <template #status="{ row }">
          <AppBadge :variant="(statusVariants[row.status] ?? 'neutral') as any">
            {{ statusLabels[row.status] ?? row.status }}
          </AppBadge>
        </template>

        <template #paymentStatus="{ row }">
          <AppBadge :variant="(paymentVariants[row.paymentStatus] ?? 'neutral') as any">
            {{ row.paymentStatus }}
          </AppBadge>
        </template>

        <template #actions="{ row }">
          <div class="flex justify-end">
            <AppButton size="sm" variant="ghost" @click="router.push(`/marketplace/admin/orders/${row.id}`)" :title="t('common.view')">
              <EyeIcon class="w-4 h-4" />
            </AppButton>
          </div>
        </template>
      </DataTable>
    </AppCard>
  </div>
</template>
