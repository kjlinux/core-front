<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMarketplaceStore } from '@/stores/marketplace.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const store = useMarketplaceStore()
const toast = useToast()

const productId = route.params.id as string

const form = ref({
  name: '',
  description: '',
  category: 'standard_card' as 'standard_card' | 'custom_card' | 'enterprise_pack',
  price: 0,
  currency: 'FCFA',
  stockQuantity: 0,
  minQuantity: 1,
  customizable: false,
  isActive: true,
})

const categoryOptions = [
  { label: 'Carte Standard', value: 'standard_card' },
  { label: 'Carte Personnalisee', value: 'custom_card' },
  { label: 'Pack Entreprise', value: 'enterprise_pack' },
]

async function handleSubmit() {
  try {
    await store.updateProduct(productId, form.value)
    toast.success('Produit mis a jour')
    router.push('/marketplace/admin/products')
  } catch {
    toast.error('Erreur lors de la mise a jour')
  }
}

onMounted(async () => {
  await store.fetchProduct(productId)
  const p = store.currentProduct
  if (p) {
    form.value = {
      name: p.name,
      description: p.description,
      category: p.category,
      price: p.price,
      currency: p.currency,
      stockQuantity: p.stockQuantity,
      minQuantity: p.minQuantity,
      customizable: p.customizable,
      isActive: p.isActive,
    }
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <AppButton variant="ghost" @click="router.push('/marketplace/admin/products')">
        <ArrowLeftIcon class="w-4 h-4 mr-1" />
        Retour
      </AppButton>
      <h1 class="text-2xl font-bold text-gray-900">Modifier le produit</h1>
    </div>

    <div v-if="store.isLoading && !store.currentProduct" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>

    <AppCard v-else>
      <div class="space-y-4 max-w-xl">
        <AppInput v-model="form.name" label="Nom du produit *" />
        <AppTextarea v-model="form.description" label="Description *" :rows="3" />
        <AppSelect v-model="form.category" label="Categorie" :options="categoryOptions" />
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model.number="form.price" label="Prix *" type="number" :min="0" />
          <AppInput v-model="form.currency" label="Devise" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model.number="form.stockQuantity" label="Stock" type="number" :min="0" />
          <AppInput v-model.number="form.minQuantity" label="Quantite minimum" type="number" :min="1" />
        </div>
        <div class="flex items-center justify-between py-2">
          <p class="text-sm font-medium text-gray-800">Personnalisable</p>
          <AppToggle v-model="form.customizable" />
        </div>
        <div class="flex items-center justify-between py-2">
          <p class="text-sm font-medium text-gray-800">Actif</p>
          <AppToggle v-model="form.isActive" />
        </div>
        <div class="flex gap-3 pt-4">
          <AppButton variant="secondary" @click="router.push('/marketplace/admin/products')">Annuler</AppButton>
          <AppButton variant="primary" :loading="store.isLoading" @click="handleSubmit">Enregistrer</AppButton>
        </div>
      </div>
    </AppCard>
  </div>
</template>
