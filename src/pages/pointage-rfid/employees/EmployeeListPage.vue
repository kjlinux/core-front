<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEmployeeStore } from '@/stores/employee.store'
import { useCompanyStore } from '@/stores/company.store'
import { useSiteStore } from '@/stores/site.store'
import { useDepartmentStore } from '@/stores/department.store'
import { usePermissions } from '@/composables/usePermissions'
import { useToast } from '@/composables/useToast'
import DataTable from '@/components/data-display/DataTable.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import type { TableColumn } from '@/types/common'
import type { Employee } from '@/types'
import { EyeIcon, PlusIcon, ArrowsRightLeftIcon } from '@heroicons/vue/24/outline'
import type { EmployeeFilters } from '@/services/api/employee.api'

const router = useRouter()
const employeeStore = useEmployeeStore()
const companyStore = useCompanyStore()
const siteStore = useSiteStore()
const departmentStore = useDepartmentStore()
const permissions = usePermissions()
const toast = useToast()

const canCreate = computed(() => permissions.isAdminOrSuperOrTech.value)
const canEdit = computed(() => permissions.isAdminOrSuperOrTech.value)

// Modal transfert site/département
const showTransferModal = ref(false)
const transferEmployee = ref<Employee | null>(null)
const transferForm = ref({ siteId: '', departmentId: '' })
const isTransferring = ref(false)

const transferSiteOptions = computed(() => {
  if (!transferEmployee.value) return []
  const sites = transferEmployee.value.companyId
    ? siteStore.sites.filter(s => s.companyId === transferEmployee.value!.companyId)
    : siteStore.sites
  return sites.map(s => ({ value: s.id, label: s.name }))
})

const transferDeptOptions = computed(() => {
  if (!transferForm.value.siteId) return []
  return departmentStore.departments
    .filter(d => d.siteId === transferForm.value.siteId)
    .map(d => ({ value: d.id, label: d.name }))
})

function openTransferModal(employee: Employee) {
  transferEmployee.value = employee
  transferForm.value = { siteId: employee.siteId ?? '', departmentId: employee.departmentId ?? '' }
  showTransferModal.value = true
}

function onTransferSiteChange() {
  transferForm.value.departmentId = ''
}

async function handleTransfer() {
  if (!transferEmployee.value) return
  if (!transferForm.value.siteId) {
    toast.showError('Veuillez selectionner un site')
    return
  }
  if (!transferForm.value.departmentId) {
    toast.showError('Veuillez selectionner un departement')
    return
  }
  isTransferring.value = true
  try {
    await employeeStore.updateEmployee(transferEmployee.value.id, {
      siteId: transferForm.value.siteId,
      departmentId: transferForm.value.departmentId,
    })
    toast.showSuccess('Employe transfere avec succes')
    showTransferModal.value = false
    loadEmployees()
  } catch {
    toast.showError('Erreur lors du transfert')
  } finally {
    isTransferring.value = false
  }
}

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
  { key: 'site', label: 'Site', sortable: false },
  { key: 'department', label: 'Departement', sortable: false },
  { key: 'status', label: 'Statut', sortable: false, align: 'center' as const },
  { key: 'actions', label: 'Actions', sortable: false, align: 'right' as const, width: '100px' },
]

const tableData = computed(() =>
  employeeStore.employees.map(e => {
    const site = siteStore.sites.find(s => s.id === e.siteId)
    const dept = departmentStore.departments.find(d => d.id === e.departmentId)
    return {
      id: e.id,
      fullName: `${e.firstName} ${e.lastName}`,
      employeeNumber: e.employeeNumber,
      position: e.position || '-',
      site: site?.name || '-',
      department: dept?.name || '-',
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
          <div class="flex justify-end gap-2">
            <button
              v-if="canEdit"
              @click.stop="openTransferModal(row._raw)"
              class="text-gray-500 hover:text-primary"
              title="Changer site / departement"
            >
              <ArrowsRightLeftIcon class="h-5 w-5" />
            </button>
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

    <!-- Modal transfert site / departement -->
    <AppModal
      :is-open="showTransferModal"
      title="Changer site et departement"
      size="md"
      @close="showTransferModal = false"
    >
      <div v-if="transferEmployee" class="space-y-4">
        <p class="text-sm text-gray-600">
          Employe : <span class="font-semibold text-gray-900">{{ transferEmployee.firstName }} {{ transferEmployee.lastName }}</span>
        </p>

        <AppSelect
          v-model="transferForm.siteId"
          label="Site"
          :options="transferSiteOptions"
          placeholder="Selectionner un site"
          @update:model-value="onTransferSiteChange"
        />

        <AppSelect
          v-model="transferForm.departmentId"
          label="Departement"
          :options="transferDeptOptions"
          placeholder="Selectionner un departement"
          :disabled="!transferForm.siteId || transferDeptOptions.length === 0"
        />

        <p v-if="transferForm.siteId && transferDeptOptions.length === 0" class="text-xs text-amber-600">
          Aucun departement disponible pour ce site.
        </p>
      </div>

      <template #footer>
        <AppButton variant="outline" @click="showTransferModal = false">Annuler</AppButton>
        <AppButton
          variant="primary"
          :loading="isTransferring"
          :disabled="!transferForm.siteId || !transferForm.departmentId"
          @click="handleTransfer"
        >
          Confirmer le transfert
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>
