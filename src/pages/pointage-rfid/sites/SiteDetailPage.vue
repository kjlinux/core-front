<template>
  <div>
    <div class="mb-6">
      <AppButton
        variant="outline"
        @click="router.back()"
      >
        {{ t('common.back') }}
      </AppButton>
    </div>

    <div v-if="siteStore.isLoading" class="py-12 text-center">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent" />
    </div>

    <template v-else-if="site">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard
          :title="t('sites.totalDepts')"
          :value="site.departments?.length || 0"
          :icon="RectangleGroupIcon"
        />
        <StatCard
          :title="t('sites.totalEmployees')"
          :value="totalEmployees"
          :icon="UsersIcon"
        />
        <StatCard
          :title="t('sites.company')"
          :value="companyName"
          :icon="BuildingOffice2Icon"
        />
      </div>

      <AppCard :title="t('sites.info')" class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('common.name') }}</label>
            <p class="text-base text-gray-900">{{ site.name }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('sites.company') }}</label>
            <p class="text-base text-gray-900">{{ companyName }}</p>
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('sites.address') }}</label>
            <p class="text-base text-gray-900">{{ site.address }}</p>
          </div>
        </div>
      </AppCard>

      <AppCard :title="t('sites.departments')">
        <template #actions>
          <AppButton
            v-if="canCreate"
            variant="primary"
            @click="openCreateDepartmentModal"
          >
            {{ t('sites.newDept') }}
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
      :title="t('departments.create')"
      size="lg"
      @close="closeCreateDepartmentModal"
    >
      <form id="dept-form" @submit.prevent="handleCreateDepartment">
        <div class="space-y-4">
          <AppInput
            v-model="departmentFormData.name"
            :label="t('common.name')"
            :placeholder="t('common.name')"
            required
          />

          <AppSelect
            v-model="departmentFormData.managerId"
            :options="managerOptions"
            :label="t('sites.manager')"
            :placeholder="t('sites.selectManager')"
          />
        </div>
      </form>

      <template #footer>
        <AppButton
          variant="outline"
          @click="closeCreateDepartmentModal"
        >
          {{ t('common.cancel') }}
        </AppButton>
        <AppButton
          form="dept-form"
          type="submit"
          variant="primary"
          :loading="isSubmitting"
        >
          {{ t('common.create') }}
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSiteStore } from '@/stores/site.store'
import { useCompanyStore } from '@/stores/company.store'
import { useDepartmentStore } from '@/stores/department.store'
import { useEmployeeStore } from '@/stores/employee.store'
import { usePermissions } from '@/composables/usePermissions'
import { useToast } from '@/composables/useToast'
import DataTable from '@/components/data-display/DataTable.vue'
import StatCard from '@/components/data-display/StatCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import type { TableColumn } from '@/types/common'
import { RectangleGroupIcon, UsersIcon, BuildingOffice2Icon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const siteStore = useSiteStore()
const companyStore = useCompanyStore()
const departmentStore = useDepartmentStore()
const employeeStore = useEmployeeStore()
const permissions = usePermissions()
const toast = useToast()

const showCreateDepartmentModal = ref(false)
const isSubmitting = ref(false)

const departmentFormData = ref({
  name: '',
  managerId: '',
})

const siteId = computed(() => route.params.id as string)
const site = computed(() => siteStore.currentSite)

const canCreate = computed(() =>
  permissions.isAdminOrSuperOrTech.value
)

const companyName = computed(() => {
  if (!site.value) return '-'
  const company = companyStore.companies.find(c => c.id === site.value!.companyId)
  return company?.name || '-'
})

const totalEmployees = computed(() => {
  if (!site.value?.departments) return 0
  return site.value.departments.reduce((sum, dept) => sum + (dept.employeeCount || 0), 0)
})

// Options du select manager : tous les employes actifs du site
const managerOptions = computed(() => {
  const opts = employeeStore.employees
    .filter(e => e.isActive)
    .map(e => ({ value: e.id, label: `${e.firstName} ${e.lastName} — ${e.position}` }))
  return [{ value: '', label: t('sites.selectManager') }, ...opts]
})

// Helper pour resoudre le nom d'un manager par son id
function getManagerName(managerId?: string): string {
  if (!managerId) return '-'
  const emp = employeeStore.employees.find(e => e.id === managerId)
  return emp ? `${emp.firstName} ${emp.lastName}` : '-'
}

const departmentColumns = computed<TableColumn[]>(() => [
  { key: 'name', label: t('common.name'), sortable: true },
  { key: 'employeeCount', label: t('departments.employees'), align: 'center' as const },
  { key: 'manager', label: t('sites.manager'), sortable: false },
])

const departmentTableData = computed(() => {
  if (!site.value?.departments) return []
  return site.value.departments.map(dept => ({
    id: dept.id,
    name: dept.name,
    employeeCount: dept.employeeCount || 0,
    manager: getManagerName(dept.managerId),
  }))
})

async function openCreateDepartmentModal() {
  // Charger les employes du site pour alimenter le select manager
  if (site.value) {
    await employeeStore.fetchEmployees({ siteId: site.value.id, perPage: 100 })
  }
  showCreateDepartmentModal.value = true
}

onMounted(async () => {
  await Promise.all([
    companyStore.fetchCompanies({ perPage: 100 }),
    siteStore.fetchSite(siteId.value),
  ])
  // Charger les employes du site pour afficher les noms des managers dans le tableau
  if (site.value) {
    await employeeStore.fetchEmployees({ siteId: site.value.id, perPage: 100 })
  }
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
  } catch (error: unknown) {
    toast.error(t('common.error'), (error as Error)?.message || t('sites.deptCreateError'))
  } finally {
    isSubmitting.value = false
  }
}

function closeCreateDepartmentModal() {
  showCreateDepartmentModal.value = false
  departmentFormData.value = { name: '', managerId: '' }
}
</script>
