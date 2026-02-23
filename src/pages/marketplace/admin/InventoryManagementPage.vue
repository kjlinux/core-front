<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMarketplaceStore } from '@/stores/marketplace.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'

const store = useMarketplaceStore()
const toast = useToast()

const showAdjustModal = ref(false)
const selectedProduct = ref<any>(null)
const adjustForm = ref({ newQuantity: 0, reason: '' })

const hasLowStock = computed(() => store.products.some((p) => p.stockQuantity < 10))

const stockHistory = [
  { date: '2024-11-20', product: 'Carte RFID Standard', oldQty: 50, newQty: 100, reason: 'Reapprovisionnement', user: 'Admin' },
  { date: '2024-11-18', product: 'Pack Enterprise Pro', oldQty: 15, newQty: 5, reason: 'Ventes', user: 'Systeme' },
  { date: '2024-11-15', product: 'Carte Personnalisee', oldQty: 80, newQty: 150, reason: 'Nouveau stock', user: 'Admin' },
]

function getStockStatus(qty: number) {
  if (qty === 0) return { label: 'Rupture', variant: 'danger' }
  if (qty <= 10) return { label: 'Critique', variant: 'danger' }
  if (qty <= 50) return { label: 'Faible', variant: 'warning' }
  return { label: 'Normal', variant: 'success' }
}

function openAdjustModal(product: any) {
  selectedProduct.value = product
  adjustForm.value = { newQuantity: product.stockQuantity, reason: '' }
  showAdjustModal.value = true
}

async function saveAdjustment() {
  if (!adjustForm.value.reason) {
    toast.showError('Veuillez indiquer la raison de l\'ajustement')
    return
  }
  try {
    await store.updateStock(selectedProduct.value.id, adjustForm.value.newQuantity)
    toast.showSuccess('Stock ajuste avec succes')
    showAdjustModal.value = false
  } catch {
    toast.showError("Erreur lors de l'ajustement")
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR')
}

onMounted(async () => {
  await store.fetchProducts()
})
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">Gestion des stocks</h1>

    <!-- Low stock alert -->
    <div v-if="hasLowStock" class="p-4 bg-orange-50 border border-orange-200 rounded-lg">
      <p class="text-orange-800 font-medium text-sm">
        Certains produits ont un stock critique. Veuillez verifier le tableau ci-dessous.
      </p>
    </div>

    <AppCard title="Etat des stocks">
      <div v-if="store.isLoading" class="flex justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categorie</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock actuel</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantite min.</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-100">
            <tr
              v-for="product in store.products"
              :key="product.id"
              class="hover:bg-gray-50"
              :class="{ 'bg-red-50': product.stockQuantity < 10 }"
            >
              <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ product.name }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ product.category }}</td>
              <td class="px-4 py-3 text-sm font-bold" :class="product.stockQuantity < 10 ? 'text-red-600' : 'text-gray-900'">
                {{ product.stockQuantity }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ product.minQuantity }}</td>
              <td class="px-4 py-3">
                <AppBadge :variant="(getStockStatus(product.stockQuantity).variant) as any">
                  {{ getStockStatus(product.stockQuantity).label }}
                </AppBadge>
              </td>
              <td class="px-4 py-3">
                <AppButton size="sm" variant="secondary" @click="openAdjustModal(product)">
                  Ajuster stock
                </AppButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>

    <AppCard title="Historique des ajustements">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ancien stock</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nouveau stock</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Raison</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="entry in stockHistory" :key="entry.date + entry.product" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(entry.date) }}</td>
              <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ entry.product }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ entry.oldQty }}</td>
              <td class="px-4 py-3 text-sm font-semibold" :class="entry.newQty > entry.oldQty ? 'text-green-600' : 'text-red-600'">
                {{ entry.newQty }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ entry.reason }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ entry.user }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>

    <AppModal v-if="selectedProduct" v-model="showAdjustModal" title="Ajuster le stock" size="sm">
      <div class="space-y-4">
        <p class="text-sm font-medium text-gray-800">{{ selectedProduct.name }}</p>
        <p class="text-sm text-gray-500">Stock actuel : <span class="font-bold">{{ selectedProduct.stockQuantity }}</span></p>
        <AppInput v-model.number="adjustForm.newQuantity" label="Nouveau stock *" type="number" :min="0" />
        <AppInput v-model="adjustForm.reason" label="Raison de l'ajustement *" placeholder="Ex: Reapprovisionnement, Inventaire..." />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButton variant="secondary" @click="showAdjustModal = false">Annuler</AppButton>
          <AppButton variant="primary" :loading="store.isLoading" @click="saveAdjustment">Ajuster</AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
