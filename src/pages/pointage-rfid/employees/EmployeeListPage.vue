<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEmployeeStore } from '@/stores/employee.store'
import { useCompanyStore } from '@/stores/company.store'
import { useSiteStore } from '@/stores/site.store'
import { useDepartmentStore } from '@/stores/department.store'
import { usePermissions } from '@/composables/usePermissions'
import DataTable from '@/components/data-display/DataTable.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import type { TableColumn } from '@/types/common'
import { EyeIcon, PlusIcon } from '@heroicons/vue/24/outline'
import type { EmployeeFilters } from '@/services/api/employee.api'

const router = useRouter()
const employeeStore = useEmployeeStore()
const companyStore = useCompanyStore()
const siteStore = useSiteStore()
const departmentStore = useDepartmentStore()
const permissions = usePermissions()

const canCreate = computed(() => permissions.isSuperAdmin.value || permissions.isAdminEnterprise.value)

const filters = ref({
  companyId: '',
  siteId: '',
  departmentId: '',
  search: '',
  isActive: '' as '' | 'true' | 'false',
  page: 1,
  perPage: 15,
})

let searchTimeout: ReturnType<typeof setTimeout> | null = null

const companyOptions = computed(() => [
  { value: '', label: 'Toutes les entreprises' },
  ...companyStore.companies.map(c => ({ value: c.id, label: c.name })),
])

const siteOptions = computed(() => {
  const sites = filters.value.companyId
    ? siteStore.sites.filter(s => s.companyId === filters.value.companyId)
    : siteStore.sites
  return [
    { value: '', label: 'Tous les sites' },
    ...sites.map(s => ({ value: s.id, label: s.name })),
  ]
})

const departmentOptions = computed(() => {
  let depts = departmentStore.departments
  if (filters.value.siteId) {
    depts = depts.filter(d => d.siteId === filters.value.siteId)
  } else if (filters.value.companyId) {
    depts = depts.filter(d => d.companyId === filters.value.companyId)
  }
  return [
    { value: '', label: 'Tous les departements' },
    ...depts.map(d => ({ value: d.id, label: d.name })),
  ]
})

const statusOptions = [
  { value: '', label: 'Tous les statuts' },
  { value: 'true', label: 'Actif' },
  { value: 'false', label: 'Inactif' },
]

const columns: TableColumn[] = [
  { key: 'fullName', label: 'Nom', sortable: true },
  { key: 'employeeNumber', label: 'Matricule', sortable: true },
  { key: 'position', label: 'Poste', sortable: false },
  { key: 'company', label: 'Entreprise', sortable: false },
  { key: 'status', label: 'Statut', sortable: false, align: 'center' as const },
  { key: 'actions', label: 'Actions', sortable: false, align: 'right' as const, width: '80px' },
]

const tableData = computed(() =>
  employeeStore.employees.map(e => {
    const company = companyStore.companies.find(c => c.id === e.companyId)
    return {
      id: e.id,
      fullName: `${e.firstName} ${e.lastName}`,
      employeeNumber: e.employeeNumber,
      position: e.position || '-',
      company: company?.name || '-',
      isActive: e.isActive,
      _raw: e,
    }
  })
)

function applyFilters() {
  filters.value.page = 1
  loadEmployees()
}

function handleCompanyChange() {
  filters.value.siteId = ''
  filters.value.departmentId = ''
  applyFilters()
}

function handleSiteChange() {
  filters.value.departmentId = ''
  applyFilters()
}

function handleSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(applyFilters, 400)
}

function handlePageChange(page: number) {
  filters.value.page = page
  loadEmployees()
}

function loadEmployees() {
  employeeStore.fetchEmployees({
    page: filters.value.page,
    perPage: filters.value.perPage,
    companyId: filters.value.companyId || undefined,
    siteId: filters.value.siteId || undefined,
    departmentId: filters.value.departmentId || undefined,
    search: filters.value.search || undefined,
    isActive: filters.value.isActive !== '' ? filters.value.isActive === 'true' : undefined,
  })
}

onMounted(async () => {
  await Promise.all([
    companyStore.fetchCompanies({ perPage: 100 }),
    siteStore.fetchSites({ perPage: 200 }),
    departmentStore.fetchDepartments({ perPage: 200 }),
  ])
  loadEmployees()
})
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Employes</h1>
      <AppButton
        v-if="canCreate"
        variant="primary"
        @click="router.push({ name: 'rfid-employee-create' })"
      >
        <PlusIcon class="w-4 h-4 mr-1" />
        Nouvel employe
      </AppButton>
    </div>

    <AppCard class="mb-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AppSelect
          v-model="filters.companyId"
          :options="companyOptions"
          label="Entreprise"
          @update:model-value="handleCompanyChange"
        />
        <AppSelect
          v-model="filters.siteId"
          :options="siteOptions"
          label="Site"
          @update:model-value="handleSiteChange"
        />
        <AppSelect
          v-model="filters.departmentId"
          :options="departmentOptions"
          label="Departement"
          @update:model-value="applyFilters"
        />
        <AppSelect
          v-model="filters.isActive"
          :options="statusOptions"
          label="Statut"
          @update:model-value="applyFilters"
        />
      </div>
      <div class="mt-4">
        <AppInput
          v-model="filters.search"
          placeholder="Rechercher par nom, email, matricule..."
          @update:model-value="handleSearchInput"
        />
      </div>
    </AppCard>

    <AppCard>
      <DataTable
        :columns="columns"
        :data="tableData"
        :loading="employeeStore.isLoading"
        :pagination="employeeStore.pagination"
        @row-click="(row) => router.push({ name: 'rfid-employee-detail', params: { id: row.id } })"
        @page-change="handlePageChange"
      >
        <template #status="{ row }">
          <AppBadge :variant="row.isActive ? 'success' : 'neutral'">
            {{ row.isActive ? 'Actif' : 'Inactif' }}
          </AppBadge>
        </template>

        <template #actions="{ row }">
          <div class="flex justify-end">
            <button
              @click.stop="router.push({ name: 'rfid-employee-detail', params: { id: row.id } })"
              class="text-gray-600 hover:text-gray-900"
              title="Voir"
            >
              <EyeIcon class="h-5 w-5" />
            </button>
          </div>
        </template>
      </DataTable>
    </AppCard>
  </div>
</template>
