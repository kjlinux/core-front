<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart.store'
import { useOrderStore } from '@/stores/order.store'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'
import { companyApi } from '@/services/api/company.api'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import type { DeliveryAddress } from '@/types'

const { t } = useI18n()
const router = useRouter()
const cartStore = useCartStore()
const orderStore = useOrderStore()
const authStore = useAuthStore()
const toast = useToast()

const isSuperAdmin = computed(() => authStore.userRole === 'super_admin')
const selectedCompanyId = ref(authStore.user?.companyId ?? '')
const companyOptions = ref<{ label: string; value: string }[]>([])

onMounted(async () => {
  if (isSuperAdmin.value) {
    try {
      const companies = await companyApi.getAll()
      companyOptions.value = companies.map((c) => ({ label: c.name, value: c.id }))
    } catch {
      // silencieux
    }
  }
})

const step = ref(1)
const selectedOrderId = ref('')
const isSubmitting = ref(false)
const selectedPaymentMethod = ref<string>('mobile_money')
const mobileNumber = ref('')
const DELIVERY_FEE = 2000

const deliveryAddress = ref<DeliveryAddress>({
  fullName: authStore.user ? `${authStore.user.firstName} ${authStore.user.lastName}` : '',
  phone: authStore.user?.phone ?? '',
  street: '',
  city: '',
  country: 'Burkina Faso',
})

const countryOptions = [
  { label: 'Burkina Faso', value: 'Burkina Faso' },
  { label: 'Senegal', value: 'Senegal' },
  { label: "Cote d'Ivoire", value: "Cote d'Ivoire" },
  { label: 'Mali', value: 'Mali' },
]

const steps = computed(() => [
  t('marketplace.delivery'),
  t('marketplace.payment'),
  t('marketplace.confirmation'),
])

function formatPrice(amount: number, currency = 'FCFA') {
  return `${amount.toLocaleString('fr-FR')} ${currency}`
}

function goToPayment() {
  if (isSuperAdmin.value && !selectedCompanyId.value) {
    toast.showError(t('marketplace.selectCompanyRequired'))
    return
  }
  if (!deliveryAddress.value.fullName || !deliveryAddress.value.phone || !deliveryAddress.value.street || !deliveryAddress.value.city) {
    toast.showError(t('marketplace.fillRequired'))
    return
  }
  step.value = 2
}

