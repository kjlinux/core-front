<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'
import { useCompanyStore } from '@/stores/company.store'
import { usePermissions } from '@/composables/usePermissions'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const companyStore = useCompanyStore()
const permissions = usePermissions()
const toast = useToast()

const showDeactivateDialog = ref(false)

const company = computed(() => companyStore.currentCompany)

const form = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
})

const subscriptionLabels = computed<Record<string, string>>(() => ({
  basic: t('companies.subscription.basic'),
  premium: t('companies.subscription.premium'),
  enterprise: t('companies.subscription.enterprise'),
}))

const subscriptionVariants: Record<string, string> = {
  basic: 'neutral',
  premium: 'info',
  enterprise: 'success',
}

async function saveSettings() {
  if (!company.value) return
  try {
    await companyStore.updateCompany(company.value.id, form.value)
    toast.showSuccess(t('parametres.settingsSaved'))
  } catch {
    toast.showError(t('parametres.settingsSaveError'))
  }
}

function handleDeactivate() {
  toast.showSuccess(t('parametres.companySaved'))
  showDeactivateDialog.value = false
}

onMounted(async () => {
  await companyStore.fetchCompanies()
  const userCompanyId = authStore.user?.companyId
  if (userCompanyId) {
    await companyStore.fetchCompany(userCompanyId)
  } else if (companyStore.companies.length > 0) {
    await companyStore.fetchCompany(companyStore.companies[0]!.id)
  }
  if (company.value) {
    form.value.name = company.value.name
    form.value.email = company.value.email ?? ''
    form.value.phone = company.value.phone ?? ''
    form.value.address = company.value.address ?? ''
  }
})
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">{{ t('parametres.companyTitle') }}</h1>

    <div v-if="companyStore.isLoading" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>

    <template v-else-if="company">
      <AppCard :title="t('parametres.generalInfo')">
        <div class="space-y-4 max-w-lg">
          <AppInput v-model="form.name" :label="t('parametres.companyName')" />
          <AppInput v-model="form.email" :label="t('common.email')" type="email" />
          <AppInput v-model="form.phone" :label="t('common.phone')" type="tel" />
          <AppInput v-model="form.address" :label="t('sites.address')" />

          <div>
            <p class="text-sm font-medium text-gray-700 mb-1">{{ t('parametres.subscription') }}</p>
            <AppBadge :variant="(subscriptionVariants[company.subscription] ?? 'neutral') as any">
              {{ subscriptionLabels[company.subscription] ?? company.subscription }}
            </AppBadge>
            <p class="text-xs text-gray-400 mt-1">{{ t('parametres.subscriptionNote') }}</p>
          </div>

          <AppButton variant="primary" @click="saveSettings">{{ t('common.save') }}</AppButton>
        </div>
      </AppCard>

      <AppCard :title="t('parametres.activeSites')">
        <div v-if="company.sites && company.sites.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('parametres.siteName') }}</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('sites.address') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="site in company.sites" :key="site.id" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ site.name }}</td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ site.address ?? '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-sm text-gray-500 py-4">
          {{ t('parametres.noSite') }}
          <router-link to="/pointage-rfid/sites" class="text-primary underline ml-1">{{ t('parametres.manageSites') }}</router-link>
        </div>
      </AppCard>

      <AppCard v-if="permissions.isSuperAdmin.value" :title="t('parametres.dangerZone')" class="border-red-200">
        <p class="text-sm text-gray-600 mb-4">
          {{ t('parametres.dangerZoneNote') }}
        </p>
        <AppButton variant="danger" @click="showDeactivateDialog = true">
          {{ t('parametres.deactivateCompany') }}
        </AppButton>
      </AppCard>
    </template>

    <div v-else class="text-center py-12 text-gray-500">
      {{ t('parametres.noCompany') }}
    </div>

    <AppConfirmDialog
      :open="showDeactivateDialog"
      @cancel="showDeactivateDialog = false"
      :title="t('parametres.deactivateTitle')"
      :message="t('parametres.deactivateConfirm')"
      @confirm="handleDeactivate"
    />
  </div>
</template>
