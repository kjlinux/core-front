<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'
import { useCompanyStore } from '@/stores/company.store'
import { useActiveCompanyStore } from '@/stores/active-company.store'
import { usePermissions } from '@/composables/usePermissions'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'

const { t } = useI18n()
const authStore = useAuthStore()
const companyStore = useCompanyStore()
const activeCompanyStore = useActiveCompanyStore()
const permissions = usePermissions()
const toast = useToast()

const showDeactivateDialog = ref(false)

const company = computed(() => companyStore.currentCompany)

// super_admin et technicien n'ont pas de company_id fixe : ils choisissent l'entreprise
// a gerer via un selecteur. admin_enterprise est verrouille sur sa propre entreprise.
const needsCompanySelector = permissions.isSetupRole
const selectedCompanyId = ref('')
const currentCompanyId = computed(
  () => authStore.user?.companyId || selectedCompanyId.value || '',
)

const companyOptions = computed(() => [
  { label: t('parametres.selectCompanyPlaceholder'), value: '' },
  ...companyStore.companies.map((c) => ({ label: c.name, value: c.id })),
])

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

async function handleDeactivate() {
  if (!company.value) return
  try {
    await companyStore.toggleActive(company.value.id)
    toast.showSuccess(t('parametres.companySaved'))
  } catch {
    toast.showError(t('parametres.settingsSaveError'))
  } finally {
    showDeactivateDialog.value = false
  }
}

function fillForm() {
  if (company.value) {
    form.value.name = company.value.name
    form.value.email = company.value.email ?? ''
    form.value.phone = company.value.phone ?? ''
    form.value.address = company.value.address ?? ''
  }
}

async function loadCompany() {
  if (!currentCompanyId.value) {
    companyStore.currentCompany = null
    return
  }
  await companyStore.fetchCompany(currentCompanyId.value)
  fillForm()
}

watch(currentCompanyId, loadCompany)

onMounted(async () => {
  await companyStore.fetchCompanies({ perPage: 200 })
  // Technicien : pre-selectionner l'entreprise active choisie a la connexion.
  if (permissions.isTechnicien.value && !selectedCompanyId.value && activeCompanyStore.activeCompanyId) {
    selectedCompanyId.value = activeCompanyStore.activeCompanyId
  }
  await loadCompany()
})
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">{{ t('parametres.companyTitle') }}</h1>

    <!-- Selecteur entreprise (super_admin / technicien) -->
    <AppCard v-if="needsCompanySelector">
      <label class="mb-1 block text-sm font-medium text-gray-700">
        {{ t('parametres.companySelectorLabel') }}
      </label>
      <AppSelect v-model="selectedCompanyId" :options="companyOptions" />
    </AppCard>

    <div
      v-if="needsCompanySelector && !currentCompanyId"
      class="rounded-lg border border-dashed border-gray-300 py-12 text-center text-sm text-gray-500"
    >
      {{ t('parametres.selectCompanyPrompt') }}
    </div>

    <div v-else-if="companyStore.isLoading" class="flex justify-center py-12">
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
          <router-link to="/organisation/sites" class="text-primary underline ml-1">{{ t('parametres.manageSites') }}</router-link>
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
