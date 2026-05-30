<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCompanyStore } from '@/stores/company.store'
import { usePermissions } from '@/composables/usePermissions'
import { useServerTable } from '@/composables/useServerTable'
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
import { extractApiErrorMessage } from '@/utils/api-error'

const { t } = useI18n()
const router = useRouter()
const companyStore = useCompanyStore()
const { isSetupRole } = usePermissions()
const toast = useToast()

const { filters, search, applyFilters, handlePageChange, reload } = useServerTable({
  initialFilters: { status: '' as '' | 'active' | 'inactive' },
  fetcher: (p) =>
    companyStore.fetchCompanies({
      page: p.page,
      perPage: p.perPage,
      search: p.search || undefined,
      isActive: p.status === '' ? undefined : p.status === 'active',
    }),
})

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

const tableData = computed(() =>
  sortByRecent(companyStore.companies).map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    status: c.isActive ? 'active' : 'inactive',
    employeeCount: c.employeeCount,
    _raw: c,
  })),
)

onMounted(reload)

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

async function handleToggleActive(company: Company) {
  try {
    await companyStore.toggleActive(company.id)
    toast.success(t('common.success'), company.isActive ? t('companies.deactivated') : t('companies.activated'))
    await reload()
  } catch (error: any) {
    toast.error(t('common.error'), extractApiErrorMessage(error, t('companies.statusError')))
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('companies.title') }}</h1>
      <AppButton v-if="isSetupRole" @click="handleCreateCompany">
        {{ t('companies.create') }}
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
          v-model="filters.status"
          :options="statusOptions"
          :label="t('common.status')"
          @update:model-value="applyFilters"
        />
      </div>
    </AppCard>

    <AppCard>
      <DataTable
        :columns="columns"
        :data="tableData"
        :loading="companyStore.isLoading"
        :pagination="companyStore.pagination"
        @row-click="handleRowClick"
        @page-change="handlePageChange"
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
              v-if="isSetupRole"
              @click="handleEditCompany(row.id)"
              class="text-gray-600 hover:text-gray-900"
              :title="t('common.edit')"
            >
              <PencilIcon class="h-5 w-5" />
            </button>
            <button
              v-if="isSetupRole"
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
