<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Departements</h1>
      <AppButton
        v-if="canCreate"
        variant="primary"
        @click="showCreateModal = true"
      >
        Nouveau Departement
      </AppButton>
    </div>

    <AppCard class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AppSelect
          v-model="filters.companyId"
          :options="companyOptions"
          label="Entreprise"
          placeholder="Toutes les entreprises"
          @update:model-value="handleCompanyFilterChange"
        />

        <AppSelect
          v-model="filters.siteId"
          :options="siteOptions"
          label="Site"
          placeholder="Tous les sites"
          @update:model-value="handleFilterChange"
        />
      </div>
    </AppCard>

    <AppCard>
      <DataTable
        :columns="columns"
        :data="tableData"
        :loading="departmentStore.isLoading"
        :pagination="departmentStore.pagination"
        @row-click="handleRowClick"
        @page-change="handlePageChange"
      />
    </AppCard>

    <AppModal
      :is-open="showCreateModal"
      title="Nouveau Departement"
      size="lg"
      @close="closeCreateModal"
    >
      <form @submit.prevent="handleCreateDepartment">
        <div class="space-y-4">
          <AppInput
            v-model="formData.name"
            label="Nom"
            placeholder="Nom du departement"
            required
          />

          <AppSelect
            v-model="formData.companyId"
            :options="companyOptions"
            label="Entreprise"
            placeholder="Selectionner une entreprise"
            required
            @update:model-value="handleFormCompanyChange"
          />

          <AppSelect
            v-model="formData.siteId"
            :options="formSiteOptions"
            label="Site"
            placeholder="Selectionner un site"
            required
          />

          <AppSelect
            v-model="formData.managerId"
            :options="managerOptions"
            label="Manager"
            placeholder="Selectionner un manager"
          />
        </div>

        <template #footer>
          <AppButton
            variant="outline"
            @click="closeCreateModal"
          >
            Annuler
          </AppButton>
          <AppButton
            type="submit"
            variant="primary"
            :loading="isSubmitting"
          >
            Creer
          </AppButton>
        </template>
      </form>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDepartmentStore } from '@/stores/department.store'
import { useCompanyStore } from '@/stores/company.store'
import { useSiteStore } from '@/stores/site.store'
import { usePermissions } from '@/composables/usePermissions'
import DataTable from '@/components/data-display/DataTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import type { TableColumn } from '@/types/common'

const router = useRouter()
const departmentStore = useDepartmentStore()
const companyStore = useCompanyStore()
const siteStore = useSiteStore()
const permissions = usePermissions()

const showCreateModal = ref(false)
const isSubmitting = ref(false)

const filters = ref({
  companyId: '',
  siteId: '',
  page: 1,
  perPage: 10,
})

const formData = ref({
  name: '',
  companyId: '',
  siteId: '',
  managerId: '',
})

const canCreate = computed(() =>
  permissions.isSuperAdmin.value || permissions.isAdminEnterprise.value
)

const companyOptions = computed(() => [
  { value: '', label: 'Toutes les entreprises' },
  ...companyStore.companies.map(company => ({
    value: company.id,
    label: company.name,
  })),
])

const siteOptions = computed(() => {
  const sites = filters.value.companyId
    ? siteStore.sites.filter(s => s.companyId === filters.value.companyId)
    : siteStore.sites

  return [
    { value: '', label: 'Tous les sites' },
    ...sites.map(site => ({
      value: site.id,
      label: site.name,
    })),
  ]
})

const formSiteOptions = computed(() => {
  const sites = formData.value.companyId
    ? siteStore.sites.filter(s => s.companyId === formData.value.companyId)
    : []

  return [
    { value: '', label: 'Selectionner un site' },
    ...sites.map(site => ({
      value: site.id,
      label: site.name,
    })),
  ]
})

const managerOptions = computed(() => [
  { value: '', label: 'Aucun manager' },
])

const columns: TableColumn[] = [
  { key: 'name', label: 'Nom', sortable: true },
  { key: 'siteName', label: 'Site', sortable: true },
  { key: 'companyName', label: 'Entreprise', sortable: true },
  { key: 'manager', label: 'Manager', sortable: false },
  { key: 'employeeCount', label: 'Employes', align: 'center' as const },
]

const tableData = computed(() => {
  return departmentStore.departments.map(dept => {
    const site = siteStore.sites.find(s => s.id === dept.siteId)
    const company = companyStore.companies.find(c => c.id === dept.companyId)
    return {
      id: dept.id,
      name: dept.name,
      siteName: site?.name || '-',
      companyName: company?.name || '-',
      manager: dept.managerId ? 'Manager assigne' : '-',
      employeeCount: dept.employeeCount || 0,
    }
  })
})

onMounted(async () => {
  await Promise.all([
    companyStore.fetchCompanies({ perPage: 100 }),
    siteStore.fetchSites({ perPage: 100 }),
    departmentStore.fetchDepartments(filters.value),
  ])
})

function handleCompanyFilterChange() {
  filters.value.siteId = ''
  filters.value.page = 1
  departmentStore.fetchDepartments(filters.value)
}

function handleFilterChange() {
  filters.value.page = 1
  departmentStore.fetchDepartments(filters.value)
}

function handlePageChange(page: number) {
  filters.value.page = page
  departmentStore.fetchDepartments(filters.value)
}

function handleRowClick(row: any) {
  router.push({ name: 'rfid-department-detail', params: { id: row.id } })
}

function handleFormCompanyChange() {
  formData.value.siteId = ''
}

async function handleCreateDepartment() {
  isSubmitting.value = true
  try {
    await departmentStore.createDepartment({
      name: formData.value.name,
      siteId: formData.value.siteId,
      companyId: formData.value.companyId,
      managerId: formData.value.managerId || undefined,
      employeeCount: 0,
    })
    closeCreateModal()
    await departmentStore.fetchDepartments(filters.value)
  } catch (error) {
    console.error('Error creating department:', error)
  } finally {
    isSubmitting.value = false
  }
}

function closeCreateModal() {
  showCreateModal.value = false
  formData.value = {
    name: '',
    companyId: '',
    siteId: '',
    managerId: '',
  }
}
</script>
