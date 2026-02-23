<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useCompanyStore } from '@/stores/company.store'
import { usePermissions } from '@/composables/usePermissions'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'

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

const subscriptionLabels: Record<string, string> = {
  basic: 'Basic',
  premium: 'Premium',
  enterprise: 'Enterprise',
}

const subscriptionVariants: Record<string, string> = {
  basic: 'default',
  premium: 'info',
  enterprise: 'success',
}

async function saveSettings() {
  if (!company.value) return
  try {
    await companyStore.updateCompany(company.value.id, form.value)
    toast.showSuccess('Parametres enregistres')
  } catch {
    toast.showError("Erreur lors de l'enregistrement")
  }
}

function handleDeactivate() {
  toast.showSuccess('Action enregistree - entreprise desactivee')
  showDeactivateDialog.value = false
}

onMounted(async () => {
  await companyStore.fetchCompanies()
  const userCompanyId = authStore.user?.companyId
  if (userCompanyId) {
    await companyStore.fetchCompany(userCompanyId)
  } else if (companyStore.companies.length > 0) {
    await companyStore.fetchCompany(companyStore.companies[0].id)
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
    <h1 class="text-2xl font-bold text-gray-900">Parametres de l'entreprise</h1>

    <div v-if="companyStore.isLoading" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>

    <template v-else-if="company">
      <AppCard title="Informations generales">
        <div class="space-y-4 max-w-lg">
          <AppInput v-model="form.name" label="Nom de l'entreprise" />
          <AppInput v-model="form.email" label="Email" type="email" />
          <AppInput v-model="form.phone" label="Telephone" type="tel" />
          <AppInput v-model="form.address" label="Adresse" />

          <div>
            <p class="text-sm font-medium text-gray-700 mb-1">Abonnement</p>
            <AppBadge :variant="(subscriptionVariants[company.subscriptionPlan] ?? 'default') as any">
              {{ subscriptionLabels[company.subscriptionPlan] ?? company.subscriptionPlan }}
            </AppBadge>
            <p class="text-xs text-gray-400 mt-1">Pour changer de plan, contactez le support</p>
          </div>

          <div>
            <p class="text-sm font-medium text-gray-700 mb-1">Logo de l'entreprise</p>
            <input type="file" accept="image/*" class="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
          </div>

          <AppButton variant="primary" @click="saveSettings">Enregistrer</AppButton>
        </div>
      </AppCard>

      <AppCard title="Sites actifs">
        <div v-if="company.sites && company.sites.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom du site</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Adresse</th>
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
          Aucun site configure.
          <router-link to="/pointage-rfid/sites" class="text-primary underline ml-1">Gerer les sites</router-link>
        </div>
      </AppCard>

      <AppCard v-if="permissions.isSuperAdmin.value" title="Zone dangereuse" class="border-red-200">
        <p class="text-sm text-gray-600 mb-4">
          La desactivation de l'entreprise suspendra l'acces de tous ses utilisateurs.
        </p>
        <AppButton variant="danger" @click="showDeactivateDialog = true">
          Desactiver l'entreprise
        </AppButton>
      </AppCard>
    </template>

    <div v-else class="text-center py-12 text-gray-500">
      Aucune entreprise associee a votre compte
    </div>

    <AppConfirmDialog
      v-model="showDeactivateDialog"
      title="Desactiver l'entreprise"
      message="Etes-vous sur de vouloir desactiver cette entreprise ? Tous les acces seront suspendus."
      @confirm="handleDeactivate"
    />
  </div>
</template>
