<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useMarketplaceStore } from '@/stores/marketplace.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'

const { t } = useI18n()
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

const categoryOptions = computed(() => [
  { label: t('marketplace.categories.standard'), value: 'standard_card' },
  { label: t('marketplace.categories.custom'), value: 'custom_card' },
  { label: t('marketplace.categories.pack'), value: 'enterprise_pack' },
])

async function handleSubmit() {
  if (!form.value.name || !form.value.description || form.value.price <= 0) {
    toast.error(t('marketplace.fillRequiredFields'))
    return
  }
  try {
    await store.createProduct(form.value)
    toast.success(t('marketplace.productCreated'))
    router.push('/marketplace/admin/products')
  } catch {
    toast.error(t('marketplace.createProductError'))
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <AppButton variant="ghost" @click="router.push('/marketplace/admin/products')">&larr; {{ t('common.back') }}</AppButton>
      <h1 class="text-2xl font-bold text-gray-900">{{ t('marketplace.createProductTitle') }}</h1>
    </div>

    <AppCard>
      <div class="space-y-4 max-w-xl">
        <AppInput v-model="form.name" :label="t('marketplace.productName')" :placeholder="t('marketplace.productNamePlaceholder')" />
        <AppTextarea v-model="form.description" :label="t('marketplace.descriptionLabel')" :placeholder="t('marketplace.descriptionPlaceholder')" :rows="3" />
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model.number="form.price" :label="t('marketplace.priceLabel')" type="number" :min="0" />
          <AppInput v-model.number="form.stockQuantity" :label="t('marketplace.initialStock')" type="number" :min="0" />
        </div>
        <div class="flex items-center justify-between py-2">
          <div>
            <p class="text-sm font-medium text-gray-800">{{ t('marketplace.activeLabel') }}</p>
            <p class="text-xs text-gray-500">{{ t('marketplace.visibleLabel') }}</p>
          </div>
          <AppToggle v-model="form.isActive" />
        </div>
        <div class="flex gap-3 pt-4">
          <AppButton variant="secondary" @click="router.push('/marketplace/admin/products')">{{ t('common.cancel') }}</AppButton>
          <AppButton variant="primary" :loading="store.isLoading" @click="handleSubmit">{{ t('marketplace.createProductBtn') }}</AppButton>
        </div>
      </div>
    </AppCard>
  </div>
</template>
