<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'

const { t } = useI18n()
const router = useRouter()
const cartStore = useCartStore()
const toast = useToast()

const DELIVERY_FEE = 2000

function formatPrice(amount: number, currency = 'FCFA') {
  return `${amount.toLocaleString('fr-FR')} ${currency}`
}

function removeItem(productId: string) {
  cartStore.removeItem(productId)
  toast.showSuccess(t('marketplace.removedFromCart'))
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('marketplace.cartTitle') }}</h1>
      <AppButton variant="ghost" @click="router.push('/marketplace')">
        {{ t('marketplace.continueShopping') }}
      </AppButton>
    </div>

    <div v-if="cartStore.isEmpty" class="py-12">
      <AppEmptyState
        :title="t('marketplace.emptyCart')"
        :description="t('marketplace.emptyCartHint')"
        :action-label="t('marketplace.viewCatalog')"
        @action="router.push('/marketplace')"
      />
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Cart Items -->
      <div class="lg:col-span-2 space-y-4">
        <AppCard
          v-for="item in cartStore.items"
          :key="item.productId"
        >
          <div class="flex gap-4">
            <!-- Mini carte RFID -->
            <div
              class="w-20 h-14 rounded-lg flex-shrink-0 relative overflow-hidden flex flex-col justify-between p-2"
              :class="{
                'bg-gradient-to-br from-slate-700 to-slate-900': item.product.category === 'standard_card',
                'bg-gradient-to-br from-amber-500 to-red-700': item.product.category === 'custom_card',
                'bg-gradient-to-br from-indigo-600 to-slate-900': item.product.category === 'enterprise_pack',
                'bg-gradient-to-br from-slate-600 to-slate-800': !['standard_card','custom_card','enterprise_pack'].includes(item.product.category),
              }"
            >
              <div class="w-5 h-3.5 rounded-sm bg-gradient-to-br from-yellow-200 to-yellow-400 flex flex-col justify-center gap-px px-0.5">
                <div class="h-px bg-yellow-600 opacity-60"></div>
                <div class="h-px bg-yellow-600 opacity-60"></div>
              </div>
              <svg class="w-4 h-4 text-white/50 self-end" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="18.75" r=".75" fill="currentColor" stroke="none"/>
              </svg>
            </div>
            <div class="flex-1 space-y-2">
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="font-semibold text-gray-900">{{ item.product.name }}</h3>
                  <p class="text-sm text-gray-500">{{ item.product.category }}</p>
                </div>
                <button
                  class="text-red-400 hover:text-red-600 text-sm"
                  @click="removeItem(item.productId)"
                >
                  {{ t('marketplace.remove') }}
                </button>
              </div>
              <div v-if="item.customization" class="text-xs text-gray-500">
                <span v-if="item.customization.companyName">{{ t('marketplace.enterprise') }} {{ item.customization.companyName }}</span>
                <span v-if="item.customization.color"> | {{ t('marketplace.color') }} {{ item.customization.color }}</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <button
                    class="w-7 h-7 rounded-full border border-gray-300 text-sm hover:bg-gray-50"
                    @click="cartStore.updateQuantity(item.productId, item.quantity - 1)"
                  >-</button>
                  <span class="text-sm font-semibold w-6 text-center">{{ item.quantity }}</span>
                  <button
                    class="w-7 h-7 rounded-full border border-gray-300 text-sm hover:bg-gray-50"
                    @click="cartStore.updateQuantity(item.productId, item.quantity + 1)"
                  >+</button>
                </div>
                <div class="text-right">
                  <p class="text-xs text-gray-500">{{ formatPrice(item.product.price, item.product.currency) }} / {{ t('marketplace.unit') }}</p>
                  <p class="font-bold text-primary">{{ formatPrice(item.product.price * item.quantity, item.product.currency) }}</p>
                </div>
              </div>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Order Summary -->
      <div class="space-y-4">
        <AppCard :title="t('marketplace.summary')">
          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">{{ t('marketplace.subtotal') }}</span>
              <span class="font-medium">{{ formatPrice(cartStore.subtotal) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">{{ t('marketplace.shipping') }}</span>
              <span class="font-medium">{{ formatPrice(DELIVERY_FEE) }}</span>
            </div>
            <div class="border-t border-gray-200 pt-3 flex justify-between">
              <span class="font-semibold text-gray-900">{{ t('marketplace.total') }}</span>
              <span class="font-bold text-lg text-primary">{{ formatPrice(cartStore.subtotal + DELIVERY_FEE) }}</span>
            </div>
          </div>
          <AppButton variant="primary" class="w-full mt-4" @click="router.push('/marketplace/checkout')">
            {{ t('marketplace.checkout') }}
          </AppButton>
        </AppCard>

      </div>
    </div>
  </div>
</template>
