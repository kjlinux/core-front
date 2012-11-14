<script setup lang="ts">
import { onMounted, computed, h } from 'vue'
import { useRouter } from 'vue-router'
import { useCompanyStore } from '@/stores/company.store'
import { usePermissions } from '@/composables/usePermissions'
import type { Company } from '@/types'
import type { TableColumn } from '@/types/common'
import DataTable from '@/components/data-display/DataTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import { EyeIcon, PencilIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const companyStore = useCompanyStore()
const { isSuperAdmin } = usePermissions()

onMounted(() => {
  companyStore.fetchCompanies()
})

const columns = computed<TableColumn[]>(() => [
  {
    key: 'name',
    label: 'Nom',
    sortable: true,
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
  },
  {
    key: 'phone',
    label: 'Téléphone',
    sortable: false,
  },
  {
    key: 'status',
    label: 'Statut',
    sortable: true,
  },
  {
    key: 'employeeCount',
    label: 'Employés',
    sortable: true,
    align: 'center' as const,
  },
  {
    key: 'actions',
    label: 'Actions',
    sortable: false,
    align: 'right' as const,
    width: '150px',
  },
])

const tableData = computed(() => {
  return companyStore.companies.map((company) => ({
    id: company.id,
    name: company.name,
    email: company.email,
    phone: company.phone,
    status: getStatusBadge(company),
    employeeCount: company.employeeCount,
    actions: getActionButtons(company),
  }))
})

function getStatusBadge(company: Company): string {
  return company.isActive ? 'Actif' : 'Inactif'
}

function getActionButtons(company: Company): string {
  const actions = []
  actions.push('Voir')
  if (isSuperAdmin.value) {
    actions.push('Modifier')
  }
  return actions.join(' | ')
}

function handleRowClick(row: any) {
  router.push({ name: 'rfid-company-detail', params: { id: row.id } })
}

function handleCreateCompany() {
  router.push({ name: 'rfid-company-create' })
}

function handleViewCompany(id: string) {
  router.push({ name: 'rfid-company-detail', params: { id } })
}

function handleEditCompany(id: string) {
  router.push({ name: 'rfid-company-edit', params: { id } })
}

function handlePageChange(page: number) {
  companyStore.fetchCompanies({ page })
}

function handleSort(column: string, direction: 'asc' | 'desc') {
  companyStore.fetchCompanies({ sortBy: column, sortOrder: direction })
}
</script>

<template>
  <div>
    <AppCard>
      <template #actions>
        <AppButton v-if="isSuperAdmin" @click="handleCreateCompany">
          Nouvelle entreprise
        </AppButton>
      </template>

      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Entreprises</h1>
      </div>

      <div v-if="companyStore.isLoading" class="flex justify-center py-12">
        <div class="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
      </div>

      <div v-else>
        <div class="overflow-hidden rounded-lg border border-gray-200">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Nom
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Email
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Téléphone
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Statut
                </th>
                <th class="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  Employés
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr
                v-for="company in companyStore.companies"
                :key="company.id"
                class="cursor-pointer hover:bg-gray-50 transition-colors"
                @click="handleRowClick({ id: company.id })"
              >
                <td class="whitespace-nowrap px-6 py-4">
                  <div class="text-sm font-medium text-gray-900">{{ company.name }}</div>
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {{ company.email }}
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {{ company.phone }}
                </td>
                <td class="whitespace-nowrap px-6 py-4">
                  <AppBadge :variant="company.isActive ? 'success' : 'neutral'">
                    {{ company.isActive ? 'Actif' : 'Inactif' }}
                  </AppBadge>
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-900">
                  {{ company.employeeCount }}
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <button
                    @click.stop="handleViewCompany(company.id)"
                    class="text-blue-600 hover:text-blue-900 mr-3"
                    title="Voir"
                  >
                    <EyeIcon class="h-5 w-5 inline" />
                  </button>
                  <button
                    v-if="isSuperAdmin"
                    @click.stop="handleEditCompany(company.id)"
                    class="text-gray-600 hover:text-gray-900"
                    title="Modifier"
                  >
                    <PencilIcon class="h-5 w-5 inline" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="companyStore.companies.length === 0" class="py-12 text-center">
          <div class="text-gray-500">
            <svg
              class="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <p class="mt-2 text-sm font-medium">Aucune entreprise disponible</p>
          </div>
        </div>
      </div>
    </AppCard>
  </div>
</template>
