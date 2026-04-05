<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('sites.title') }}</h1>
      <AppButton
        v-if="canCreate"
        variant="primary"
        @click="showCreateModal = true"
      >
        {{ t('sites.create') }}
      </AppButton>
    </div>

    <AppCard class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AppSelect
          v-model="filters.companyId"
          :options="companyOptions"
          :label="t('sites.company')"
          :placeholder="t('sites.allCompanies')"
          @update:model-value="handleFilterChange"
        />
      </div>
    </AppCard>

    <AppCard>
      <DataTable
        :columns="columns"
        :data="tableData"
        :loading="siteStore.isLoading"
        :pagination="siteStore.pagination"
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
              @click.stop="handleDeleteSite(row._raw)"
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
      :title="t('sites.create')"
      size="lg"
      @close="closeCreateModal"
    >
      <form id="site-form" @submit.prevent="handleCreateSite">
        <div class="space-y-4">
          <AppInput
            v-model="formData.name"
            :label="t('common.name')"
            :placeholder="t('common.name')"
            required
          />

          <AppInput
            v-model="formData.address"
            :label="t('sites.address')"
            :placeholder="t('sites.address')"
            required
          />

          <AppSelect
            v-model="formData.companyId"
            :options="companyOptions"
            :label="t('sites.company')"
            :placeholder="t('sites.selectCompany')"
            required
          />

          <div class="grid grid-cols-2 gap-4">
            <AppInput
              v-model="formData.latitude"
              :label="t('sites.lat')"
              type="number"
              :placeholder="t('sites.latPlaceholder')"
              step="any"
              required
            />
            <AppInput
              v-model="formData.longitude"
              :label="t('sites.lng')"
              type="number"
              :placeholder="t('sites.lngPlaceholder')"
              step="any"
              required
            />
          </div>

          <AppInput
            v-model="formData.geofenceRadius"
            :label="t('sites.geofence')"
            type="number"
            placeholder="100"
            required
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
          form="site-form"
          type="submit"
          variant="primary"
          :loading="isSubmitting"
        >
          {{ t('common.create') }}
        </AppButton>
      </template>
    </AppModal>

    <AppModal
      :is-open="showDeleteModal"
      :title="t('sites.deleteTitle')"
      size="sm"
      @close="closeDeleteModal"
    >
      <p class="text-sm text-gray-600">
        {{ t('sites.deleteConfirm', { name: deletingSite?.name }) }}
      </p>

      <template #footer>
        <AppButton variant="outline" @click="closeDeleteModal">{{ t('common.cancel') }}</AppButton>
        <AppButton variant="danger" :loading="isSubmitting" @click="confirmDeleteSite">{{ t('common.delete') }}</AppButton>
      </template>
    </AppModal>

    <AppModal
      :is-open="showEditModal"
      :title="t('sites.editTitle')"
      size="lg"
      @close="closeEditModal"
    >
      <form id="site-edit-form" @submit.prevent="handleEditSite">
        <div class="space-y-4">
          <AppInput
            v-model="formData.name"
            :label="t('common.name')"
            :placeholder="t('common.name')"
            required
          />

          <AppInput
            v-model="formData.address"
            :label="t('sites.address')"
            :placeholder="t('sites.address')"
            required
          />

          <AppSelect
            v-model="formData.companyId"
            :options="companyOptions"
            :label="t('sites.company')"
            :placeholder="t('sites.selectCompany')"
            required
          />

          <div class="grid grid-cols-2 gap-4">
            <AppInput
              v-model="formData.latitude"
              :label="t('sites.lat')"
              type="number"
              :placeholder="t('sites.latPlaceholder')"
              step="any"
              required
            />
            <AppInput
              v-model="formData.longitude"
              :label="t('sites.lng')"
              type="number"
              :placeholder="t('sites.lngPlaceholder')"
              step="any"
              required
            />
          </div>

          <AppInput
            v-model="formData.geofenceRadius"
            :label="t('sites.geofence')"
            type="number"
            placeholder="100"
            required
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
          form="site-edit-form"
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
import { useSiteStore } from '@/stores/site.store'
import { useCompanyStore } from '@/stores/company.store'
import { usePermissions } from '@/composables/usePermissions'
import DataTable from '@/components/data-display/DataTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import type { TableColumn } from '@/types/common'
import type { Site } from '@/types'
import { useToast } from '@/composables/useToast'
import { PencilIcon, TrashIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const router = useRouter()
const siteStore = useSiteStore()
const companyStore = useCompanyStore()
const permissions = usePermissions()
const toast = useToast()

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const editingSite = ref<Site | null>(null)
const deletingSite = ref<Site | null>(null)
const isSubmitting = ref(false)

const filters = ref({
  companyId: '',
  page: 1,
  perPage: 10,
})

const formData = ref({
  name: '',
  address: '',
  companyId: '',
  latitude: '' as string | number,
  longitude: '' as string | number,
  geofenceRadius: 100 as string | number,
})

const canCreate = computed(() =>
  permissions.isAdminOrSuperOrTech.value
)

const companyOptions = computed(() => [
  { value: '', label: t('sites.allCompanies') },
  ...companyStore.companies.map(company => ({
    value: company.id,
    label: company.name,
  })),
])

const columns = computed<TableColumn[]>(() => {
  const cols: TableColumn[] = [
    { key: 'name', label: t('common.name'), sortable: true },
    { key: 'companyName', label: t('sites.company'), sortable: true },
    { key: 'address', label: t('sites.address'), sortable: false },
    { key: 'departmentCount', label: t('sites.departments'), align: 'center' as const },
    { key: 'employeeCount', label: t('sites.employees'), align: 'center' as const },
  ]
  if (canCreate.value) {
    cols.push({ key: 'actions', label: t('common.actions'), align: 'right' as const, width: '120px' })
  }
  return cols
})

const tableData = computed(() => {
  return siteStore.sites.map(site => {
    const company = companyStore.companies.find(c => c.id === site.companyId)
    return {
      id: site.id,
      name: site.name,
      companyName: company?.name || '-',
      address: site.address,
      departmentCount: site.departments?.length || 0,
      employeeCount: site.departments?.reduce((sum, dept) => sum + (dept.employeeCount || 0), 0) || 0,
      _raw: site,
    }
  })
})

onMounted(async () => {
  await Promise.all([
    companyStore.fetchCompanies({ perPage: 100 }),
    siteStore.fetchSites(filters.value),
  ])
})

function handleFilterChange() {
  filters.value.page = 1
  siteStore.fetchSites(filters.value)
}

function handlePageChange(page: number) {
  filters.value.page = page
  siteStore.fetchSites(filters.value)
}

function handleRowClick(row: any) {
  router.push({ name: 'rfid-site-detail', params: { id: row.id } })
}

async function handleCreateSite() {
  isSubmitting.value = true
  try {
    await siteStore.createSite({
      name: formData.value.name,
      address: formData.value.address,
      companyId: formData.value.companyId,
      latitude: Number(formData.value.latitude),
      longitude: Number(formData.value.longitude),
      geofenceRadius: Number(formData.value.geofenceRadius),
    })
    toast.success(t('common.success'), t('sites.createdSuccess'))
    closeCreateModal()
    await siteStore.fetchSites(filters.value)
  } catch (error: any) {
    toast.error(t('common.error'), error.message || t('sites.createError'))
  } finally {
    isSubmitting.value = false
  }
}

function openEditModal(site: Site) {
  editingSite.value = site
  formData.value = {
    name: site.name,
    address: site.address,
    companyId: site.companyId,
    latitude: site.latitude ?? '',
    longitude: site.longitude ?? '',
    geofenceRadius: site.geofenceRadius ?? 100,
  }
  showEditModal.value = true
}

async function handleEditSite() {
  if (!editingSite.value) return
  isSubmitting.value = true
  try {
    await siteStore.updateSite(editingSite.value.id, {
      name: formData.value.name,
      address: formData.value.address,
      companyId: formData.value.companyId,
      latitude: Number(formData.value.latitude),
      longitude: Number(formData.value.longitude),
      geofenceRadius: Number(formData.value.geofenceRadius),
    })
    toast.success(t('common.success'), t('sites.updatedSuccess'))
    closeEditModal()
    await siteStore.fetchSites(filters.value)
  } catch (error: any) {
    toast.error(t('common.error'), error.message || t('sites.updateError'))
  } finally {
    isSubmitting.value = false
  }
}

function handleDeleteSite(site: Site) {
  deletingSite.value = site
  showDeleteModal.value = true
}

async function confirmDeleteSite() {
  if (!deletingSite.value) return
  isSubmitting.value = true
  try {
    await siteStore.deleteSite(deletingSite.value.id)
    toast.success(t('common.success'), t('sites.deletedSuccess'))
    closeDeleteModal()
    await siteStore.fetchSites(filters.value)
  } catch (error: any) {
    toast.error(t('common.error'), error.message || t('sites.deleteError'))
  } finally {
    isSubmitting.value = false
  }
}

function closeDeleteModal() {
  showDeleteModal.value = false
  deletingSite.value = null
}

function closeCreateModal() {
  showCreateModal.value = false
  formData.value = { name: '', address: '', companyId: '', latitude: '', longitude: '', geofenceRadius: 100 }
}

function closeEditModal() {
  showEditModal.value = false
  editingSite.value = null
  formData.value = { name: '', address: '', companyId: '', latitude: '', longitude: '', geofenceRadius: 100 }
}
</script>
