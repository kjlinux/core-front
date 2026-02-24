<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart.store'
import { useOrderStore } from '@/stores/order.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import type { DeliveryAddress } from '@/types'
import { PaymentMethod } from '@/types/enums'

const router = useRouter()
const cartStore = useCartStore()
const orderStore = useOrderStore()
const toast = useToast()

const step = ref(1)
const selectedOrderId = ref('')
const isSubmitting = ref(false)
const selectedPaymentMethod = ref<string>('mobile_money')
const mobileNumber = ref('')
const cardNumber = ref('')
const cardExpiry = ref('')
const cardCvv = ref('')

const DELIVERY_FEE = 2000

const deliveryAddress = ref<DeliveryAddress>({
  fullName: '',
  phone: '',
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

function formatPrice(amount: number, currency = 'FCFA') {
  return `${amount.toLocaleString('fr-FR')} ${currency}`
}

function goToPayment() {
  if (!deliveryAddress.value.fullName || !deliveryAddress.value.phone || !deliveryAddress.value.street || !deliveryAddress.value.city) {
    toast.showError('Veuillez remplir tous les champs')
    return
  }
  step.value = 2
}

async function confirmOrder() {
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
    })
    if (order) {
      selectedOrderId.value = order.orderNumber ?? order.id
      await orderStore.initiatePayment(order.id, selectedPaymentMethod.value as any)
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
    <h1 class="text-2xl font-bold text-gray-900">Finaliser la commande</h1>

    <!-- Steps -->
    <div class="flex items-center gap-4 overflow-x-auto">
      <div v-for="(s, index) in ['Livraison', 'Paiement', 'Confirmation']" :key="index" class="flex items-center gap-2">
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          :class="step > index + 1 ? 'bg-green-500 text-white' : step === index + 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'"
        >{{ index + 1 }}</div>
        <span class="text-sm font-medium whitespace-nowrap" :class="step === index + 1 ? 'text-primary-600' : 'text-gray-400'">{{ s }}</span>
        <div v-if="index < 2" class="h-px w-8 bg-gray-200 flex-shrink-0"></div>
      </div>
    </div>

    <!-- Step 1: Address -->
    <div v-if="step === 1" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <AppCard title="Adresse de livraison" class="lg:col-span-2">
        <div class="space-y-4">
          <AppInput v-model="deliveryAddress.fullName" label="Nom complet *" />
          <AppInput v-model="deliveryAddress.phone" label="Telephone *" type="tel" />
          <AppInput v-model="deliveryAddress.street" label="Adresse *" />
          <AppInput v-model="deliveryAddress.city" label="Ville *" />
          <AppSelect v-model="deliveryAddress.country" label="Pays" :options="countryOptions" />
        </div>
        <div class="mt-6 flex gap-3">
          <AppButton variant="secondary" @click="router.push('/marketplace/cart')">Retour au panier</AppButton>
          <AppButton variant="primary" @click="goToPayment">Continuer</AppButton>
        </div>
      </AppCard>
      <AppCard title="Recapitulatif">
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">{{ cartStore.itemCount }} article(s)</span>
            <span>{{ formatPrice(cartStore.subtotal) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Livraison</span>
            <span>{{ formatPrice(DELIVERY_FEE) }}</span>
          </div>
          <div class="border-t pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span class="text-primary">{{ formatPrice(cartStore.subtotal + DELIVERY_FEE) }}</span>
          </div>
        </div>
      </AppCard>
    </div>

    <!-- Step 2: Payment -->
    <div v-if="step === 2" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-4">
        <AppCard title="Methode de paiement">
          <div class="space-y-3">
            <!-- LigdiCash -->
            <label
              class="flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors"
              :class="selectedPaymentMethod === 'mobile_money' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'"
            >
              <input v-model="selectedPaymentMethod" type="radio" value="mobile_money" class="sr-only" />
              <div class="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                :class="selectedPaymentMethod === 'mobile_money' ? 'border-primary-600' : 'border-gray-300'">
                <div v-if="selectedPaymentMethod === 'mobile_money'" class="w-2 h-2 rounded-full bg-primary-600"></div>
              </div>
              <img src="/ligdicash.png" alt="LigdiCash" class="h-8 object-contain" onerror="this.style.display='none'" />
              <div>
                <p class="font-semibold text-gray-900">LigdiCash - Mobile Money</p>
                <p class="text-sm text-gray-500">Paiement rapide et securise</p>
              </div>
            </label>

            <div v-if="selectedPaymentMethod === 'mobile_money'" class="px-4 pb-2">
              <AppInput v-model="mobileNumber" label="Numero de telephone Mobile Money" type="tel" placeholder="+226 XX XX XX XX" />
            </div>

            <!-- Carte bancaire -->
            <label
              class="flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors"
              :class="selectedPaymentMethod === 'bank_card' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'"
            >
              <input v-model="selectedPaymentMethod" type="radio" value="bank_card" class="sr-only" />
              <div class="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                :class="selectedPaymentMethod === 'bank_card' ? 'border-primary-600' : 'border-gray-300'">
                <div v-if="selectedPaymentMethod === 'bank_card'" class="w-2 h-2 rounded-full bg-primary-600"></div>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-10 h-6 bg-blue-600 rounded text-white text-xs font-bold flex items-center justify-center">VISA</div>
                <div class="w-10 h-6 bg-red-500 rounded text-white text-xs font-bold flex items-center justify-center">MC</div>
              </div>
              <div>
                <p class="font-semibold text-gray-900">Carte bancaire</p>
                <p class="text-sm text-gray-500">Visa, Mastercard</p>
              </div>
            </label>

            <div v-if="selectedPaymentMethod === 'bank_card'" class="px-4 pb-2 space-y-3">
              <AppInput v-model="cardNumber" label="Numero de carte" placeholder="XXXX XXXX XXXX XXXX" maxlength="19" />
              <div class="grid grid-cols-2 gap-3">
                <AppInput v-model="cardExpiry" label="Date d'expiration" placeholder="MM/AA" maxlength="5" />
                <AppInput v-model="cardCvv" label="CVV" placeholder="XXX" maxlength="3" type="password" />
              </div>
            </div>

            <!-- Paiement manuel -->
            <label
              class="flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors"
              :class="selectedPaymentMethod === 'manual' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'"
            >
              <input v-model="selectedPaymentMethod" type="radio" value="manual" class="sr-only" />
              <div class="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                :class="selectedPaymentMethod === 'manual' ? 'border-primary-600' : 'border-gray-300'">
                <div v-if="selectedPaymentMethod === 'manual'" class="w-2 h-2 rounded-full bg-primary-600"></div>
              </div>
              <div class="w-10 h-6 bg-gray-700 rounded flex items-center justify-center shrink-0">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p class="font-semibold text-gray-900">Paiement manuel</p>
                <p class="text-sm text-gray-500">Virement bancaire ou depot cash</p>
              </div>
            </label>

            <div v-if="selectedPaymentMethod === 'manual'" class="px-4 pb-2">
              <div class="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                <p class="font-semibold mb-1">Instructions de paiement</p>
                <p>Votre commande sera enregistree en attente de validation. Un administrateur vous contactera pour confirmer la reception du paiement par virement bancaire ou depot cash avant l'expedition.</p>
              </div>
            </div>

          </div>
        </AppCard>
        <div class="flex gap-3">
          <AppButton variant="secondary" @click="step = 1">Retour</AppButton>
          <AppButton variant="primary" :loading="isSubmitting" @click="confirmOrder">
            Confirmer la commande - {{ formatPrice(cartStore.subtotal + DELIVERY_FEE) }}
          </AppButton>
        </div>
      </div>
      <AppCard title="Recapitulatif">
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">Sous-total</span>
            <span>{{ formatPrice(cartStore.subtotal) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Livraison</span>
            <span>{{ formatPrice(DELIVERY_FEE) }}</span>
          </div>
          <div class="border-t pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span class="text-primary">{{ formatPrice(cartStore.subtotal + DELIVERY_FEE) }}</span>
          </div>
        </div>
      </AppCard>
    </div>

    <!-- Step 3: Confirmation -->
    <div v-if="step === 3" class="max-w-lg mx-auto">
      <AppCard>
        <div class="text-center py-8 space-y-4">
          <div class="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto text-4xl text-green-500 font-bold">
            [OK]
          </div>
          <h2 class="text-2xl font-bold text-gray-900">Commande confirmee !</h2>
          <p class="text-gray-600">Votre commande a ete enregistree avec succes.</p>
          <p v-if="selectedOrderId" class="text-sm text-gray-500">
            Numero de commande : <span class="font-bold text-gray-900">{{ selectedOrderId }}</span>
          </p>
          <div class="flex flex-col gap-3 pt-4">
            <AppButton variant="primary" @click="router.push('/marketplace/orders')">
              Voir mes commandes
            </AppButton>
            <AppButton variant="secondary" @click="router.push('/marketplace')">
              Retour au catalogue
            </AppButton>
          </div>
        </div>
      </AppCard>
    </div>
  </div>
</template>
