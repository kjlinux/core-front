<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMarketplaceStore } from '@/stores/marketplace.store'
import { useServerTable } from '@/composables/useServerTable'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import DataTable from '@/components/data-display/DataTable.vue'

const { t } = useI18n()
const store = useMarketplaceStore()
const toast = useToast()

const showAdjustModal = ref(false)
const selectedProduct = ref<any>(null)
const adjustForm = ref({ newQuantity: 0, reason: '' })

const { filters, search, applyFilters, handlePageChange, reload } = useServerTable({
  initialFilters: {
    stockStatus: '' as '' | 'out_of_stock' | 'critical' | 'low' | 'normal',
  },
  fetcher: (p) =>
    store.fetchProducts({
      page: p.page,
      perPage: p.perPage,
      search: p.search || undefined,
      stockStatus: p.stockStatus || undefined,
    }),
})

const stockStatusOptions = computed(() => [
  { value: '', label: t('marketplace.allStockStatuses') },
  { value: 'out_of_stock', label: t('marketplace.outOfStockStatus') },
  { value: 'critical', label: t('marketplace.criticalStock') },
  { value: 'low', label: t('marketplace.lowStock') },
  { value: 'normal', label: t('marketplace.normalStock') },
])

const hasLowStock = computed(() => store.products.some((p) => p.stockQuantity < 10))

function getStockStatus(qty: number) {
  if (qty === 0) return { label: t('marketplace.outOfStockStatus'), variant: 'danger' }
  if (qty <= 10) return { label: t('marketplace.criticalStock'), variant: 'danger' }
  if (qty <= 50) return { label: t('marketplace.lowStock'), variant: 'warning' }
  return { label: t('marketplace.normalStock'), variant: 'success' }
}

const columns = computed(() => [
  { key: 'name', label: t('marketplace.product'), sortable: true },
  { key: 'category', label: t('marketplace.category'), sortable: false },
  { key: 'stock', label: t('marketplace.currentStock'), sortable: false },
  { key: 'status', label: t('common.status'), sortable: false },
  { key: 'actions', label: t('common.actions'), align: 'right' as const, width: '140px' },
])

const tableData = computed(() =>
  store.products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    stock: p.stockQuantity,
    status: p.stockQuantity,
    _raw: p,
  })),
)

function openAdjustModal(product: any) {
  selectedProduct.value = product
  adjustForm.value = { newQuantity: product.stockQuantity, reason: '' }
  showAdjustModal.value = true
}

async function saveAdjustment() {
  if (!adjustForm.value.reason) {
    toast.showError(t('marketplace.adjustReasonRequired'))
    return
  }
  try {
    await store.updateStock(selectedProduct.value.id, Math.round(adjustForm.value.newQuantity))
    toast.showSuccess(t('marketplace.stockAdjusted'))
    showAdjustModal.value = false
    await reload()
  } catch {
    toast.showError(t('marketplace.adjustError'))
  }
}

onMounted(reload)
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">{{ t('marketplace.inventoryTitle') }}</h1>

    <!-- Low stock alert -->
    <div v-if="hasLowStock" class="p-4 bg-orange-50 border border-orange-200 rounded-lg">
      <p class="text-orange-800 font-medium text-sm">
        {{ t('marketplace.stockAlert') }}
      </p>
    </div>

    <AppCard>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AppInput
          v-model="search"
          :placeholder="t('marketplace.searchProduct') || 'Rechercher un produit...'"
          :label="t('common.search') || 'Rechercher'"
        />
        <AppSelect
          v-model="filters.stockStatus"
          :options="stockStatusOptions"
          :label="t('common.status')"
          @update:model-value="applyFilters"
        />
      </div>
    </AppCard>

    <AppCard :title="t('marketplace.stockState')">
      <DataTable
        :columns="columns"
        :data="tableData"
        :loading="store.isLoading"
        :pagination="store.pagination"
        @page-change="handlePageChange"
      >
        <template #stock="{ row }">
          <span class="text-sm font-bold" :class="row.stock < 10 ? 'text-red-600' : 'text-gray-900'">
            {{ row.stock }}
          </span>
        </template>

        <template #status="{ row }">
          <AppBadge :variant="(getStockStatus(row.status).variant) as any">
            {{ getStockStatus(row.status).label }}
          </AppBadge>
        </template>

        <template #actions="{ row }">
          <div class="flex justify-end">
            <AppButton size="sm" variant="secondary" @click="openAdjustModal(row._raw)">
              {{ t('marketplace.adjustStock') }}
            </AppButton>
          </div>
        </template>
      </DataTable>
    </AppCard>

    <AppModal v-if="selectedProduct" v-model="showAdjustModal" :title="t('marketplace.adjustStock')" size="sm">
      <div class="space-y-4">
        <p class="text-sm font-medium text-gray-800">{{ selectedProduct.name }}</p>
        <p class="text-sm text-gray-500">{{ t('marketplace.currentStock') }} : <span class="font-bold">{{ selectedProduct.stockQuantity }}</span></p>
        <AppInput v-model.number="adjustForm.newQuantity" :label="t('marketplace.newStock')" type="number" :min="0" :step="1" />
        <AppInput v-model="adjustForm.reason" :label="t('marketplace.adjustReason')" :placeholder="t('marketplace.adjustReasonPlaceholder')" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButton variant="secondary" @click="showAdjustModal = false">{{ t('common.cancel') }}</AppButton>
          <AppButton variant="primary" :loading="store.isLoading" @click="saveAdjustment">{{ t('marketplace.adjustBtn') }}</AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
