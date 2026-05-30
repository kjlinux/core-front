<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCompanyStore } from '@/stores/company.store'
import { useActiveCompanyStore } from '@/stores/active-company.store'
import { usePermissions } from '@/composables/usePermissions'
import { useToast } from '@/composables/useToast'
import type { Company } from '@/types'
import CompanyForm from '@/components/forms/CompanyForm.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { extractApiErrorMessage } from '@/utils/api-error'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const router = useRouter()
const companyStore = useCompanyStore()
const activeCompanyStore = useActiveCompanyStore()
const { isTechnicien } = usePermissions()
const toast = useToast()

const formData = ref<Partial<Company>>({
  name: '',
  email: '',
  phone: '',
  address: '',
  isActive: true,
  subscription: 'freemium',
})

async function handleSubmit() {
  try {
    const created = await companyStore.createCompany(formData.value)
    // Le technicien bascule automatiquement sur la nouvelle entreprise creee.
    if (isTechnicien.value && created?.id) {
      await activeCompanyStore.selectCompany(created.id, created.name)
    }
    toast.success(t('common.success'), t('companies.createdSuccess'))
    router.push({ name: 'rfid-companies' })
  } catch (error: any) {
    toast.error(t('common.error'), extractApiErrorMessage(error, t('companies.createError')))
  }
}

function handleCancel() {
  router.push({ name: 'rfid-companies' })
}
</script>

<template>
  <div>
    <div class="mb-6">
      <AppButton variant="outline" size="sm" @click="handleCancel">
        <ArrowLeftIcon class="h-4 w-4 mr-2 inline" />
        {{ t('common.back') }}
      </AppButton>
    </div>

    <AppCard>
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">{{ t('companies.create') }}</h1>
        <p class="mt-1 text-sm text-gray-500">
          {{ t('companies.createSubtitle') }}
        </p>
      </div>

      <CompanyForm
        v-model="formData"
        :loading="companyStore.isLoading"
        @submit="handleSubmit"
      />

      <div class="mt-6 flex justify-end gap-3">
        <AppButton variant="outline" @click="handleCancel" :disabled="companyStore.isLoading">
          {{ t('common.cancel') }}
        </AppButton>
        <AppButton
          :loading="companyStore.isLoading"
          @click="handleSubmit"
        >
          {{ t('companies.create') }}
        </AppButton>
      </div>
    </AppCard>
  </div>
</template>
