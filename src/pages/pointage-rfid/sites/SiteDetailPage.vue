<template>
  <div>
    <div class="mb-6">
      <AppButton
        variant="outline"
        @click="router.back()"
      >
        Retour
      </AppButton>
    </div>

    <div v-if="siteStore.isLoading" class="py-12 text-center">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent" />
    </div>

    <template v-else-if="site">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard
          title="Total Departements"
          :value="site.departments?.length || 0"
          icon="🏢"
        />
        <StatCard
          title="Total Employes"
          :value="totalEmployees"
          icon="👥"
        />
        <StatCard
          title="Entreprise"
          :value="companyName"
          icon="🏛️"
        />
      </div>

      <AppCard title="Informations du Site" class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <p class="text-base text-gray-900">{{ site.name }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Entreprise</label>
            <p class="text-base text-gray-900">{{ companyName }}</p>
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
            <p class="text-base text-gray-900">{{ site.address }}</p>
          </div>
        </div>
      </AppCard>

      <AppCard>
        <template #actions>
          <AppButton
            v-if="canCreate"
            variant="primary"
            @click="showCreateDepartmentModal = true"
          >
            Nouveau Departement
          </AppButton>
        </template>

        <DataTable
          :columns="departmentColumns"
          :data="departmentTableData"
          :loading="false"
          @row-click="handleDepartmentClick"
        />
      </AppCard>
    </template>

    <AppModal
      :is-open="showCreateDepartmentModal"
      title="Nouveau Departement"
      size="lg"
      @close="closeCreateDepartmentModal"
    >
      <form @submit.prevent="handleCreateDepartment">
        <div class="space-y-4">
          <AppInput
            v-model="departmentFormData.name"
            label="Nom"
            placeholder="Nom du departement"
            required
          />

          <AppSelect
            v-model="departmentFormData.managerId"
            :options="managerOptions"
            label="Manager"
            placeholder="Selectionner un manager"
          />
        </div>

        <template #footer>
          <AppButton
            variant="outline"
            @click="closeCreateDepartmentModal"
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
import { useRouter, useRoute } from 'vue-router'
import { useSiteStore } from '@/stores/site.store'
import { useCompanyStore } from '@/stores/company.store'
import { useDepartmentStore } from '@/stores/department.store'
import { usePermissions } from '@/composables/usePermissions'
import DataTable from '@/components/data-display/DataTable.vue'
import StatCard from '@/components/data-display/StatCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import type { TableColumn } from '@/types/common'

const router = useRouter()
const route = useRoute()
const siteStore = useSiteStore()
const companyStore = useCompanyStore()
const departmentStore = useDepartmentStore()
const permissions = usePermissions()

const showCreateDepartmentModal = ref(false)
const isSubmitting = ref(false)

const departmentFormData = ref({
  name: '',
  managerId: '',
})

const siteId = computed(() => route.params.id as string)

const site = computed(() => siteStore.currentSite)

const canCreate = computed(() =>
  permissions.isSuperAdmin.value || permissions.isAdminEnterprise.value
)

const companyName = computed(() => {
  if (!site.value) return '-'
  const company = companyStore.companies.find(c => c.id === site.value.companyId)
  return company?.name || '-'
})

const totalEmployees = computed(() => {
  if (!site.value?.departments) return 0
  return site.value.departments.reduce((sum, dept) => sum + (dept.employeeCount || 0), 0)
})

const managerOptions = computed(() => [
  { value: '', label: 'Aucun manager' },
])

const departmentColumns: TableColumn[] = [
  { key: 'name', label: 'Nom', sortable: true },
  { key: 'employeeCount', label: 'Employes', align: 'center' as const },
  { key: 'manager', label: 'Manager', sortable: false },
]

const departmentTableData = computed(() => {
  if (!site.value?.departments) return []
  return site.value.departments.map(dept => ({
    id: dept.id,
    name: dept.name,
    employeeCount: dept.employeeCount || 0,
    manager: dept.managerId ? 'Manager assigne' : '-',
  }))
})

onMounted(async () => {
  await Promise.all([
    companyStore.fetchCompanies({ perPage: 100 }),
    siteStore.fetchSite(siteId.value),
  ])
})

function handleDepartmentClick(row: any) {
  router.push({ name: 'rfid-department-detail', params: { id: row.id } })
}

async function handleCreateDepartment() {
  if (!site.value) return

  isSubmitting.value = true
  try {
    await departmentStore.createDepartment({
      name: departmentFormData.value.name,
      siteId: site.value.id,
      companyId: site.value.companyId,
      managerId: departmentFormData.value.managerId || undefined,
      employeeCount: 0,
    })
    closeCreateDepartmentModal()
    await siteStore.fetchSite(siteId.value)
  } catch (error) {
    console.error('Error creating department:', error)
  } finally {
    isSubmitting.value = false
  }
}

function closeCreateDepartmentModal() {
  showCreateDepartmentModal.value = false
  departmentFormData.value = {
    name: '',
    managerId: '',
  }
}
</script>
