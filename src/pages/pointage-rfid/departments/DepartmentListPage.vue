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
      >
        <template #actions="{ row }">
          <div class="flex items-center justify-end gap-2">
            <button
              @click.stop="openEditModal(row._raw)"
              class="text-gray-600 hover:text-gray-900"
              title="Modifier"
            >
              <PencilIcon class="h-5 w-5" />
            </button>
            <button
              @click.stop="handleDeleteDepartment(row._raw)"
              class="text-red-600 hover:text-red-900"
              title="Supprimer"
            >
              <TrashIcon class="h-5 w-5" />
            </button>
          </div>
        </template>
      </DataTable>
    </AppCard>

    <AppModal
      :is-open="showCreateModal"
      title="Nouveau Departement"
      size="lg"
      @close="closeCreateModal"
    >
      <form id="dept-list-form" @submit.prevent="handleCreateDepartment">
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
      </form>

      <template #footer>
        <AppButton
          variant="outline"
          @click="closeCreateModal"
        >
          Annuler
        </AppButton>
        <AppButton
          form="dept-list-form"
          type="submit"
          variant="primary"
          :loading="isSubmitting"
        >
          Creer
        </AppButton>
      </template>
    </AppModal>

    <AppModal
      :is-open="showEditModal"
      title="Modifier le Departement"
      size="lg"
      @close="closeEditModal"
    >
      <form id="dept-edit-form" @submit.prevent="handleEditDepartment">
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
      </form>

      <template #footer>
        <AppButton
          variant="outline"
          @click="closeEditModal"
        >
          Annuler
        </AppButton>
        <AppButton
          form="dept-edit-form"
          type="submit"
          variant="primary"
          :loading="isSubmitting"
        >
          Enregistrer
        </AppButton>
      </template>
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
import type { Department } from '@/types'
import { useToast } from '@/composables/useToast'
import { PencilIcon, TrashIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const departmentStore = useDepartmentStore()
const companyStore = useCompanyStore()
const siteStore = useSiteStore()
const permissions = usePermissions()
const toast = useToast()

const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingDept = ref<Department | null>(null)
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

const columns = computed<TableColumn[]>(() => {
  const cols: TableColumn[] = [
    { key: 'name', label: 'Nom', sortable: true },
    { key: 'siteName', label: 'Site', sortable: true },
    { key: 'companyName', label: 'Entreprise', sortable: true },
    { key: 'manager', label: 'Manager', sortable: false },
    { key: 'employeeCount', label: 'Employes', align: 'center' as const },
  ]
  if (canCreate.value) {
    cols.push({ key: 'actions', label: 'Actions', align: 'right' as const, width: '120px' })
  }
  return cols
})

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
      _raw: dept,
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
    })
    toast.success('Succes', 'Departement cree avec succes')
    closeCreateModal()
    await departmentStore.fetchDepartments(filters.value)
  } catch (error: any) {
    toast.error('Erreur', error.message || 'Erreur lors de la creation du departement')
  } finally {
    isSubmitting.value = false
  }
}

function openEditModal(dept: Department) {
  editingDept.value = dept
  formData.value = {
    name: dept.name,
    companyId: dept.companyId,
    siteId: dept.siteId,
    managerId: dept.managerId || '',
  }
  showEditModal.value = true
}

async function handleEditDepartment() {
  if (!editingDept.value) return
  isSubmitting.value = true
  try {
    await departmentStore.updateDepartment(editingDept.value.id, {
      name: formData.value.name,
      siteId: formData.value.siteId,
      companyId: formData.value.companyId,
      managerId: formData.value.managerId || undefined,
    })
    toast.success('Succes', 'Departement modifie avec succes')
    closeEditModal()
    await departmentStore.fetchDepartments(filters.value)
  } catch (error: any) {
    toast.error('Erreur', error.message || 'Erreur lors de la modification du departement')
  } finally {
    isSubmitting.value = false
  }
}

async function handleDeleteDepartment(dept: Department) {
  if (!confirm(`Supprimer le departement "${dept.name}" ?`)) return
  try {
    await departmentStore.deleteDepartment(dept.id)
    toast.success('Succes', 'Departement supprime avec succes')
    await departmentStore.fetchDepartments(filters.value)
  } catch (error: any) {
    toast.error('Erreur', error.message || 'Erreur lors de la suppression du departement')
  }
}

function closeCreateModal() {
  showCreateModal.value = false
  formData.value = { name: '', companyId: '', siteId: '', managerId: '' }
}

function closeEditModal() {
  showEditModal.value = false
  editingDept.value = null
  formData.value = { name: '', companyId: '', siteId: '', managerId: '' }
}
</script>
