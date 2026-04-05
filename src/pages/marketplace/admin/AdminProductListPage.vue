<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useMarketplaceStore } from '@/stores/marketplace.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import { PencilIcon, QueueListIcon, EyeIcon, EyeSlashIcon, PlusIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const router = useRouter()
const store = useMarketplaceStore()
const toast = useToast()

const showStockModal = ref(false)
const selectedProductId = ref('')
const newStockQuantity = ref(0)

const categoryLabels = computed<Record<string, string>>(() => ({
  standard_card: t('marketplace.categories.standard'),
  custom_card: t('marketplace.categories.custom'),
  enterprise_pack: t('marketplace.categories.pack'),
}))

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
  } catch {
    toast.showError(t('marketplace.stockUpdateError'))
  }
}

async function toggleActive(id: string, product: any) {
  try {
    await store.updateProduct(id, { isActive: !product.isActive })
    toast.showSuccess(product.isActive ? t('marketplace.productDisabled') : t('marketplace.productEnabled'))
  } catch {
    toast.showError(t('marketplace.updateError'))
  }
}

onMounted(async () => {
  await store.fetchProducts()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('marketplace.adminProductsTitle') }}</h1>
        <p class="text-sm text-gray-500 mt-1">{{ store.products.length }} {{ t('marketplace.productsCount') }}</p>
      </div>
      <AppButton variant="primary" @click="router.push('/marketplace/admin/products/create')">
        <PlusIcon class="w-4 h-4 mr-1" />
        {{ t('marketplace.addProduct') }}
      </AppButton>
    </div>

    <AppCard>
      <div v-if="store.isLoading" class="flex justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('marketplace.product') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('marketplace.category') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('marketplace.price') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('marketplace.stock') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('common.status') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('marketplace.customizableLabel') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-100">
            <tr v-for="product in store.products" :key="product.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ product.name }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ categoryLabels[product.category] }}</td>
              <td class="px-4 py-3 text-sm font-semibold text-primary">{{ formatPrice(product.price, product.currency) }}</td>
              <td class="px-4 py-3 text-sm" :class="product.stockQuantity < 10 ? 'text-red-600 font-semibold' : 'text-gray-600'">
                {{ product.stockQuantity }}
              </td>
              <td class="px-4 py-3">
                <AppBadge :variant="product.isActive ? 'success' : 'neutral'">
                  {{ product.isActive ? t('marketplace.activeLabel') : t('common.inactive') }}
                </AppBadge>
              </td>
              <td class="px-4 py-3">
                <AppBadge v-if="product.customizable" variant="info">{{ t('marketplace.yes') }}</AppBadge>
                <span v-else class="text-sm text-gray-400">{{ t('marketplace.no') }}</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-1">
                  <AppButton size="sm" variant="ghost" @click="router.push(`/marketplace/admin/products/${product.id}/edit`)" :title="t('common.edit')">
                    <PencilIcon class="w-4 h-4" />
                  </AppButton>
                  <AppButton size="sm" variant="ghost" @click="openStockModal(product.id, product.stockQuantity)" :title="t('marketplace.manageStock')">
                    <QueueListIcon class="w-4 h-4" />
                  </AppButton>
                  <AppButton size="sm" variant="ghost" :class="product.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'" @click="toggleActive(product.id, product)" :title="product.isActive ? t('marketplace.disable') : t('marketplace.enable')">
                    <EyeSlashIcon v-if="product.isActive" class="w-4 h-4" />
                    <EyeIcon v-else class="w-4 h-4" />
                  </AppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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
