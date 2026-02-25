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

    <div v-if="departmentStore.isLoading" class="py-12 text-center">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent" />
    </div>

    <template v-else-if="department">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard
          title="Total Employes"
          :value="department.employeeCount || 0"
          :icon="UsersIcon"
        />
        <StatCard
          title="Employes Actifs"
          :value="activeEmployeesCount"
          :icon="CheckCircleIcon"
        />
        <StatCard
          title="Site"
          :value="siteName"
          :icon="MapPinIcon"
        />
      </div>

      <AppCard title="Informations du Departement" class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <p class="text-base text-gray-900">{{ department.name }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Site</label>
            <p class="text-base text-gray-900">{{ siteName }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Entreprise</label>
            <p class="text-base text-gray-900">{{ companyName }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Manager</label>
            <p class="text-base text-gray-900">{{ managerName }}</p>
          </div>
        </div>
      </AppCard>

      <AppCard title="Employes">
        <DataTable
          :columns="employeeColumns"
          :data="employeeTableData"
          :loading="employeeStore.isLoading"
          :pagination="employeeStore.pagination"
          @row-click="handleEmployeeClick"
          @page-change="handleEmployeePageChange"
        />
      </AppCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDepartmentStore } from '@/stores/department.store'
import { useCompanyStore } from '@/stores/company.store'
import { useSiteStore } from '@/stores/site.store'
import { useEmployeeStore } from '@/stores/employee.store'
import DataTable from '@/components/data-display/DataTable.vue'
import StatCard from '@/components/data-display/StatCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import type { TableColumn } from '@/types/common'
import { UsersIcon, CheckCircleIcon, MapPinIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const departmentStore = useDepartmentStore()
const companyStore = useCompanyStore()
const siteStore = useSiteStore()
const employeeStore = useEmployeeStore()

const departmentId = computed(() => route.params.id as string)
const department = computed(() => departmentStore.currentDepartment)

const siteName = computed(() => {
  if (!department.value) return '-'
  const site = siteStore.sites.find(s => s.id === department.value!.siteId)
  return site?.name || '-'
})

const companyName = computed(() => {
  if (!department.value) return '-'
  const company = companyStore.companies.find(c => c.id === department.value!.companyId)
  return company?.name || '-'
})

// Cherche le manager parmi tous les employes charges (du site)
const managerName = computed(() => {
  if (!department.value?.managerId) return '-'
  const manager = employeeStore.employees.find(e => e.id === department.value!.managerId)
  return manager ? `${manager.firstName} ${manager.lastName}` : '-'
})

const activeEmployeesCount = computed(() => {
  return employeeStore.employees.filter(e =>
    e.departmentId === departmentId.value && e.isActive,
  ).length
})

const employeeColumns: TableColumn[] = [
  { key: 'name', label: 'Nom', sortable: true },
  { key: 'position', label: 'Poste', sortable: true },
  { key: 'email', label: 'Email', sortable: false },
  { key: 'status', label: 'Statut', align: 'center' as const },
]

const employeeTableData = computed(() => {
  return employeeStore.employees
    .filter(emp => emp.departmentId === departmentId.value)
    .map(emp => ({
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      position: emp.position,
      email: emp.email,
      status: emp.isActive ? 'Actif' : 'Inactif',
    }))
})

onMounted(async () => {
  // Charger departement + donnees de contexte en parallele
  await Promise.all([
    companyStore.fetchCompanies({ perPage: 100 }),
    siteStore.fetchSites({ perPage: 100 }),
    departmentStore.fetchDepartment(departmentId.value),
  ])

  if (department.value) {
    // Charger TOUS les employes du site (pas seulement du dept)
    // pour pouvoir resoudre le nom du manager meme s'il est dans un autre departement
    await employeeStore.fetchEmployees({
      siteId: department.value.siteId,
      perPage: 200,
    })
  }
})

function handleEmployeeClick(row: any) {
  router.push({ name: 'rfid-employee-detail', params: { id: row.id } })
}

function handleEmployeePageChange(page: number) {
  if (!department.value) return
  employeeStore.fetchEmployees({
    departmentId: department.value.id,
    perPage: 10,
    page,
  })
}
</script>
