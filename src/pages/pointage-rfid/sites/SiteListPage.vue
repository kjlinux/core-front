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
              @click.stop="handleDeleteSite(row._raw)"
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

    <AppModal
      :is-open="showEditModal"
      title="Modifier le Site"
      size="lg"
      @close="closeEditModal"
    >
      <form id="site-edit-form" @submit.prevent="handleEditSite">
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
          @click="closeEditModal"
        >
          Annuler
        </AppButton>
        <AppButton
          form="site-edit-form"
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

const router = useRouter()
const siteStore = useSiteStore()
const companyStore = useCompanyStore()
const permissions = usePermissions()
const toast = useToast()

const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingSite = ref<Site | null>(null)
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

const columns = computed<TableColumn[]>(() => {
  const cols: TableColumn[] = [
    { key: 'name', label: 'Nom', sortable: true },
    { key: 'companyName', label: 'Entreprise', sortable: true },
    { key: 'address', label: 'Adresse', sortable: false },
    { key: 'departmentCount', label: 'Departements', align: 'center' as const },
    { key: 'employeeCount', label: 'Employes', align: 'center' as const },
  ]
  if (canCreate.value) {
    cols.push({ key: 'actions', label: 'Actions', align: 'right' as const, width: '120px' })
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
    })
    toast.success('Succes', 'Site cree avec succes')
    closeCreateModal()
    await siteStore.fetchSites(filters.value)
  } catch (error: any) {
    toast.error('Erreur', error.message || 'Erreur lors de la creation du site')
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
    })
    toast.success('Succes', 'Site modifie avec succes')
    closeEditModal()
    await siteStore.fetchSites(filters.value)
  } catch (error: any) {
    toast.error('Erreur', error.message || 'Erreur lors de la modification du site')
  } finally {
    isSubmitting.value = false
  }
}

async function handleDeleteSite(site: Site) {
  if (!confirm(`Supprimer le site "${site.name}" ?`)) return
  try {
    await siteStore.deleteSite(site.id)
    toast.success('Succes', 'Site supprime avec succes')
    await siteStore.fetchSites(filters.value)
  } catch (error: any) {
    toast.error('Erreur', error.message || 'Erreur lors de la suppression du site')
  }
}

function closeCreateModal() {
  showCreateModal.value = false
  formData.value = { name: '', address: '', companyId: '' }
}

function closeEditModal() {
  showEditModal.value = false
  editingSite.value = null
  formData.value = { name: '', address: '', companyId: '' }
}
</script>
