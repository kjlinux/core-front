<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMarketplaceStore } from '@/stores/marketplace.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'

const router = useRouter()
const store = useMarketplaceStore()
const toast = useToast()

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
  images: [] as string[],
})

const categoryOptions = [
  { label: 'Carte Standard', value: 'standard_card' },
  { label: 'Carte Personnalisee', value: 'custom_card' },
  { label: 'Pack Entreprise', value: 'enterprise_pack' },
]

async function handleSubmit() {
  if (!form.value.name || !form.value.description || form.value.price <= 0) {
    toast.error('Veuillez remplir tous les champs obligatoires')
    return
  }
  try {
    await store.createProduct(form.value)
    toast.success('Produit cree avec succes')
    router.push('/marketplace/admin/products')
  } catch {
    toast.error('Erreur lors de la creation du produit')
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <AppButton variant="ghost" @click="router.push('/marketplace/admin/products')">&larr; Retour</AppButton>
      <h1 class="text-2xl font-bold text-gray-900">Nouveau produit</h1>
    </div>

    <AppCard>
      <div class="space-y-4 max-w-xl">
        <AppInput v-model="form.name" label="Nom du produit *" placeholder="Ex: Carte RFID Standard 13.56 MHz" />
        <AppTextarea v-model="form.description" label="Description *" placeholder="Description detaillee du produit..." :rows="3" />
        <AppSelect v-model="form.category" label="Categorie" :options="categoryOptions" />
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model.number="form.price" label="Prix *" type="number" :min="0" />
          <AppInput v-model="form.currency" label="Devise" placeholder="FCFA" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model.number="form.stockQuantity" label="Stock initial" type="number" :min="0" />
          <AppInput v-model.number="form.minQuantity" label="Quantite minimum" type="number" :min="1" />
        </div>
        <div class="flex items-center justify-between py-2">
          <div>
            <p class="text-sm font-medium text-gray-800">Personnalisable</p>
            <p class="text-xs text-gray-500">Le client peut personnaliser ce produit</p>
          </div>
          <AppToggle v-model="form.customizable" />
        </div>
        <div class="flex items-center justify-between py-2">
          <div>
            <p class="text-sm font-medium text-gray-800">Actif</p>
            <p class="text-xs text-gray-500">Visible dans le catalogue</p>
          </div>
          <AppToggle v-model="form.isActive" />
        </div>
        <div class="flex gap-3 pt-4">
          <AppButton variant="secondary" @click="router.push('/marketplace/admin/products')">Annuler</AppButton>
          <AppButton variant="primary" :loading="store.isLoading" @click="handleSubmit">Creer le produit</AppButton>
        </div>
      </div>
    </AppCard>
  </div>
</template>
