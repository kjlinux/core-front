<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Sites</h1>
      <AppButton
        v-if="canCreate"
        variant="primary"
        @click="showCreateModal = true"
      >
        Nouveau Site
      </AppButton>
    </div>

    <AppCard class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AppSelect
          v-model="filters.companyId"
          :options="companyOptions"
          label="Entreprise"
          placeholder="Toutes les entreprises"
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
      />
    </AppCard>

    <AppModal
      :is-open="showCreateModal"
      title="Nouveau Site"
      size="lg"
      @close="closeCreateModal"
    >
      <form id="site-form" @submit.prevent="handleCreateSite">
        <div class="space-y-4">
          <AppInput
            v-model="formData.name"
            label="Nom"
            placeholder="Nom du site"
            required
          />

          <AppInput
            v-model="formData.address"
            label="Adresse"
            placeholder="Adresse du site"
            required
          />

          <AppSelect
            v-model="formData.companyId"
            :options="companyOptions"
            label="Entreprise"
            placeholder="Selectionner une entreprise"
            required
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
          form="site-form"
          type="submit"
          variant="primary"
          :loading="isSubmitting"
        >
          Creer
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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

const router = useRouter()
const siteStore = useSiteStore()
const companyStore = useCompanyStore()
const permissions = usePermissions()

const showCreateModal = ref(false)
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

const columns: TableColumn[] = [
  { key: 'name', label: 'Nom', sortable: true },
  { key: 'companyName', label: 'Entreprise', sortable: true },
  { key: 'address', label: 'Adresse', sortable: false },
  { key: 'departmentCount', label: 'Departements', align: 'center' as const },
  { key: 'employeeCount', label: 'Employes', align: 'center' as const },
]

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
      departments: [],
    })
    closeCreateModal()
    await siteStore.fetchSites(filters.value)
  } catch (error) {
    console.error('Error creating site:', error)
  } finally {
    isSubmitting.value = false
  }
}

function closeCreateModal() {
  showCreateModal.value = false
  formData.value = {
    name: '',
    address: '',
    companyId: '',
  }
}
</script>
