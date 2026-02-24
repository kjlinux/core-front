<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCompanyStore } from '@/stores/company.store'
import { usePermissions } from '@/composables/usePermissions'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import { ArrowLeftIcon, PencilIcon, BuildingOfficeIcon, MapPinIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const companyStore = useCompanyStore()
const { isSuperAdmin } = usePermissions()
const toast = useToast()

const companyId = computed(() => route.params.id as string)
const company = computed(() => companyStore.currentCompany)

const totalSites = computed(() => company.value?.sites?.length || 0)
const totalDepartments = computed(() => {
  return company.value?.sites?.reduce((total, site) => total + (site.departments?.length || 0), 0) || 0
})

const subscriptionBadgeVariant = computed(() => {
  const subscription = company.value?.subscription
  if (subscription === 'enterprise') return 'info'
  if (subscription === 'premium') return 'warning'
  return 'neutral'
})

const subscriptionLabel = computed(() => {
  const subscription = company.value?.subscription
  if (subscription === 'enterprise') return 'Enterprise'
  if (subscription === 'premium') return 'Premium'
  return 'Basic'
})

onMounted(async () => {
  try {
    await companyStore.fetchCompany(companyId.value)
  } catch (error: any) {
    toast.error('Erreur', error.message || 'Erreur lors du chargement de l\'entreprise')
    router.push({ name: 'rfid-companies' })
  }
})

function handleBack() {
  router.push({ name: 'rfid-companies' })
}

function handleEdit() {
  router.push({ name: 'rfid-company-edit', params: { id: companyId.value } })
}

function viewSite(siteId: string) {
  router.push({ name: 'rfid-site-detail', params: { id: siteId } })
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <AppButton variant="outline" size="sm" @click="handleBack">
        <ArrowLeftIcon class="h-4 w-4 mr-2 inline" />
        Retour
      </AppButton>
      <AppButton v-if="isSuperAdmin && company" variant="primary" @click="handleEdit">
        <PencilIcon class="h-4 w-4 mr-2 inline" />
        Modifier
      </AppButton>
    </div>

    <div v-if="companyStore.isLoading" class="flex justify-center py-12">
      <div class="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
    </div>

    <div v-else-if="company" class="space-y-6">
      <!-- Company Header -->
      <AppCard>
        <div class="flex items-start justify-between">
          <div class="flex items-start gap-6">
            <div v-if="company.logo" class="flex-shrink-0">
              <img :src="company.logo" :alt="company.name" class="h-20 w-20 rounded-lg object-cover" />
            </div>
            <div v-else class="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
              <BuildingOfficeIcon class="h-10 w-10 text-gray-400" />
            </div>
            <div>
              <h1 class="text-3xl font-bold text-gray-900">{{ company.name }}</h1>
              <div class="mt-2 flex items-center gap-3">
                <AppBadge :variant="company.isActive ? 'success' : 'neutral'">
                  {{ company.isActive ? 'Actif' : 'Inactif' }}
                </AppBadge>
                <AppBadge :variant="subscriptionBadgeVariant">
                  {{ subscriptionLabel }}
                </AppBadge>
              </div>
            </div>
          </div>
        </div>
      </AppCard>

      <!-- Contact Information -->
      <AppCard title="Informations de contact">
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div class="flex items-start gap-3">
            <EnvelopeIcon class="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <div class="text-sm font-medium text-gray-500">Email</div>
              <div class="mt-1 text-sm text-gray-900">
                <a :href="`mailto:${company.email}`" class="hover:text-blue-600">
                  {{ company.email }}
                </a>
              </div>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <PhoneIcon class="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <div class="text-sm font-medium text-gray-500">Téléphone</div>
              <div class="mt-1 text-sm text-gray-900">
                <a :href="`tel:${company.phone}`" class="hover:text-blue-600">
                  {{ company.phone }}
                </a>
              </div>
            </div>
          </div>

          <div class="flex items-start gap-3 md:col-span-2">
            <MapPinIcon class="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <div class="text-sm font-medium text-gray-500">Adresse</div>
              <div class="mt-1 text-sm text-gray-900">{{ company.address }}</div>
            </div>
          </div>
        </div>
      </AppCard>

      <!-- Statistics -->
      <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
        <AppCard>
          <div class="text-center">
            <div class="text-3xl font-bold text-gray-900">{{ totalSites }}</div>
            <div class="mt-1 text-sm text-gray-500">Sites</div>
          </div>
        </AppCard>

        <AppCard>
          <div class="text-center">
            <div class="text-3xl font-bold text-gray-900">{{ totalDepartments }}</div>
            <div class="mt-1 text-sm text-gray-500">Départements</div>
          </div>
        </AppCard>

        <AppCard>
          <div class="text-center">
            <div class="text-3xl font-bold text-gray-900">{{ company.employeeCount }}</div>
            <div class="mt-1 text-sm text-gray-500">Employés</div>
          </div>
        </AppCard>
      </div>

      <!-- Sites List -->
      <AppCard title="Sites" :subtitle="`${totalSites} site(s) associé(s)`">
        <div v-if="company.sites && company.sites.length > 0" class="divide-y divide-gray-200">
          <div
            v-for="site in company.sites"
            :key="site.id"
            class="flex items-center justify-between py-4 hover:bg-gray-50 px-4 -mx-4 cursor-pointer transition-colors"
            @click="viewSite(site.id)"
          >
            <div>
              <div class="font-medium text-gray-900">{{ site.name }}</div>
              <div class="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <MapPinIcon class="h-4 w-4" />
                {{ site.address }}
              </div>
            </div>
            <div class="text-sm text-gray-500">
              {{ site.departments?.length || 0 }} département(s)
            </div>
          </div>
        </div>
        <div v-else class="py-12 text-center text-gray-500">
          <BuildingOfficeIcon class="mx-auto h-12 w-12 text-gray-400" />
          <p class="mt-2 text-sm">Aucun site associé</p>
        </div>
      </AppCard>

      <!-- Metadata -->
      <AppCard title="Informations système">
        <div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div>
            <span class="font-medium text-gray-500">Créé le:</span>
            <span class="ml-2 text-gray-900">
              {{ new Date(company.createdAt).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) }}
            </span>
          </div>
          <div>
            <span class="font-medium text-gray-500">Dernière modification:</span>
            <span class="ml-2 text-gray-900">
              {{ new Date(company.updatedAt).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) }}
            </span>
          </div>
        </div>
      </AppCard>
    </div>

    <div v-else class="py-12 text-center">
      <div class="text-gray-500">
        <BuildingOfficeIcon class="mx-auto h-12 w-12 text-gray-400" />
        <p class="mt-2 text-sm font-medium">Entreprise introuvable</p>
      </div>
    </div>
  </div>
</template>
