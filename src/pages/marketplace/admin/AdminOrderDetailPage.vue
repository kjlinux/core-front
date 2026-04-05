<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useOrderStore } from '@/stores/order.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useOrderStore()
const toast = useToast()

const orderId = route.params.id as string
const order = computed(() => store.currentOrder)

const showTrackingModal = ref(false)
const newStatus = ref('')
const trackingInfo = ref({ carrier: '', trackingNumber: '' })

const statusOptions = computed(() => [
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
  pending: 'warning', confirmed: 'info', processing: 'info',
  shipped: 'info', delivered: 'success', cancelled: 'danger',
}

function formatPrice(amount: number, currency = 'FCFA') {
  return `${amount.toLocaleString('fr-FR')} ${currency}`
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR')
}

function updateStatus() {
  if (newStatus.value) {
    toast.showSuccess(`${t('marketplace.statusUpdatedTo')} ${statusLabels.value[newStatus.value]}`)
  }
}

function saveTracking() {
  toast.showSuccess(t('marketplace.trackingInfo'))
  showTrackingModal.value = false
}

onMounted(async () => {
  await store.fetchOrder(orderId)
  if (order.value) {
    newStatus.value = order.value.status
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <AppButton variant="ghost" @click="router.push('/marketplace/admin/orders')">&larr; {{ t('common.back') }}</AppButton>
      <h1 class="text-2xl font-bold text-gray-900">{{ t('marketplace.adminOrderDetail') }}</h1>
    </div>

    <div v-if="store.isLoading && !order" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>

    <template v-else-if="order">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-4">
          <AppCard :title="t('marketplace.articles')">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{{ t('marketplace.product') }}</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{{ t('marketplace.qty') }}</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{{ t('marketplace.unitPriceShort') }}</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{{ t('marketplace.total') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="item in order.items" :key="item.productId">
                    <td class="px-4 py-2 text-sm font-medium text-gray-900">{{ item.productName }}</td>
                    <td class="px-4 py-2 text-sm text-gray-600">{{ item.quantity }}</td>
                    <td class="px-4 py-2 text-sm text-gray-600">{{ formatPrice(item.unitPrice, order.currency) }}</td>
                    <td class="px-4 py-2 text-sm font-semibold">{{ formatPrice(item.totalPrice, order.currency) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="mt-3 pt-3 border-t text-right space-y-1">
              <p class="text-sm text-gray-600">{{ t('marketplace.subtotal') }} : {{ formatPrice(order.subtotal, order.currency) }}</p>
              <p class="text-sm text-gray-600">{{ t('marketplace.shipping') }} : {{ formatPrice(order.deliveryFee, order.currency) }}</p>
              <p class="font-bold text-primary">{{ t('marketplace.total') }} : {{ formatPrice(order.total, order.currency) }}</p>
            </div>
          </AppCard>

          <AppCard :title="t('marketplace.deliveryAddressLabel')">
            <div class="text-sm space-y-1">
              <p class="font-semibold text-gray-900">{{ order.deliveryAddress.fullName }}</p>
              <p class="text-gray-600">{{ order.deliveryAddress.phone }}</p>
              <p class="text-gray-600">{{ order.deliveryAddress.street }}</p>
              <p class="text-gray-600">{{ order.deliveryAddress.city }}, {{ order.deliveryAddress.country }}</p>
            </div>
          </AppCard>
        </div>

        <div class="space-y-4">
          <AppCard :title="t('marketplace.orderStatus')">
            <div class="space-y-3">
              <div>
                <p class="text-xs text-gray-500">{{ t('marketplace.currentStatus') }}</p>
                <AppBadge :variant="(statusVariants[order.status] ?? 'neutral') as any">
                  {{ statusLabels[order.status] }}
                </AppBadge>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-700">{{ t('marketplace.newStatus') }}</label>
                <AppSelect v-model="newStatus" :options="statusOptions" class="mt-1" />
              </div>
              <AppButton variant="primary" class="w-full" @click="updateStatus">{{ t('marketplace.updateStatus') }}</AppButton>
            </div>
          </AppCard>

          <AppCard :title="t('marketplace.info')">
            <div class="space-y-2 text-sm">
              <div>
                <p class="text-gray-500">{{ t('marketplace.company') }}</p>
                <p class="font-medium text-gray-900">{{ order.companyName }}</p>
              </div>
              <div>
                <p class="text-gray-500">{{ t('marketplace.date') }}</p>
                <p class="font-medium">{{ formatDate(order.createdAt) }}</p>
              </div>
              <div>
                <p class="text-gray-500">{{ t('marketplace.payment') }}</p>
                <p class="font-medium">{{ order.paymentMethod }} - {{ order.paymentStatus }}</p>
              </div>
            </div>
          </AppCard>

          <AppCard :title="t('common.actions')">
            <div class="space-y-2">
              <AppButton variant="secondary" class="w-full" @click="showTrackingModal = true">
                {{ t('marketplace.addTracking') }}
              </AppButton>
              <AppButton
                v-if="order.invoiceUrl"
                variant="ghost"
                class="w-full"
              >
                {{ t('marketplace.downloadInvoice') }}
              </AppButton>
            </div>
          </AppCard>
        </div>
      </div>
    </template>

    <AppModal v-model="showTrackingModal" :title="t('marketplace.trackingInfo')" size="sm">
      <div class="space-y-4">
        <AppInput v-model="trackingInfo.carrier" :label="t('marketplace.carrier')" :placeholder="t('marketplace.carrierPlaceholder')" />
        <AppInput v-model="trackingInfo.trackingNumber" :label="t('marketplace.trackingNumber')" :placeholder="t('marketplace.trackingPlaceholder')" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButton variant="secondary" @click="showTrackingModal = false">{{ t('common.cancel') }}</AppButton>
          <AppButton variant="primary" @click="saveTracking">{{ t('common.save') }}</AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
