<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMarketplaceStore } from '@/stores/marketplace.store'
import { useCartStore } from '@/stores/cart.store'
import { useToast } from '@/composables/useToast'
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
const showAddModal = ref(false)
const selectedProduct = ref<Product | null>(null)
const quantity = ref(1)

const categoryLabels: Record<string, string> = {
  standard_card: 'Carte Standard',
  custom_card: 'Carte Personnalisee',
  enterprise_pack: 'Pack Entreprise',
}

const filteredProducts = computed(() => {
  let list = store.products
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
        class="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 bg-white"
      >
        <!-- Simulation carte RFID -->
        <div
          class="relative h-48 p-5 flex flex-col justify-between overflow-hidden"
          :class="{
            'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900': product.category === 'standard_card',
            'bg-gradient-to-br from-amber-500 via-orange-600 to-red-700': product.category === 'custom_card',
            'bg-gradient-to-br from-indigo-600 via-blue-700 to-slate-900': product.category === 'enterprise_pack',
          }"
        >
          <!-- Cercles decoratifs de fond -->
          <div class="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10 bg-white"></div>
          <div class="absolute -bottom-10 -left-6 w-44 h-44 rounded-full opacity-10 bg-white"></div>

          <!-- Haut de la carte : chip + logo -->
          <div class="flex items-start justify-between relative z-10">
            <!-- Chip simulee -->
            <div class="flex flex-col gap-0.5">
              <div class="w-9 h-7 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-400 flex flex-col justify-center gap-0.5 px-1 shadow-inner">
                <div class="h-px bg-yellow-600 opacity-60"></div>
                <div class="h-px bg-yellow-600 opacity-60"></div>
                <div class="h-px bg-yellow-600 opacity-60"></div>
              </div>
            </div>
            <!-- Badge categorie -->
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm">
              {{ categoryLabels[product.category] ?? product.category }}
            </span>
          </div>

          <!-- Milieu : numero de carte factice -->
          <div class="relative z-10 space-y-1">
            <p class="text-white/50 text-xs tracking-widest font-mono">RFID</p>
            <p class="text-white font-mono text-sm tracking-[0.2em] font-semibold drop-shadow">
              ████ ████ ████ ████
            </p>
          </div>

          <!-- Bas de carte : nom produit + antenne RFID -->
          <div class="flex items-end justify-between relative z-10">
            <p class="text-white font-semibold text-sm leading-tight drop-shadow max-w-[70%] truncate">
              {{ product.name }}
            </p>
            <!-- Symbole RFID -->
            <svg class="w-8 h-8 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12" cy="18.75" r=".75" fill="currentColor" stroke="none"/>
            </svg>
          </div>
        </div>
        <div class="p-4 space-y-3">
          <div class="flex items-start justify-between gap-2">
            <h3 class="font-semibold text-gray-900 leading-tight">{{ product.name }}</h3>
          </div>
          <p class="text-sm text-gray-500 line-clamp-2">{{ product.description }}</p>
          <div class="flex items-center gap-2 flex-wrap">
            <AppBadge :variant="product.stockQuantity > 0 ? 'success' : 'danger'">
              {{ product.stockQuantity > 0 ? 'En stock' : 'Rupture' }}
            </AppBadge>
            <AppBadge v-if="product.customizable" variant="neutral">Personnalisable</AppBadge>
          </div>
          <p class="text-xl font-bold text-primary">{{ formatPrice(product.price, product.currency) }}</p>
          <AppButton
            size="sm"
            variant="primary"
            :disabled="product.stockQuantity === 0"
            class="w-full"
            @click="openAddToCart(product)"
          >
            Ajouter au panier
          </AppButton>
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
