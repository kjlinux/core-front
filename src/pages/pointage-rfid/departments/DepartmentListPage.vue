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
          <AppInput
            v-model="formData.name"
            :label="t('common.name')"
            :placeholder="t('common.name')"
            required
          />

          <AppSelect
            v-model="formData.companyId"
            :options="companyOptions"
            :label="t('departments.company')"
            :placeholder="t('departments.selectCompany')"
            required
            @update:model-value="handleFormCompanyChange"
          />

          <AppSelect
            v-model="formData.siteId"
            :options="formSiteOptions"
            :label="t('departments.site')"
            :placeholder="t('departments.selectSite')"
            required
          />

          <AppSelect
            v-model="formData.managerId"
            :options="managerOptions"
            :label="t('departments.manager')"
            :placeholder="t('departments.selectManager')"
          />
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
          <AppInput
            v-model="formData.name"
            :label="t('common.name')"
            :placeholder="t('common.name')"
            required
          />

          <AppSelect
            v-model="formData.companyId"
            :options="companyOptions"
            :label="t('departments.company')"
            :placeholder="t('departments.selectCompany')"
            required
            @update:model-value="handleFormCompanyChange"
          />

          <AppSelect
            v-model="formData.siteId"
            :options="formSiteOptions"
            :label="t('departments.site')"
            :placeholder="t('departments.selectSite')"
            required
          />

          <AppSelect
            v-model="formData.managerId"
            :options="managerOptions"
            :label="t('departments.manager')"
            :placeholder="t('departments.selectManager')"
          />
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
import DataTable from '@/components/data-display/DataTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import type { TableColumn } from '@/types/common'
import type { Department } from '@/types'
import { useToast } from '@/composables/useToast'
import { userApi, type UserData } from '@/services/api/user.api'
import { PencilIcon, TrashIcon } from '@heroicons/vue/24/outline'

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
const managers = ref<UserData[]>([])

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
  const sites = filters.value.companyId
    ? siteStore.sites.filter(s => s.companyId === filters.value.companyId)
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

const tableData = computed(() => {
  return departmentStore.departments.map(dept => {
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
})

onMounted(async () => {
  const [, , , users] = await Promise.all([
    companyStore.fetchCompanies({ perPage: 100 }),
    siteStore.fetchSites({ perPage: 100 }),
    departmentStore.fetchDepartments(filters.value),
    userApi.getAll({ role: 'manager', perPage: 200 }),
  ])
  managers.value = users
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
    toast.success(t('common.success'), t('departments.createdSuccess'))
    closeCreateModal()
    await departmentStore.fetchDepartments(filters.value)
  } catch (error: any) {
    toast.error(t('common.error'), error.message || t('departments.createError'))
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
    toast.success(t('common.success'), t('departments.updatedSuccess'))
    closeEditModal()
    await departmentStore.fetchDepartments(filters.value)
  } catch (error: any) {
    toast.error(t('common.error'), error.message || t('departments.updateError'))
  } finally {
    isSubmitting.value = false
  }
}

async function handleDeleteDepartment(dept: Department) {
  if (!confirm(t('departments.deleteConfirm', { name: dept.name }))) return
  try {
    await departmentStore.deleteDepartment(dept.id)
    toast.success(t('common.success'), t('departments.deletedSuccess'))
    await departmentStore.fetchDepartments(filters.value)
  } catch (error: any) {
    toast.error(t('common.error'), error.message || t('departments.deleteError'))
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
