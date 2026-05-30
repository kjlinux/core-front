<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('departments.title') }}</h1>
      <AppButton
        v-if="canCreate"
        variant="primary"
        @click="showCreateModal = true"
      >
        {{ t('departments.create') }}
      </AppButton>
    </div>

    <AppCard class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AppInput
          v-model="search"
          :placeholder="t('common.search') || 'Rechercher...'"
          :label="t('common.search') || 'Rechercher'"
        />
        <AppSelect
          v-model="filters.companyId"
          :options="companyOptions"
          :label="t('departments.company')"
          :placeholder="t('departments.allCompanies')"
          @update:model-value="handleCompanyFilterChange"
        />

        <AppSelect
          v-model="filters.siteId"
          :options="siteOptions"
          :label="t('departments.site')"
          :placeholder="t('departments.allSites')"
          @update:model-value="applyFilters"
        />
      </div>
    </AppCard>

    <AppCard>
      <DataTable
        :columns="columns"
        :data="tableData"
        :loading="departmentStore.isLoading"
        :pagination="departmentStore.pagination"
        default-sort-column="name"
        default-sort-direction="desc"
        @row-click="handleRowClick"
        @page-change="handlePageChange"
      >
        <template #actions="{ row }">
          <div class="flex items-center justify-end gap-2">
            <button
              @click.stop="openEditModal(row._raw)"
              class="text-gray-600 hover:text-gray-900"
              :title="t('common.edit')"
            >
              <PencilIcon class="h-5 w-5" />
            </button>
            <button
              @click.stop="handleDeleteDepartment(row._raw)"
              class="text-red-600 hover:text-red-900"
              :title="t('common.delete')"
            >
              <TrashIcon class="h-5 w-5" />
            </button>
          </div>
        </template>
      </DataTable>
    </AppCard>

    <AppModal
      :is-open="showCreateModal"
      :title="t('departments.create')"
      size="lg"
      @close="closeCreateModal"
    >
      <form id="dept-list-form" @submit.prevent="handleCreateDepartment">
        <div class="space-y-4">
          <FormRow :label="t('common.name')" :required="true" :error="deptErrors.name">
            <AppInput v-model="formData.name" :placeholder="t('common.name')" />
          </FormRow>

          <FormRow :label="t('departments.company')" :required="true" :error="deptErrors.companyId">
            <AppSelect v-model="formData.companyId" :options="companyOptions" :placeholder="t('departments.selectCompany')" @update:model-value="handleFormCompanyChange" />
          </FormRow>

          <FormRow :label="t('departments.site')" :required="true" :error="deptErrors.siteId">
            <AppSelect v-model="formData.siteId" :options="formSiteOptions" :placeholder="t('departments.selectSite')" />
          </FormRow>

          <FormRow :label="t('departments.manager')" :optional="true">
            <AppSelect v-model="formData.managerId" :options="managerOptions" :placeholder="t('departments.selectManager')" />
          </FormRow>
        </div>
      </form>

      <template #footer>
        <AppButton
          variant="outline"
          @click="closeCreateModal"
        >
          {{ t('common.cancel') }}
        </AppButton>
        <AppButton
          form="dept-list-form"
          type="submit"
          variant="primary"
          :loading="isSubmitting"
        >
          {{ t('common.create') }}
        </AppButton>
      </template>
    </AppModal>

    <AppModal
      :is-open="showEditModal"
      :title="t('departments.editTitle')"
      size="lg"
      @close="closeEditModal"
    >
      <form id="dept-edit-form" @submit.prevent="handleEditDepartment">
        <div class="space-y-4">
          <FormRow :label="t('common.name')" :required="true" :error="deptErrors.name">
            <AppInput v-model="formData.name" :placeholder="t('common.name')" />
          </FormRow>

          <FormRow :label="t('departments.company')" :required="true" :error="deptErrors.companyId">
            <AppSelect v-model="formData.companyId" :options="companyOptions" :placeholder="t('departments.selectCompany')" @update:model-value="handleFormCompanyChange" />
          </FormRow>

          <FormRow :label="t('departments.site')" :required="true" :error="deptErrors.siteId">
            <AppSelect v-model="formData.siteId" :options="formSiteOptions" :placeholder="t('departments.selectSite')" />
          </FormRow>

          <FormRow :label="t('departments.manager')" :optional="true">
            <AppSelect v-model="formData.managerId" :options="managerOptions" :placeholder="t('departments.selectManager')" />
          </FormRow>
        </div>
      </form>

      <template #footer>
        <AppButton
          variant="outline"
          @click="closeEditModal"
        >
          {{ t('common.cancel') }}
        </AppButton>
        <AppButton
          form="dept-edit-form"
          type="submit"
          variant="primary"
          :loading="isSubmitting"
        >
          {{ t('common.save') }}
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDepartmentStore } from '@/stores/department.store'
import { useCompanyStore } from '@/stores/company.store'
import { useSiteStore } from '@/stores/site.store'
import { usePermissions } from '@/composables/usePermissions'
import { useServerTable } from '@/composables/useServerTable'
import DataTable from '@/components/data-display/DataTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import FormRow from '@/components/forms/FormRow.vue'
import type { TableColumn } from '@/types/common'
import type { Department } from '@/types'
import { useToast } from '@/composables/useToast'
import { userApi, type UserData } from '@/services/api/user.api'
import { PencilIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { sortByRecent } from '@/utils/sort'
import { extractApiErrorMessage } from '@/utils/api-error'

const { t } = useI18n()
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
const deptErrors = ref<Record<string, string>>({})
const managers = ref<UserData[]>([])

const { filters, search, applyFilters, handlePageChange, reload } = useServerTable({
  initialFilters: { companyId: '', siteId: '' },
  perPage: 10,
  fetcher: (p) =>
    departmentStore.fetchDepartments({
      page: p.page,
      perPage: p.perPage,
      companyId: p.companyId || undefined,
      siteId: p.siteId || undefined,
      search: p.search || undefined,
    }),
})

const formData = ref({
  name: '',
  companyId: '',
  siteId: '',
  managerId: '',
})

const canCreate = computed(() =>
  permissions.isAdminOrSuperOrTech.value
)

const companyOptions = computed(() => [
  { value: '', label: t('departments.allCompanies') },
  ...companyStore.companies.map(company => ({
    value: company.id,
    label: company.name,
  })),
])

const siteOptions = computed(() => {
  const sites = filters.companyId
    ? siteStore.sites.filter(s => s.companyId === filters.companyId)
    : siteStore.sites

  return [
    { value: '', label: t('departments.allSites') },
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
    { value: '', label: t('departments.selectSite') },
    ...sites.map(site => ({
      value: site.id,
      label: site.name,
    })),
  ]
})

const managerOptions = computed(() => [
  { value: '', label: t('departments.selectManager') },
  ...managers.value.map((u) => ({
    value: u.id,
    label: `${u.firstName} ${u.lastName}`,
  })),
])

const columns = computed<TableColumn[]>(() => {
  const cols: TableColumn[] = [
    { key: 'name', label: t('common.name'), sortable: true },
    { key: 'siteName', label: t('departments.site'), sortable: true },
    { key: 'companyName', label: t('departments.company'), sortable: true },
    { key: 'manager', label: t('departments.manager'), sortable: false },
    { key: 'employeeCount', label: t('departments.employees'), align: 'center' as const },
  ]
  if (canCreate.value) {
    cols.push({ key: 'actions', label: t('common.actions'), align: 'right' as const, width: '120px' })
  }
  return cols
})

const tableData = computed(() =>
  sortByRecent(departmentStore.departments).map(dept => {
    const site = siteStore.sites.find(s => s.id === dept.siteId)
    const company = companyStore.companies.find(c => c.id === dept.companyId)
    return {
      id: dept.id,
      name: dept.name,
      siteName: site?.name || '-',
      companyName: company?.name || '-',
      manager: (() => {
        if (!dept.managerId) return '-'
        const m = managers.value.find((u) => u.id === dept.managerId)
        return m ? `${m.firstName} ${m.lastName}` : '-'
      })(),
      employeeCount: dept.employeeCount || 0,
      _raw: dept,
    }
  })
)

onMounted(async () => {
  const [, , users] = await Promise.all([
    companyStore.fetchCompanies({ perPage: 100 }),
    siteStore.fetchSites({ perPage: 100 }),
    userApi.getAll({ role: 'manager', perPage: 200 }),
  ])
  managers.value = users.data
  await reload()
})

function validateDeptForm(): boolean {
  deptErrors.value = {}
  if (!formData.value.name?.trim()) deptErrors.value.name = 'Le nom est requis'
  if (!formData.value.companyId) deptErrors.value.companyId = "L'entreprise est requise"
  if (!formData.value.siteId) deptErrors.value.siteId = 'Le site est requis'
  return Object.keys(deptErrors.value).length === 0
}

function handleCompanyFilterChange() {
  filters.siteId = ''
  applyFilters()
}

function handleRowClick(row: any) {
  router.push({ name: 'rfid-department-detail', params: { id: row.id } })
}

function handleFormCompanyChange() {
  formData.value.siteId = ''
}

async function handleCreateDepartment() {
  if (!validateDeptForm()) return
  isSubmitting.value = true
  try {
    await departmentStore.createDepartment({
      name: formData.value.name,
      siteId: formData.value.siteId,
      companyId: formData.value.companyId,
      managerId: formData.value.managerId || undefined,
    })
    toast.success(t('common.success'), t('departments.createdSuccess'))
    closeCreateModal()
    await reload()
  } catch (error: any) {
    toast.error(t('common.error'), extractApiErrorMessage(error, t('departments.createError')))
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
  if (!validateDeptForm()) return
  isSubmitting.value = true
  try {
    await departmentStore.updateDepartment(editingDept.value.id, {
      name: formData.value.name,
      siteId: formData.value.siteId,
      companyId: formData.value.companyId,
      managerId: formData.value.managerId || undefined,
    })
    toast.success(t('common.success'), t('departments.updatedSuccess'))
    closeEditModal()
    await reload()
  } catch (error: any) {
    toast.error(t('common.error'), extractApiErrorMessage(error, t('departments.updateError')))
  } finally {
    isSubmitting.value = false
  }
}

async function handleDeleteDepartment(dept: Department) {
  if (!confirm(t('departments.deleteConfirm', { name: dept.name }))) return
  try {
    await departmentStore.deleteDepartment(dept.id)
    toast.success(t('common.success'), t('departments.deletedSuccess'))
    await reload()
  } catch (error: any) {
    toast.error(t('common.error'), extractApiErrorMessage(error, t('departments.deleteError')))
  }
}

function closeCreateModal() {
  showCreateModal.value = false
  deptErrors.value = {}
  formData.value = { name: '', companyId: '', siteId: '', managerId: '' }
}

function closeEditModal() {
  showEditModal.value = false
  editingDept.value = null
  deptErrors.value = {}
  formData.value = { name: '', companyId: '', siteId: '', managerId: '' }
}
</script>
