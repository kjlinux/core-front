<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMarketplaceStore } from '@/stores/marketplace.store'
import { useCartStore } from '@/stores/cart.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppInput from '@/components/ui/AppInput.vue'

const route = useRoute()
const router = useRouter()
const store = useMarketplaceStore()
const cartStore = useCartStore()
const toast = useToast()

const productId = route.params.id as string
const quantity = ref(1)
const customization = ref({ companyName: '', color: '#000000', logoUrl: '' })

const product = computed(() => store.currentProduct)

const categoryLabels: Record<string, string> = {
  standard_card: 'Carte Standard',
  custom_card: 'Carte Personnalisee',
  enterprise_pack: 'Pack Entreprise',
}

function formatPrice(amount: number, currency = 'FCFA') {
  return `${amount.toLocaleString('fr-FR')} ${currency}`
}

function addToCart() {
  if (!product.value) return
  const qty = Math.max(product.value.minQuantity, quantity.value)
  const customData = product.value.customizable ? customization.value : undefined
  cartStore.addItem(product.value, qty, customData)
  toast.showSuccess(`${product.value.name} ajoute au panier`)
}

function orderNow() {
  addToCart()
  router.push('/marketplace/cart')
}

onMounted(async () => {
  await store.fetchProduct(productId)
  if (product.value) {
    quantity.value = product.value.minQuantity || 1
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <AppButton variant="ghost" @click="router.push('/marketplace')">&larr; Catalogue</AppButton>
    </div>

    <div v-if="store.isLoading" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>

    <div v-else-if="product" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Left: Image -->
      <div class="h-80 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 text-6xl font-light">
        [{{ categoryLabels[product.category]?.charAt(0) ?? 'P' }}]
      </div>

      <!-- Right: Info -->
      <div class="space-y-4">
        <div class="flex items-start gap-3">
          <h1 class="text-2xl font-bold text-gray-900 flex-1">{{ product.name }}</h1>
          <AppBadge variant="info">{{ categoryLabels[product.category] }}</AppBadge>
        </div>

        <p class="text-gray-600">{{ product.description }}</p>

        <div class="flex gap-2">
          <AppBadge :variant="product.stockQuantity > 0 ? 'success' : 'danger'">
            {{ product.stockQuantity > 0 ? `En stock (${product.stockQuantity})` : 'Rupture de stock' }}
          </AppBadge>
          <AppBadge v-if="product.customizable" variant="default">Personnalisable</AppBadge>
        </div>

        <p class="text-3xl font-bold text-primary">{{ formatPrice(product.price, product.currency) }}</p>

        <!-- Customization -->
        <div v-if="product.customizable" class="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p class="font-semibold text-gray-800">Personnalisation</p>
          <AppInput v-model="customization.companyName" label="Nom de l'entreprise" placeholder="Ex: TechBurk SARL" />
          <div>
            <label class="text-sm font-medium text-gray-700">Couleur principale</label>
            <input v-model="customization.color" type="color" class="ml-2 w-10 h-8 rounded border border-gray-300 cursor-pointer" />
          </div>
          <AppInput v-model="customization.logoUrl" label="URL du logo (optionnel)" type="url" />
        </div>

        <!-- Quantity -->
        <div>
          <p class="text-sm font-medium text-gray-700 mb-2">Quantite (min. {{ product.minQuantity }})</p>
          <div class="flex items-center gap-3">
            <button
              class="w-9 h-9 rounded-full border-2 border-gray-300 hover:border-primary hover:text-primary transition-colors"
              @click="quantity = Math.max(product.minQuantity, quantity - 1)"
            >-</button>
            <span class="text-xl font-semibold w-10 text-center">{{ quantity }}</span>
            <button
              class="w-9 h-9 rounded-full border-2 border-gray-300 hover:border-primary hover:text-primary transition-colors"
              @click="quantity++"
            >+</button>
          </div>
        </div>

        <p class="text-sm text-gray-600">Total : <span class="font-bold text-lg text-primary">{{ formatPrice(product.price * quantity, product.currency) }}</span></p>

        <div class="flex gap-3 pt-2">
          <AppButton
            variant="primary"
            :disabled="product.stockQuantity === 0"
            class="flex-1"
            @click="addToCart"
          >
            Ajouter au panier
          </AppButton>
          <AppButton
            variant="secondary"
            :disabled="product.stockQuantity === 0"
            @click="orderNow"
          >
            Commander maintenant
          </AppButton>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12 text-gray-500">Produit introuvable</div>
  </div>
</template>
