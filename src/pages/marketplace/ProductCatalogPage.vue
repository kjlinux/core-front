<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMarketplaceStore } from '@/stores/marketplace.store'
import { useCartStore } from '@/stores/cart.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppSearchInput from '@/components/ui/AppSearchInput.vue'
import type { Product } from '@/types'

const router = useRouter()
const store = useMarketplaceStore()
const cartStore = useCartStore()
const toast = useToast()

const search = ref('')
const activeCategory = ref('all')
const showAddModal = ref(false)
const selectedProduct = ref<Product | null>(null)
const quantity = ref(1)

const categories = [
  { label: 'Tous', value: 'all' },
  { label: 'Cartes Standard', value: 'standard_card' },
  { label: 'Cartes Personnalisees', value: 'custom_card' },
  { label: 'Packs Entreprise', value: 'enterprise_pack' },
]

const categoryLabels: Record<string, string> = {
  standard_card: 'Carte Standard',
  custom_card: 'Carte Personnalisee',
  enterprise_pack: 'Pack Entreprise',
}

const filteredProducts = computed(() => {
  let list = store.products
  if (activeCategory.value !== 'all') {
    list = list.filter((p) => p.category === activeCategory.value)
  }
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
  }
  return list
})

function formatPrice(amount: number, currency = 'FCFA') {
  return `${amount.toLocaleString('fr-FR')} ${currency}`
}

function openAddToCart(product: Product) {
  selectedProduct.value = product
  quantity.value = product.minQuantity || 1
  showAddModal.value = true
}

function confirmAddToCart() {
  if (!selectedProduct.value) return
  cartStore.addItem(selectedProduct.value, quantity.value)
  toast.showSuccess(`${selectedProduct.value.name} ajouté au panier`)
  showAddModal.value = false
}

onMounted(async () => {
  await store.fetchProducts()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Catalogue RFID</h1>
        <p class="text-sm text-gray-500 mt-1">Commandez vos cartes RFID et accessoires</p>
      </div>
      <AppButton variant="secondary" @click="router.push('/marketplace/cart')">
        Panier ({{ cartStore.itemCount }})
      </AppButton>
    </div>

    <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <AppSearchInput v-model="search" placeholder="Rechercher un produit..." class="flex-1" />
    </div>

    <!-- Category tabs -->
    <div class="flex gap-2 border-b border-gray-200 overflow-x-auto pb-px">
      <button
        v-for="cat in categories"
        :key="cat.value"
        class="px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors"
        :class="activeCategory === cat.value ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'"
        @click="activeCategory = cat.value"
      >
        {{ cat.label }}
      </button>
    </div>

    <div v-if="store.isLoading" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>

    <div v-else-if="filteredProducts.length === 0" class="text-center py-12 text-gray-500">
      Aucun produit trouve
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white"
      >
        <!-- Product image placeholder -->
        <div class="h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-4xl font-light">
          [{{ categoryLabels[product.category]?.charAt(0) ?? 'P' }}]
        </div>
        <div class="p-4 space-y-3">
          <div class="flex items-start justify-between gap-2">
            <h3 class="font-semibold text-gray-900 leading-tight">{{ product.name }}</h3>
            <AppBadge variant="info">{{ categoryLabels[product.category] ?? product.category }}</AppBadge>
          </div>
          <p class="text-sm text-gray-500 line-clamp-2">{{ product.description }}</p>
          <div class="flex items-center gap-2 flex-wrap">
            <AppBadge :variant="product.stockQuantity > 0 ? 'success' : 'danger'">
              {{ product.stockQuantity > 0 ? 'En stock' : 'Rupture' }}
            </AppBadge>
            <AppBadge v-if="product.customizable" variant="default">Personnalisable</AppBadge>
          </div>
          <p class="text-xl font-bold text-primary">{{ formatPrice(product.price, product.currency) }}</p>
          <div class="flex gap-2">
            <AppButton
              size="sm"
              variant="primary"
              :disabled="product.stockQuantity === 0"
              class="flex-1"
              @click="openAddToCart(product)"
            >
              Ajouter au panier
            </AppButton>
            <AppButton size="sm" variant="ghost" @click="router.push(`/marketplace/products/${product.id}`)">
              Details
            </AppButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Add to cart modal -->
    <AppModal v-if="selectedProduct" v-model="showAddModal" :title="`Ajouter au panier - ${selectedProduct.name}`" size="sm">
      <div class="space-y-4">
        <p class="text-sm text-gray-600">{{ selectedProduct.description }}</p>
        <p class="text-lg font-bold text-primary">{{ formatPrice(selectedProduct.price, selectedProduct.currency) }}</p>
        <div>
          <label class="text-sm font-medium text-gray-700">Quantite (min. {{ selectedProduct.minQuantity }})</label>
          <div class="flex items-center gap-3 mt-1">
            <button
              class="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50"
              @click="quantity = Math.max(selectedProduct.minQuantity, quantity - 1)"
            >-</button>
            <span class="text-lg font-semibold w-8 text-center">{{ quantity }}</span>
            <button
              class="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50"
              @click="quantity++"
            >+</button>
          </div>
        </div>
        <p class="text-sm text-gray-600">
          Total : <span class="font-bold text-primary">{{ formatPrice(selectedProduct.price * quantity, selectedProduct.currency) }}</span>
        </p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButton variant="secondary" @click="showAddModal = false">Annuler</AppButton>
          <AppButton variant="primary" @click="confirmAddToCart">Ajouter au panier</AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
