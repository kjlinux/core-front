<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useOrderStore } from '@/stores/order.store'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import { EyeIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const router = useRouter()
const store = useOrderStore()
const authStore = useAuthStore()
const toast = useToast()

const filterStatus = ref('')
const showCancelDialog = ref(false)
const cancelOrderId = ref('')

const statusOptions = computed(() => [
  { label: t('marketplace.allStatuses'), value: '' },
  { label: t('marketplace.pending'), value: 'pending' },
  { label: t('marketplace.confirmed'), value: 'confirmed' },
  { label: t('marketplace.processing'), value: 'processing' },
  { label: t('marketplace.shipped'), value: 'shipped' },
  { label: t('marketplace.delivered'), value: 'delivered' },
  { label: t('marketplace.cancelled'), value: 'cancelled' },
])

const statusLabels = computed<Record<string, string>>(() => ({
  pending: t('marketplace.pending'),
  confirmed: t('marketplace.confirmed'),
  processing: t('marketplace.processing'),
  shipped: t('marketplace.shipped'),
  delivered: t('marketplace.delivered'),
  cancelled: t('marketplace.cancelled'),
}))

const statusVariants: Record<string, string> = {
  pending: 'warning',
  confirmed: 'info',
  processing: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
}

const paymentLabels = computed<Record<string, string>>(() => ({
  pending: t('marketplace.pending'),
  paid: t('marketplace.paid'),
  failed: t('marketplace.failed'),
  refunded: t('marketplace.refunded'),
}))

const paymentVariants: Record<string, string> = {
  pending: 'warning',
  paid: 'success',
  failed: 'danger',
  refunded: 'neutral',
}

const myOrders = computed(() => {
  const companyId = authStore.userCompanyId
  if (!companyId) return store.orders
  return store.orders.filter((o) => o.companyId === companyId)
})

const filteredOrders = computed(() => {
  if (!filterStatus.value) return myOrders.value
  return myOrders.value.filter((o) => o.status === filterStatus.value)
})

function formatPrice(amount: number | undefined, currency = 'FCFA') {
  if (amount == null) return `-- ${currency}`
  return `${amount.toLocaleString('fr-FR')} ${currency}`
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR')
}

function openCancelDialog(orderId: string) {
  cancelOrderId.value = orderId
  showCancelDialog.value = true
}

async function confirmCancel() {
  try {
    await store.cancelOrder(cancelOrderId.value)
    toast.showSuccess(t('marketplace.orderCancelled'))
  } catch {
    toast.showError("Erreur lors de l'annulation")
  }
}

onMounted(async () => {
  await store.fetchOrders()
})
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">{{ t('marketplace.ordersTitle') }}</h1>

    <AppCard>
      <div class="mb-6">
        <AppSelect v-model="filterStatus" :options="statusOptions" class="w-60" />
      </div>

      <div v-if="store.isLoading" class="flex justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>

      <div v-else-if="filteredOrders.length === 0" class="text-center py-12 text-gray-500">
        {{ t('marketplace.noOrder') }}
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('marketplace.orderNumber2') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('marketplace.date') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('marketplace.articles') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('marketplace.total') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('marketplace.orderStatus') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('marketplace.paymentStatus') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="order in filteredOrders" :key="order.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-mono text-sm font-medium text-gray-900">{{ order.orderNumber }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(order.createdAt) }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ order.items.length }} {{ t('marketplace.items') }}</td>
              <td class="px-4 py-3 text-sm font-semibold text-primary">{{ formatPrice(order.total, order.currency) }}</td>
              <td class="px-4 py-3">
                <AppBadge :variant="(statusVariants[order.status] ?? 'neutral') as any">
                  {{ statusLabels[order.status] ?? order.status }}
                </AppBadge>
              </td>
              <td class="px-4 py-3">
                <AppBadge :variant="(paymentVariants[order.paymentStatus] ?? 'neutral') as any">
                  {{ paymentLabels[order.paymentStatus] ?? order.paymentStatus }}
                </AppBadge>
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-1">
                  <AppButton size="sm" variant="ghost" @click="router.push(`/marketplace/orders/${order.id}`)" :title="t('common.view')">
                    <EyeIcon class="w-4 h-4" />
                  </AppButton>
                  <AppButton
                    v-if="order.status === 'pending'"
                    size="sm"
                    variant="ghost"
                    class="text-red-600 hover:text-red-700"
                    @click="openCancelDialog(order.id)"
                    :title="t('marketplace.cancelOrder')"
                  >
                    <XMarkIcon class="w-4 h-4" />
                  </AppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>

    <AppConfirmDialog
      :open="showCancelDialog"
      @cancel="showCancelDialog = false"
      :title="t('marketplace.cancelOrder')"
      :message="t('marketplace.cancelConfirm')"
      @confirm="confirmCancel"
    />
  </div>
</template>
