<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'

const router = useRouter()
const cartStore = useCartStore()
const toast = useToast()

const promoCode = ref('')
const DELIVERY_FEE = 2000

function formatPrice(amount: number, currency = 'FCFA') {
  return `${amount.toLocaleString('fr-FR')} ${currency}`
}

function applyPromo() {
  if (promoCode.value) {
    toast.showSuccess('Code promo applique !')
  } else {
    toast.showError('Veuillez saisir un code promo')
  }
}

function removeItem(productId: string) {
  cartStore.removeItem(productId)
  toast.showSuccess('Produit retire du panier')
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Mon panier</h1>
      <AppButton variant="ghost" @click="router.push('/marketplace')">
        Continuer les achats
      </AppButton>
    </div>

    <div v-if="cartStore.isEmpty" class="py-12">
      <AppEmptyState
        title="Votre panier est vide"
        description="Parcourez le catalogue pour ajouter des produits"
        action-label="Voir le catalogue"
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
            <div class="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-2xl flex-shrink-0">
              [P]
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
                  Retirer
                </button>
              </div>
              <div v-if="item.customization" class="text-xs text-gray-500">
                <span v-if="item.customization.companyName">Entreprise: {{ item.customization.companyName }}</span>
                <span v-if="item.customization.color"> | Couleur: {{ item.customization.color }}</span>
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
                  <p class="text-xs text-gray-500">{{ formatPrice(item.product.price, item.product.currency) }} / unite</p>
                  <p class="font-bold text-primary">{{ formatPrice(item.product.price * item.quantity, item.product.currency) }}</p>
                </div>
              </div>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Order Summary -->
      <div class="space-y-4">
        <AppCard title="Recapitulatif">
          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Sous-total</span>
              <span class="font-medium">{{ formatPrice(cartStore.subtotal) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Livraison</span>
              <span class="font-medium">{{ formatPrice(DELIVERY_FEE) }}</span>
            </div>
            <div class="border-t border-gray-200 pt-3 flex justify-between">
              <span class="font-semibold text-gray-900">Total</span>
              <span class="font-bold text-lg text-primary">{{ formatPrice(cartStore.subtotal + DELIVERY_FEE) }}</span>
            </div>
          </div>
          <AppButton variant="primary" class="w-full mt-4" @click="router.push('/marketplace/checkout')">
            Passer la commande
          </AppButton>
        </AppCard>

        <AppCard title="Code promo">
          <div class="flex gap-2">
            <AppInput v-model="promoCode" placeholder="Votre code promo" class="flex-1" />
            <AppButton variant="secondary" @click="applyPromo">Appliquer</AppButton>
          </div>
        </AppCard>
      </div>
    </div>
  </div>
</template>
