<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
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
import { PencilIcon, QueueListIcon, EyeIcon, EyeSlashIcon, PlusIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const router = useRouter()
const store = useMarketplaceStore()
const toast = useToast()

const showStockModal = ref(false)
const selectedProductId = ref('')
const newStockQuantity = ref(0)

const { filters, search, applyFilters, handlePageChange, reload } = useServerTable({
  initialFilters: {
    category: '' as '' | 'standard_card' | 'custom_card' | 'enterprise_pack',
    status: '' as '' | 'active' | 'inactive',
  },
  fetcher: (p) =>
    store.fetchProducts({
      page: p.page,
      perPage: p.perPage,
      search: p.search || undefined,
      category: p.category || undefined,
      isActive: p.status === '' ? undefined : p.status === 'active',
    }),
})

const categoryOptions = computed(() => [
  { value: '', label: t('marketplace.allCategories') },
  { value: 'standard_card', label: t('marketplace.categories.standard') },
  { value: 'custom_card', label: t('marketplace.categories.custom') },
  { value: 'enterprise_pack', label: t('marketplace.categories.pack') },
])

const statusOptions = computed(() => [
  { value: '', label: t('marketplace.allProductStatuses') },
  { value: 'active', label: t('marketplace.activeLabel') },
  { value: 'inactive', label: t('common.inactive') },
])

const categoryLabels = computed<Record<string, string>>(() => ({
  standard_card: t('marketplace.categories.standard'),
  custom_card: t('marketplace.categories.custom'),
  enterprise_pack: t('marketplace.categories.pack'),
}))

const columns = computed(() => [
  { key: 'name', label: t('marketplace.product'), sortable: true },
  { key: 'category', label: t('marketplace.category'), sortable: false },
  { key: 'price', label: t('marketplace.price'), sortable: false },
  { key: 'stock', label: t('marketplace.stock'), sortable: false },
  { key: 'status', label: t('common.status'), sortable: false },
  { key: 'customizable', label: t('marketplace.customizableLabel'), sortable: false },
  { key: 'actions', label: t('common.actions'), align: 'right' as const, width: '160px' },
])

const tableData = computed(() =>
  store.products.map((p) => ({
    id: p.id,
    name: p.name,
    category: categoryLabels.value[p.category] ?? p.category,
    price: formatPrice(p.price, p.currency),
    stock: p.stockQuantity,
    status: p.isActive,
    customizable: p.customizable,
    _raw: p,
  })),
)

function formatPrice(amount: number, currency = 'FCFA') {
  return `${amount.toLocaleString('fr-FR')} ${currency}`
}

function openStockModal(id: string, currentQty: number) {
  selectedProductId.value = id
  newStockQuantity.value = currentQty
  showStockModal.value = true
}

async function updateStock() {
  try {
    await store.updateStock(selectedProductId.value, newStockQuantity.value)
    toast.showSuccess(t('marketplace.stockUpdated'))
    showStockModal.value = false
    await reload()
  } catch {
    toast.showError(t('marketplace.stockUpdateError'))
  }
}

async function toggleActive(id: string, product: { isActive: boolean }) {
  try {
    await store.updateProduct(id, { isActive: !product.isActive })
    toast.showSuccess(product.isActive ? t('marketplace.productDisabled') : t('marketplace.productEnabled'))
    await reload()
  } catch {
    toast.showError(t('marketplace.updateError'))
  }
}

onMounted(reload)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('marketplace.adminProductsTitle') }}</h1>
        <p class="text-sm text-gray-500 mt-1">{{ store.pagination.total }} {{ t('marketplace.productsCount') }}</p>
      </div>
      <AppButton variant="primary" @click="router.push('/marketplace/admin/products/create')">
        <PlusIcon class="w-4 h-4 mr-1" />
        {{ t('marketplace.addProduct') }}
      </AppButton>
    </div>

    <AppCard>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AppInput
          v-model="search"
          :placeholder="t('common.search') || 'Rechercher...'"
          :label="t('common.search') || 'Rechercher'"
        />
        <AppSelect
          v-model="filters.category"
          :options="categoryOptions"
          :label="t('marketplace.category')"
          @update:model-value="applyFilters"
        />
        <AppSelect
          v-model="filters.status"
          :options="statusOptions"
          :label="t('common.status')"
          @update:model-value="applyFilters"
        />
      </div>
    </AppCard>

    <AppCard>
      <DataTable
        :columns="columns"
        :data="tableData"
        :loading="store.isLoading"
        :pagination="store.pagination"
        @page-change="handlePageChange"
      >
        <template #price="{ row }">
          <span class="text-sm font-semibold text-primary">{{ row.price }}</span>
        </template>

        <template #stock="{ row }">
          <span class="text-sm" :class="row.stock < 10 ? 'text-red-600 font-semibold' : 'text-gray-600'">
            {{ row.stock }}
          </span>
        </template>

        <template #status="{ row }">
          <AppBadge :variant="row.status ? 'success' : 'neutral'">
            {{ row.status ? t('marketplace.activeLabel') : t('common.inactive') }}
          </AppBadge>
        </template>

        <template #customizable="{ row }">
          <AppBadge v-if="row.customizable" variant="info">{{ t('marketplace.yes') }}</AppBadge>
          <span v-else class="text-sm text-gray-400">{{ t('marketplace.no') }}</span>
        </template>

        <template #actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <AppButton size="sm" variant="ghost" @click="router.push(`/marketplace/admin/products/${row.id}/edit`)" :title="t('common.edit')">
              <PencilIcon class="w-4 h-4" />
            </AppButton>
            <AppButton size="sm" variant="ghost" @click="openStockModal(row.id, row.stock)" :title="t('marketplace.manageStock')">
              <QueueListIcon class="w-4 h-4" />
            </AppButton>
            <AppButton size="sm" variant="ghost" :class="row.status ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'" @click="toggleActive(row.id, row._raw)" :title="row.status ? t('marketplace.disable') : t('marketplace.enable')">
              <EyeSlashIcon v-if="row.status" class="w-4 h-4" />
              <EyeIcon v-else class="w-4 h-4" />
            </AppButton>
          </div>
        </template>
      </DataTable>
    </AppCard>

    <AppModal v-model="showStockModal" :title="t('marketplace.updateStock')" size="sm">
      <div class="space-y-4">
        <AppInput v-model.number="newStockQuantity" :label="t('marketplace.newStockQty')" type="number" :min="0" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButton variant="secondary" @click="showStockModal = false">{{ t('common.cancel') }}</AppButton>
          <AppButton variant="primary" @click="updateStock">{{ t('common.update') }}</AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