async function confirmOrder() {
  if (isSuperAdmin.value && !selectedCompanyId.value) {
    toast.showError(t('marketplace.selectCompanyRequired'))
    return
  }
  if (selectedPaymentMethod.value === 'mobile_money' && !mobileNumber.value.trim()) {
    toast.showError(t('marketplace.mobileMoneyRequired'))
    return
  }
  isSubmitting.value = true
  try {
    const items = cartStore.items.map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: item.product.price,
      totalPrice: item.product.price * item.quantity,
    }))
    const order = await orderStore.createOrder({
      items,
      subtotal: cartStore.subtotal,
      deliveryFee: DELIVERY_FEE,
      total: cartStore.subtotal + DELIVERY_FEE,
      currency: 'FCFA',
      paymentMethod: selectedPaymentMethod.value as any,
      deliveryAddress: deliveryAddress.value,
      ...(isSuperAdmin.value && selectedCompanyId.value ? { companyId: selectedCompanyId.value } : {}),
    })
    if (order) {
      selectedOrderId.value = order.orderNumber ?? order.id
      const paymentResult = await orderStore.initiatePayment(order.id, selectedPaymentMethod.value as any, mobileNumber.value || undefined)
      if (paymentResult && (paymentResult as any).payment_url) {
        cartStore.clearCart()
        window.location.href = (paymentResult as any).payment_url
        return
      }
      if ((paymentResult as any)?.pending) {
        toast.showWarning(t('marketplace.gatewayUnavailable'))
      }
    }
    cartStore.clearCart()
    step.value = 3
  } catch {
    toast.showError('Erreur lors de la confirmation de la commande')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">{{ t('marketplace.checkoutTitle') }}</h1>

    <!-- Steps -->
    <div class="flex items-center gap-4 overflow-x-auto">
      <div v-for="(s, index) in steps" :key="index" class="flex items-center gap-2">
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          :class="step > index + 1 ? 'bg-green-500 text-white' : step === index + 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'"
        >{{ index + 1 }}</div>
        <span class="text-sm font-medium whitespace-nowrap" :class="step === index + 1 ? 'text-primary-600' : 'text-gray-400'">{{ s }}</span>
        <div v-if="index < 2" class="h-px w-8 bg-gray-200 shrink-0"></div>
      </div>
    </div>

    <!-- Step 1: Address -->
    <div v-if="step === 1" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <AppCard :title="t('marketplace.deliveryAddress')" class="lg:col-span-2">
        <div class="space-y-4">
          <AppSelect
            v-if="isSuperAdmin"
            v-model="selectedCompanyId"
            :label="`${t('marketplace.fullName')} *`"
            :options="companyOptions"
          />
          <AppInput v-model="deliveryAddress.fullName" :label="t('marketplace.fullName')" />
          <AppInput v-model="deliveryAddress.phone" :label="t('marketplace.phone')" type="tel" />
          <AppInput v-model="deliveryAddress.street" :label="t('marketplace.address')" />
          <AppInput v-model="deliveryAddress.city" :label="t('marketplace.city')" />
          <AppSelect v-model="deliveryAddress.country" :label="t('marketplace.country')" :options="countryOptions" />
        </div>
        <div class="mt-6 flex gap-3">
          <AppButton variant="secondary" @click="router.push('/marketplace/cart')">{{ t('marketplace.backToCart') }}</AppButton>
          <AppButton variant="primary" @click="goToPayment">{{ t('marketplace.continue') }}</AppButton>
        </div>
      </AppCard>
      <AppCard :title="t('marketplace.summary')">
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">{{ cartStore.itemCount }} {{ t('marketplace.items') }}</span>
            <span>{{ formatPrice(cartStore.subtotal) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">{{ t('marketplace.shipping') }}</span>
            <span>{{ formatPrice(DELIVERY_FEE) }}</span>
          </div>
          <div class="border-t pt-2 flex justify-between font-bold">
            <span>{{ t('marketplace.total') }}</span>
            <span class="text-primary">{{ formatPrice(cartStore.subtotal + DELIVERY_FEE) }}</span>
          </div>
        </div>
      </AppCard>
    </div>

    <!-- Step 2: Payment -->
    <div v-if="step === 2" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-4">
        <AppCard :title="t('marketplace.paymentMethod')">
          <div class="space-y-3">
            <!-- LigdiCash -->
            <label
              class="flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors"
              :class="selectedPaymentMethod === 'mobile_money' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'"
            >
              <input v-model="selectedPaymentMethod" type="radio" value="mobile_money" class="sr-only" />
              <div class="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                :class="selectedPaymentMethod === 'mobile_money' ? 'border-primary-600' : 'border-gray-300'">
                <div v-if="selectedPaymentMethod === 'mobile_money'" class="w-2 h-2 rounded-full bg-primary-600"></div>
              </div>
              <img src="/ligdicash.png" alt="LigdiCash" class="h-8 object-contain" onerror="this.style.display='none'" />
              <div>
                <p class="font-semibold text-gray-900">{{ t('marketplace.ligdicash') }}</p>
                <p class="text-sm text-gray-500">{{ t('marketplace.ligdicashHint') }}</p>
              </div>
            </label>

            <div v-if="selectedPaymentMethod === 'mobile_money'" class="px-4 pb-2">
              <AppInput v-model="mobileNumber" :label="t('marketplace.mobileMoneyPhone')" type="tel" :placeholder="t('marketplace.mobileMoneyPlaceholder')" />
            </div>

            <!-- Paiement manuel -->
            <label
              class="flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors"
              :class="selectedPaymentMethod === 'manual' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'"
            >
              <input v-model="selectedPaymentMethod" type="radio" value="manual" class="sr-only" />
              <div class="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                :class="selectedPaymentMethod === 'manual' ? 'border-primary-600' : 'border-gray-300'">
                <div v-if="selectedPaymentMethod === 'manual'" class="w-2 h-2 rounded-full bg-primary-600"></div>
              </div>
              <div class="w-10 h-6 bg-gray-700 rounded flex items-center justify-center shrink-0">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p class="font-semibold text-gray-900">{{ t('marketplace.manualPayment') }}</p>
                <p class="text-sm text-gray-500">{{ t('marketplace.manualPaymentHint') }}</p>
              </div>
            </label>

            <div v-if="selectedPaymentMethod === 'manual'" class="px-4 pb-2">
              <div class="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                <p class="font-semibold mb-1">{{ t('marketplace.paymentInstructions') }}</p>
                <p>{{ t('marketplace.manualPaymentDesc') }}</p>
              </div>
            </div>

          </div>
        </AppCard>
        <div class="flex gap-3">
          <AppButton variant="secondary" @click="step = 1">{{ t('common.back') }}</AppButton>
          <AppButton variant="primary" :loading="isSubmitting" @click="confirmOrder">
            {{ t('marketplace.confirmOrder') }} {{ formatPrice(cartStore.subtotal + DELIVERY_FEE) }}
          </AppButton>
        </div>
      </div>
      <AppCard :title="t('marketplace.summary')">
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">{{ t('marketplace.subtotal') }}</span>
            <span>{{ formatPrice(cartStore.subtotal) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">{{ t('marketplace.shipping') }}</span>
            <span>{{ formatPrice(DELIVERY_FEE) }}</span>
          </div>
          <div class="border-t pt-2 flex justify-between font-bold">
            <span>{{ t('marketplace.total') }}</span>
            <span class="text-primary">{{ formatPrice(cartStore.subtotal + DELIVERY_FEE) }}</span>
          </div>
        </div>
      </AppCard>
    </div>

    <!-- Step 3: Confirmation -->
    <div v-if="step === 3" class="max-w-lg mx-auto">
      <AppCard>
        <div class="text-center py-8 space-y-4">
          <div class="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900">{{ t('marketplace.orderConfirmed') }}</h2>
          <p class="text-gray-600">{{ t('marketplace.orderConfirmedMsg') }}</p>
          <p v-if="selectedOrderId" class="text-sm text-gray-500">
            {{ t('marketplace.orderNumber') }} <span class="font-bold text-gray-900">{{ selectedOrderId }}</span>
          </p>
          <div class="flex flex-col gap-3 pt-4">
            <AppButton variant="primary" @click="router.push('/marketplace/orders')">
              {{ t('marketplace.viewMyOrders') }}
            </AppButton>
            <AppButton variant="secondary" @click="router.push('/marketplace')">
              {{ t('marketplace.backToCatalog') }}
            </AppButton>
          </div>
        </div>
      </AppCard>
    </div>
  </div>
</template>
