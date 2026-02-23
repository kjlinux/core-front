<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBiometricStore } from '@/stores/biometric.store'
import { useCompanyStore } from '@/stores/company.store'
import { useEmployeeStore } from '@/stores/employee.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'

const router = useRouter()
const store = useBiometricStore()
const companyStore = useCompanyStore()
const employeeStore = useEmployeeStore()
const toast = useToast()

const step = ref(1)
const selectedCompanyId = ref('')
const selectedEmployeeId = ref('')
const selectedDeviceId = ref('')
const captureStatus = ref<'idle' | 'waiting' | 'capturing' | 'success'>('idle')
const isSubmitting = ref(false)

const companyOptions = computed(() => [
  { label: 'Selectionner une entreprise', value: '' },
  ...companyStore.companies.map((c) => ({ label: c.name, value: c.id })),
])

const employeeOptions = computed(() => {
  const list = selectedCompanyId.value
    ? employeeStore.employees.filter((e) => e.companyId === selectedCompanyId.value)
    : employeeStore.employees
  return [
    { label: 'Selectionner un employe', value: '' },
    ...list.map((e) => ({ label: `${e.firstName} ${e.lastName}`, value: e.id })),
  ]
})

const deviceOptions = computed(() => [
  { label: 'Selectionner un terminal', value: '' },
  ...store.devices.map((d) => ({ label: `${d.name} (${d.serialNumber})`, value: d.id })),
])

const selectedEmployee = computed(() => employeeStore.employees.find((e) => e.id === selectedEmployeeId.value))
const selectedDevice = computed(() => store.devices.find((d) => d.id === selectedDeviceId.value))

const captureStatusLabel = computed(() => {
  switch (captureStatus.value) {
    case 'waiting': return 'En attente...'
    case 'capturing': return 'Capture en cours...'
    case 'success': return 'Succes!'
    default: return 'Pret'
  }
})

function goToStep2() {
  if (!selectedEmployeeId.value || !selectedDeviceId.value) {
    toast.showError('Veuillez selectionner un employe et un terminal')
    return
  }
  step.value = 2
  captureStatus.value = 'idle'
}

async function launchCapture() {
  captureStatus.value = 'waiting'
  await new Promise((r) => setTimeout(r, 1500))
  captureStatus.value = 'capturing'
  await new Promise((r) => setTimeout(r, 2000))
  captureStatus.value = 'success'
}

async function confirmEnrollment() {
  if (captureStatus.value !== 'success') {
    toast.showError("Veuillez d'abord capturer l'empreinte")
    return
  }
  isSubmitting.value = true
  try {
    await store.startEnrollment({
      employeeId: selectedEmployeeId.value,
      employeeName: selectedEmployee.value ? `${selectedEmployee.value.firstName} ${selectedEmployee.value.lastName}` : '',
      deviceId: selectedDeviceId.value,
      status: 'enrolled',
      templateHash: Math.random().toString(36).substring(2),
    })
    toast.showSuccess('Inscription biometrique enregistree')
    router.push('/biometrique/enrollment')
  } catch {
    toast.showError("Erreur lors de l'inscription")
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    companyStore.fetchCompanies(),
    employeeStore.fetchEmployees(),
    store.fetchDevices(),
  ])
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <AppButton variant="ghost" @click="router.push('/biometrique/enrollment')">
        &larr; Retour
      </AppButton>
      <h1 class="text-2xl font-bold text-gray-900">Nouvelle inscription biometrique</h1>
    </div>

    <!-- Steps indicator -->
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
          :class="step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'"
        >1</div>
        <span class="text-sm font-medium" :class="step >= 1 ? 'text-primary' : 'text-gray-400'">Selection</span>
      </div>
      <div class="h-px flex-1 bg-gray-200"></div>
      <div class="flex items-center gap-2">
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
          :class="step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'"
        >2</div>
        <span class="text-sm font-medium" :class="step >= 2 ? 'text-primary' : 'text-gray-400'">Capture</span>
      </div>
    </div>

    <!-- Step 1: Selection -->
    <AppCard v-if="step === 1" title="Etape 1 - Selection de l'employe et du terminal">
      <div class="space-y-4 max-w-md">
        <AppSelect
          v-model="selectedCompanyId"
          label="Entreprise"
          :options="companyOptions"
        />
        <AppSelect
          v-model="selectedEmployeeId"
          label="Employe *"
          :options="employeeOptions"
        />
        <AppSelect
          v-model="selectedDeviceId"
          label="Terminal biometrique *"
          :options="deviceOptions"
        />
        <div class="pt-4">
          <AppButton variant="primary" @click="goToStep2">Continuer</AppButton>
        </div>
      </div>
    </AppCard>

    <!-- Step 2: Capture -->
    <AppCard v-if="step === 2" title="Etape 2 - Capture de l'empreinte">
      <div class="space-y-6">
        <div class="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p class="text-xs text-gray-500 uppercase">Employe</p>
            <p class="font-semibold text-gray-900">
              {{ selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : '-' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 uppercase">Terminal</p>
            <p class="font-semibold text-gray-900">{{ selectedDevice?.name ?? '-' }}</p>
          </div>
        </div>

        <div class="flex flex-col items-center gap-6">
          <div
            class="w-48 h-48 rounded-2xl border-4 flex flex-col items-center justify-center gap-3"
            :class="{
              'border-gray-300 bg-gray-50': captureStatus === 'idle',
              'border-yellow-400 bg-yellow-50': captureStatus === 'waiting',
              'border-blue-400 bg-blue-50 animate-pulse': captureStatus === 'capturing',
              'border-green-400 bg-green-50': captureStatus === 'success',
            }"
          >
            <div class="text-5xl">
              <span v-if="captureStatus === 'success'" class="text-green-500">&#10003;</span>
              <span v-else class="text-gray-400">[~]</span>
            </div>
            <p class="text-sm text-center font-medium" :class="{
              'text-gray-500': captureStatus === 'idle',
              'text-yellow-600': captureStatus === 'waiting',
              'text-blue-600': captureStatus === 'capturing',
              'text-green-600': captureStatus === 'success',
            }">
              {{ captureStatus === 'idle' ? 'Placez votre doigt sur le lecteur' : captureStatusLabel }}
            </p>
          </div>

          <div class="flex gap-3">
            <AppButton variant="secondary" @click="step = 1">Retour</AppButton>
            <AppButton
              v-if="captureStatus !== 'success'"
              variant="primary"
              :disabled="captureStatus === 'capturing' || captureStatus === 'waiting'"
              @click="launchCapture"
            >
              Lancer la capture
            </AppButton>
            <AppButton
              v-else
              variant="primary"
              :loading="isSubmitting"
              @click="confirmEnrollment"
            >
              Confirmer l'inscription
            </AppButton>
          </div>
        </div>
      </div>
    </AppCard>
  </div>
</template>
