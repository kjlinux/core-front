<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCompanyStore } from '@/stores/company.store'
import { usePermissions } from '@/composables/usePermissions'
import type { Company } from '@/types'
import type { TableColumn } from '@/types/common'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import DataTable from '@/components/data-display/DataTable.vue'
import { EyeIcon, PencilIcon, NoSymbolIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'
import { useToast } from '@/composables/useToast'
import { sortByRecent } from '@/utils/sort'

const { t } = useI18n()
const router = useRouter()
const companyStore = useCompanyStore()
const { isSuperAdmin } = usePermissions()
const toast = useToast()

const searchQuery = ref('')
const statusFilter = ref<'' | 'active' | 'inactive'>('')

const statusOptions = computed(() => [
  { value: '', label: t('companies.allStatuses') || 'Tous les statuts' },
  { value: 'active', label: t('common.active') },
  { value: 'inactive', label: t('common.inactive') },
])

const columns = computed<TableColumn[]>(() => [
  { key: 'name', label: t('common.name'), sortable: true },
  { key: 'email', label: t('common.email'), sortable: true },
  { key: 'phone', label: t('common.phone'), sortable: false },
  { key: 'status', label: t('common.status'), sortable: true },
  { key: 'employeeCount', label: t('companies.employees'), align: 'center' as const, sortable: true },
  { key: 'actions', label: t('common.actions'), align: 'right' as const, width: '160px' },
])

const tableData = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return sortByRecent(companyStore.companies)
    .filter((c) => {
      if (statusFilter.value === 'active' && !c.isActive) return false
      if (statusFilter.value === 'inactive' && c.isActive) return false
      if (!q) return true
      return (
        (c.name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q)
      )
    })
    .map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      status: c.isActive ? 'active' : 'inactive',
      employeeCount: c.employeeCount,
      _raw: c,
    }))
})

onMounted(() => {
  companyStore.fetchCompanies()
})

function handleRowClick(row: { id: string }) {
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

async function handleToggleActive(company: Company) {
  try {
    await companyStore.toggleActive(company.id)
    toast.success(t('common.success'), company.isActive ? t('companies.deactivated') : t('companies.activated'))
  } catch (error: any) {
    toast.error(t('common.error'), error.message || t('companies.statusError'))
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('companies.title') }}</h1>
      <AppButton v-if="isSuperAdmin" @click="handleCreateCompany">
        {{ t('companies.create') }}
      </AppButton>
    </div>

    <AppCard class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AppInput
          v-model="searchQuery"
          :placeholder="t('common.search') || 'Rechercher...'"
          :label="t('common.search') || 'Rechercher'"
        />
        <AppSelect
          v-model="statusFilter"
          :options="statusOptions"
          :label="t('common.status')"
        />
      </div>
    </AppCard>

    <AppCard>
      <DataTable
        :columns="columns"
        :data="tableData"
        :loading="companyStore.isLoading"
        :pagination="companyStore.pagination"
        default-sort-column="name"
        default-sort-direction="desc"
        @row-click="handleRowClick"
        @page-change="handlePageChange"
        @sort="handleSort"
      >
        <template #status="{ row }">
          <AppBadge :variant="row.status === 'active' ? 'success' : 'neutral'">
            {{ row.status === 'active' ? t('common.active') : t('common.inactive') }}
          </AppBadge>
        </template>

        <template #actions="{ row }">
          <div class="flex items-center justify-end gap-2" @click.stop>
            <button
              @click="handleViewCompany(row.id)"
              class="text-blue-600 hover:text-blue-900"
              :title="t('common.view')"
            >
              <EyeIcon class="h-5 w-5" />
            </button>
            <button
              v-if="isSuperAdmin"
              @click="handleEditCompany(row.id)"
              class="text-gray-600 hover:text-gray-900"
              :title="t('common.edit')"
            >
              <PencilIcon class="h-5 w-5" />
            </button>
            <button
              v-if="isSuperAdmin"
              @click="handleToggleActive(row._raw)"
              :class="row.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'"
              :title="row.status === 'active' ? t('common.deactivate') : t('common.activate')"
            >
              <NoSymbolIcon v-if="row.status === 'active'" class="h-5 w-5" />
              <CheckCircleIcon v-else class="h-5 w-5" />
            </button>
          </div>
        </template>
      </DataTable>
    </AppCard>
  </div>
</template>
