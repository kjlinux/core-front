<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useEmployeeStore } from '@/stores/employee.store'
import { useCompanyStore } from '@/stores/company.store'
import { usePermissions } from '@/composables/usePermissions'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'

const router = useRouter()
const route = useRoute()
const employeeStore = useEmployeeStore()
const companyStore = useCompanyStore()
const permissions = usePermissions()

const employeeId = route.params.id as string
const showAssignCardModal = ref(false)

const canEdit = computed(() =>
  permissions.isSuperAdmin.value || permissions.isAdminEnterprise.value
)

const employee = computed(() => employeeStore.currentEmployee)

const companyName = computed(() => {
  if (!employee.value) return '-'
  const company = companyStore.companies.find(c => c.id === employee.value?.companyId)
  return company?.name || '-'
})

const siteName = computed(() => {
  if (!employee.value) return '-'
  let siteName = '-'
  companyStore.companies.forEach(company => {
    const site = company.sites?.find(s => s.id === employee.value?.siteId)
    if (site) siteName = site.name
  })
  return siteName
})

const departmentName = computed(() => {
  if (!employee.value) return '-'
  let deptName = '-'
  companyStore.companies.forEach(company => {
    company.sites?.forEach(site => {
      const dept = site.departments?.find(d => d.id === employee.value?.departmentId)
      if (dept) deptName = dept.name
    })
  })
  return deptName
})

const initials = computed(() => {
  if (!employee.value) return ''
  const first = employee.value.firstName?.charAt(0) || ''
  const last = employee.value.lastName?.charAt(0) || ''
  return (first + last).toUpperCase()
})

