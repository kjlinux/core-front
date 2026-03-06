<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useEmployeeStore } from '@/stores/employee.store'
import { useCompanyStore } from '@/stores/company.store'
import { useCardStore } from '@/stores/card.store'
import { usePermissions } from '@/composables/usePermissions'
import { useToast } from '@/composables/useToast'
import { attendanceApi } from '@/services/api/attendance.api'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import { ArrowLeftIcon, PencilIcon, NoSymbolIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const employeeStore = useEmployeeStore()
const companyStore = useCompanyStore()
const cardStore = useCardStore()
const permissions = usePermissions()
const toast = useToast()

const employeeId = route.params.id as string
const showAssignCardModal = ref(false)
const selectedCardId = ref('')

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

const totalAttendanceDays = ref(0)
const lateDays = ref(0)
const onTimePercentage = computed(() => {
  if (totalAttendanceDays.value === 0) return 0
  return Math.round(((totalAttendanceDays.value - lateDays.value) / totalAttendanceDays.value) * 100)
})

async function loadAttendanceStats() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const end = now.toISOString().slice(0, 10)
  try {
    const records = await attendanceApi.getByEmployee(employeeId, { startDate: start, endDate: end })
    totalAttendanceDays.value = records.filter(r => r.status === 'present' || r.status === 'late').length
    lateDays.value = records.filter(r => r.status === 'late').length
  } catch {
    // stats stay at 0 if API unavailable
  }
}

onMounted(async () => {
  await Promise.all([
    employeeStore.fetchEmployee(employeeId),
    companyStore.fetchCompanies({ perPage: 1000 }),
    loadAttendanceStats(),
  ])
})

const handleEdit = () => {
  router.push({ name: 'rfid-employee-edit', params: { id: employeeId } })
}

const handleBack = () => {
  router.push({ name: 'rfid-employees' })
}

const availableCardOptions = computed(() => {
  return cardStore.cards
    .filter(c => {
      if (c.employeeId || c.status === 'blocked') return false
      if (employee.value?.companyId && c.companyId && c.companyId !== employee.value.companyId) return false
      return true
    })
    .map(c => ({ label: `${c.uid}`, value: c.id }))
})

const handleAssignCard = async () => {
  await cardStore.fetchCards({ perPage: 500, companyId: employee.value?.companyId || undefined })
  selectedCardId.value = ''
  showAssignCardModal.value = true
}

const handleConfirmAssignCard = async () => {
  if (!selectedCardId.value) return
  try {
    await cardStore.assignCard(selectedCardId.value, employeeId)
    toast.success('Succes', 'Carte assignee avec succes')
    closeAssignCardModal()
    await employeeStore.fetchEmployee(employeeId)
  } catch (error: any) {
    toast.error('Erreur', error.message || "Erreur lors de l'assignation de la carte")
  }
}

const closeAssignCardModal = () => {
  showAssignCardModal.value = false
  selectedCardId.value = ''
}

async function handleToggleActive() {
  if (!employee.value) return
  try {
    await employeeStore.toggleActive(employeeId)
    toast.success('Succes', employee.value.isActive ? 'Employe desactive' : 'Employe active')
  } catch (error: any) {
    toast.error('Erreur', error.message || 'Erreur lors du changement de statut')
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Details de l'employe</h1>
      <div class="flex space-x-3">
        <AppButton variant="secondary" @click="handleBack">
          <ArrowLeftIcon class="w-4 h-4 mr-1" />
          Retour
        </AppButton>
        <AppButton v-if="canEdit && employee" @click="handleEdit">
          <PencilIcon class="w-4 h-4 mr-1" />
          Modifier
        </AppButton>
        <AppButton
          v-if="canEdit && employee"
          :variant="employee.isActive ? 'danger' : 'primary'"
          @click="handleToggleActive"
        >
          <NoSymbolIcon v-if="employee.isActive" class="w-4 h-4 mr-1" />
          <CheckCircleIcon v-else class="w-4 h-4 mr-1" />
          {{ employee.isActive ? 'Desactiver' : 'Activer' }}
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
              <AppBadge :variant="employee.isActive ? 'success' : 'neutral'">
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
                <AppBadge :variant="employee.biometricEnrolled ? 'success' : 'neutral'">
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
          Selectionnez une carte disponible parmi les cartes non attribuees.
        </p>

        <div class="mt-4">
          <AppSelect
            v-model="selectedCardId"
            :options="availableCardOptions"
            label="Carte RFID"
            placeholder="Selectionner une carte"
          />
          <p v-if="availableCardOptions.length === 0" class="mt-2 text-sm text-gray-500">
            Aucune carte disponible.
          </p>
        </div>

        <div class="mt-6 flex justify-end space-x-3">
          <AppButton variant="secondary" @click="closeAssignCardModal">
            Annuler
          </AppButton>
          <AppButton :disabled="!selectedCardId" @click="handleConfirmAssignCard">
            Assigner
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>
