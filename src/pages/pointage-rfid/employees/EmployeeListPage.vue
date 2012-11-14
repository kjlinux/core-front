<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEmployeeStore } from '@/stores/employee.store'
import { usePermissions } from '@/composables/usePermissions'

const router = useRouter()
const employeeStore = useEmployeeStore()
const permissions = usePermissions()
const canCreate = () => permissions.isSuperAdmin.value || permissions.isAdminEnterprise.value

onMounted(() => {
  employeeStore.fetchEmployees()
})

function createEmployee() {
  router.push({ name: 'rfid-employee-create' })
}

function viewEmployee(id: string) {
  router.push({ name: 'rfid-employee-detail', params: { id } })
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Employes</h1>
      <button
        v-if="canCreate()"
        @click="createEmployee"
        class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
      >
        Nouvel employe
      </button>
    </div>

    <div v-if="employeeStore.isLoading" class="py-12 text-center">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent" />
    </div>

    <div v-else class="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nom</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Matricule</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Poste</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Statut</th>
            <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          <tr v-for="employee in employeeStore.employees" :key="employee.id" class="hover:bg-gray-50">
            <td class="whitespace-nowrap px-6 py-4">
              <div class="text-sm font-medium text-gray-900">{{ employee.firstName }} {{ employee.lastName }}</div>
              <div class="text-sm text-gray-500">{{ employee.email }}</div>
            </td>
            <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{{ employee.employeeNumber }}</td>
            <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{{ employee.position }}</td>
            <td class="whitespace-nowrap px-6 py-4">
              <span
                :class="[
                  'inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-5',
                  employee.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800',
                ]"
              >
                {{ employee.isActive ? 'Actif' : 'Inactif' }}
              </span>
            </td>
            <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
              <button
                @click="viewEmployee(employee.id)"
                class="text-primary-600 hover:text-primary-900"
              >
                Voir
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