const formattedHireDate = computed(() => {
  if (!employee.value?.hireDate) return '-'
  return new Date(employee.value.hireDate).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const totalAttendanceDays = ref(22)
const lateDays = ref(3)
const onTimePercentage = computed(() => {
  if (totalAttendanceDays.value === 0) return 0
  return Math.round(((totalAttendanceDays.value - lateDays.value) / totalAttendanceDays.value) * 100)
})

onMounted(async () => {
  await Promise.all([
    employeeStore.fetchEmployee(employeeId),
    companyStore.fetchCompanies({ perPage: 1000 })
  ])
})

const handleEdit = () => {
  router.push({ name: 'rfid-employee-edit', params: { id: employeeId } })
}

const handleBack = () => {
  router.push({ name: 'rfid-employee-list' })
}

const handleAssignCard = () => {
  showAssignCardModal.value = true
}

const closeAssignCardModal = () => {
  showAssignCardModal.value = false
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Details de l'employe</h1>
      <div class="flex space-x-3">
        <AppButton variant="secondary" @click="handleBack">
          Retour
        </AppButton>
        <AppButton v-if="canEdit && employee" @click="handleEdit">
          Modifier
        </AppButton>
      </div>
    </div>

    <div v-if="employeeStore.isLoading" class="py-12 text-center">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent" />
    </div>

    <div v-else-if="!employee" class="py-12 text-center">
      <p class="text-sm text-gray-500">Employe introuvable</p>
    </div>

    <div v-else class="space-y-6">
      <AppCard>
        <div class="flex items-start space-x-6">
          <div class="flex h-24 w-24 items-center justify-center rounded-full bg-primary-100 text-3xl font-bold text-primary-700">
            {{ initials }}
          </div>

          <div class="flex-1">
            <div class="flex items-center space-x-3">
              <h2 class="text-3xl font-bold text-gray-900">
                {{ employee.firstName }} {{ employee.lastName }}
              </h2>
              <AppBadge :variant="employee.isActive ? 'success' : 'secondary'">
                {{ employee.isActive ? 'Actif' : 'Inactif' }}
              </AppBadge>
            </div>

            <div class="mt-2 space-y-1">
              <p class="text-lg text-gray-600">
                <span class="font-medium">Matricule:</span> {{ employee.employeeNumber }}
              </p>
              <p v-if="employee.position" class="text-lg text-gray-600">
                <span class="font-medium">Poste:</span> {{ employee.position }}
              </p>
            </div>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h3 class="text-sm font-medium text-gray-500">Contact</h3>
            <div class="mt-2 space-y-2">
              <p class="text-sm text-gray-900">
                <span class="font-medium">Email:</span> {{ employee.email }}
              </p>
              <p v-if="employee.phone" class="text-sm text-gray-900">
                <span class="font-medium">Telephone:</span> {{ employee.phone }}
              </p>
            </div>
          </div>

          <div>
            <h3 class="text-sm font-medium text-gray-500">Affectation</h3>
            <div class="mt-2 space-y-2">
              <p class="text-sm text-gray-900">
                <span class="font-medium">Entreprise:</span> {{ companyName }}
              </p>
              <p class="text-sm text-gray-900">
                <span class="font-medium">Site:</span> {{ siteName }}
              </p>
              <p class="text-sm text-gray-900">
                <span class="font-medium">Departement:</span> {{ departmentName }}
              </p>
            </div>
          </div>

          <div>
            <h3 class="text-sm font-medium text-gray-500">Informations RH</h3>
            <div class="mt-2 space-y-2">
              <p class="text-sm text-gray-900">
                <span class="font-medium">Date d'embauche:</span> {{ formattedHireDate }}
              </p>
            </div>
          </div>

          <div>
            <h3 class="text-sm font-medium text-gray-500">Acces</h3>
            <div class="mt-2 space-y-2">
              <div class="flex items-center space-x-2">
                <span class="text-sm font-medium text-gray-900">Carte RFID:</span>
                <AppBadge v-if="employee.rfidCardId" variant="success">
                  Assignee
                </AppBadge>
                <AppBadge v-else variant="warning">
                  Non assignee
                </AppBadge>
              </div>
              <p v-if="employee.rfidCardId" class="text-sm text-gray-600">
                UID: {{ employee.rfidCardId }}
              </p>

              <div class="flex items-center space-x-2">
                <span class="text-sm font-medium text-gray-900">Biometrie:</span>
                <AppBadge :variant="employee.biometricEnrolled ? 'success' : 'secondary'">
                  {{ employee.biometricEnrolled ? 'Enrolee' : 'Non enrolee' }}
                </AppBadge>
              </div>

              <div v-if="canEdit" class="mt-4">
                <AppButton size="sm" @click="handleAssignCard">
                  {{ employee.rfidCardId ? 'Modifier la carte' : 'Assigner une carte' }}
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      </AppCard>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
        <AppCard title="Jours de presence">
          <div class="text-center">
            <p class="text-4xl font-bold text-primary-600">{{ totalAttendanceDays }}</p>
            <p class="mt-2 text-sm text-gray-500">Ce mois</p>
          </div>
        </AppCard>

        <AppCard title="Retards">
          <div class="text-center">
            <p class="text-4xl font-bold text-red-600">{{ lateDays }}</p>
            <p class="mt-2 text-sm text-gray-500">Ce mois</p>
          </div>
        </AppCard>

        <AppCard title="Ponctualite">
          <div class="text-center">
            <p class="text-4xl font-bold text-green-600">{{ onTimePercentage }}%</p>
            <p class="mt-2 text-sm text-gray-500">A l'heure</p>
          </div>
        </AppCard>
      </div>
    </div>

    <div
      v-if="showAssignCardModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      @click.self="closeAssignCardModal"
    >
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 class="text-lg font-semibold text-gray-900">Assigner une carte RFID</h3>
        <p class="mt-2 text-sm text-gray-500">
          Scannez une carte RFID ou entrez son UID manuellement.
        </p>

        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700">UID de la carte</label>
          <input
            type="text"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
            placeholder="Ex: A1B2C3D4"
          />
        </div>

        <div class="mt-6 flex justify-end space-x-3">
          <AppButton variant="secondary" @click="closeAssignCardModal">
            Annuler
          </AppButton>
          <AppButton @click="closeAssignCardModal">
            Enregistrer
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>
