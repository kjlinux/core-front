<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useOrderStore } from '@/stores/order.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useOrderStore()
const toast = useToast()

const orderId = route.params.id as string
const order = computed(() => store.currentOrder)

const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

const stepLabels = computed<Record<string, string>>(() => ({
  pending: t('marketplace.pending'),
  confirmed: t('marketplace.confirmed'),
  processing: t('marketplace.processing'),
  shipped: t('marketplace.shipped'),
  delivered: t('marketplace.delivered'),
}))

const paymentMethodLabels: Record<string, string> = {
  mobile_money: 'LigdiCash / Mobile Money',
  bank_card: 'Carte bancaire',
  manual: 'Paiement manuel',
}

const paymentStatusLabels = computed<Record<string, string>>(() => ({
  pending: t('marketplace.pending'),
  paid: t('marketplace.paid'),
  failed: t('marketplace.failed'),
  refunded: t('marketplace.refunded'),
}))

function formatPrice(amount: number, currency = 'FCFA') {
  return `${amount.toLocaleString('fr-FR')} ${currency}`
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR')
}

function getCurrentStepIndex() {
  if (!order.value) return -1
  if (order.value.status === 'cancelled') return -1
  return statusSteps.indexOf(order.value.status)
}

async function cancelOrder() {
  try {
    await store.cancelOrder(orderId)
    toast.showSuccess(t('marketplace.orderCancelled'))
  } catch {
    toast.showError("Erreur lors de l'annulation")
  }
}

onMounted(async () => {
  await store.fetchOrder(orderId)
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <AppButton variant="ghost" @click="router.push('/marketplace/orders')">&larr; {{ t('marketplace.ordersLink') }}</AppButton>
      <h1 class="text-2xl font-bold text-gray-900">
        {{ t('marketplace.orderTitle') }} {{ order?.orderNumber ?? orderId }}
      </h1>
    </div>

    <div v-if="store.isLoading && !order" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>

    <template v-else-if="order">
      <!-- Suivi de livraison -->
      <AppCard :title="t('marketplace.trackDelivery')">
        <!-- Commande annulee -->
        <div v-if="order.status === 'cancelled'" class="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <p class="font-semibold text-red-700">{{ t('marketplace.cancelled') }}</p>
            <p class="text-sm text-red-500">{{ t('marketplace.orderCancelledAt') }} {{ formatDate(order.updatedAt) }}</p>
          </div>
        </div>

        <!-- Stepper actif -->
        <div v-else class="overflow-x-auto pb-2">
          <div class="flex items-start min-w-max">
            <template v-for="(status, index) in statusSteps" :key="status">
              <div class="flex flex-col items-center gap-2 w-28">
                <div
                  class="w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all"
                  :class="index < getCurrentStepIndex()
                    ? 'bg-green-500 text-white shadow-sm'
                    : index === getCurrentStepIndex()
                      ? 'bg-primary-700 text-white ring-4 ring-primary-100 shadow'
                      : 'bg-gray-100 text-gray-400'"
                >
                  <svg v-if="index < getCurrentStepIndex()" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <template v-else-if="index === getCurrentStepIndex()">
                    <svg v-if="status === 'pending'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                    </svg>
                    <svg v-else-if="status === 'confirmed'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <svg v-else-if="status === 'processing'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
                    </svg>
                    <svg v-else-if="status === 'shipped'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </svg>
                    <svg v-else-if="status === 'delivered'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                  </template>
                  <span v-else class="text-sm font-semibold">{{ index + 1 }}</span>
                </div>
                <div class="text-center">
                  <p class="text-xs font-semibold"
                    :class="index <= getCurrentStepIndex() ? 'text-gray-900' : 'text-gray-400'">
                    {{ stepLabels[status] }}
                  </p>
                  <p v-if="index === getCurrentStepIndex()" class="text-xs text-primary-600 mt-0.5">{{ t('marketplace.inProgress') }}</p>
                  <p v-else-if="index < getCurrentStepIndex()" class="text-xs text-green-600 mt-0.5">{{ t('marketplace.validated') }}</p>
                  <p v-else class="text-xs text-gray-300 mt-0.5">—</p>
                </div>
              </div>

              <div
                v-if="index < statusSteps.length - 1"
                class="h-0.5 flex-1 min-w-6 mt-5 transition-all"
                :class="index < getCurrentStepIndex() ? 'bg-green-400' : 'bg-gray-200'"
              ></div>
            </template>
          </div>
        </div>

        <div v-if="order.status === 'pending'" class="mt-5 pt-4 border-t border-gray-100 flex justify-end">
          <AppButton variant="danger" size="sm" @click="cancelOrder">
            {{ t('marketplace.cancelOrderBtn') }}
          </AppButton>
        </div>
      </AppCard>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-4">
          <AppCard :title="t('marketplace.orderedArticles')">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('marketplace.product') }}</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('marketplace.qty') }}</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('marketplace.unitPrice') }}</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('marketplace.total') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="item in order.items" :key="item.productId">
                    <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ item.productName }}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">{{ item.quantity }}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">{{ formatPrice(item.unitPrice, order.currency) }}</td>
                    <td class="px-4 py-3 text-sm font-semibold">{{ formatPrice(item.totalPrice, order.currency) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="mt-4 pt-4 border-t space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">{{ t('marketplace.subtotal') }}</span>
                <span>{{ formatPrice(order.subtotal, order.currency) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">{{ t('marketplace.shipping') }}</span>
                <span>{{ formatPrice(order.deliveryFee, order.currency) }}</span>
              </div>
              <div class="flex justify-between font-bold text-base pt-1 border-t">
                <span>{{ t('marketplace.total') }}</span>
                <span class="text-primary">{{ formatPrice(order.total, order.currency) }}</span>
              </div>
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

        <!-- Sidebar -->
        <div class="space-y-4">
          <AppCard :title="t('marketplace.payment')">
            <div class="space-y-2 text-sm">
              <div>
                <p class="text-gray-500">{{ t('marketplace.method') }}</p>
                <p class="font-medium">{{ paymentMethodLabels[order.paymentMethod] }}</p>
              </div>
              <div>
                <p class="text-gray-500">{{ t('marketplace.paymentStatus') }}</p>
                <AppBadge :variant="order.paymentStatus === 'paid' ? 'success' : order.paymentStatus === 'failed' ? 'danger' : 'warning'">
                  {{ paymentStatusLabels[order.paymentStatus] }}
                </AppBadge>
              </div>
            </div>
          </AppCard>

          <AppCard :title="t('marketplace.info')">
            <div class="space-y-2 text-sm">
              <div>
                <p class="text-gray-500">{{ t('marketplace.orderDate') }}</p>
                <p class="font-medium">{{ formatDate(order.createdAt) }}</p>
              </div>
              <div>
                <p class="text-gray-500">{{ t('marketplace.lastUpdate') }}</p>
                <p class="font-medium">{{ formatDate(order.updatedAt) }}</p>
              </div>
            </div>
          </AppCard>
        </div>
      </div>
    </template>

    <div v-else class="text-center py-12 text-gray-500">{{ t('common.noData') }}</div>
  </div>
</template>
