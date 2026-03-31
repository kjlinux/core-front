<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useDeviceFingerprint } from '@/composables/useDeviceFingerprint'
import { qrcodeApi } from '@/services/api/qrcode.api'
import { employeeApi } from '@/services/api/employee.api'
import { useToast } from '@/composables/useToast'
import type { Employee } from '@/types'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppBadge from '@/components/ui/AppBadge.vue'

const toast = useToast()
const { getOrCreate, getDeviceInfo } = useDeviceFingerprint()

const employees = ref<Employee[]>([])
const selectedEmployeeId = ref('')
const isLoading = ref(false)
const enrolledEmployee = ref<{ name: string; enrolledAt?: string } | null>(null)

// Fingerprint de l'appareil actuellement connecté à cette interface admin
const currentFingerprint = getOrCreate()
const currentDeviceInfo = getDeviceInfo()

onMounted(async () => {
  const response = await employeeApi.getAll({ perPage: 200 })
  employees.value = response.data
})

const employeeOptions = computed(() => [
  { label: 'Selectionner un employe', value: '' },
  ...employees.value.map((e) => ({
    label: `${e.firstName} ${e.lastName} (${e.employeeNumber})`,
    value: e.id,
  })),
])

const selectedEmployee = computed(() =>
  employees.value.find((e) => e.id === selectedEmployeeId.value)
)

/**
 * Enrôlement en deux étapes :
 * 1. L'admin sélectionne l'employé ici (sur l'interface admin)
 * 2. L'employé prend son téléphone et visite la page /qr-scan
 *    → son téléphone génère son propre fingerprint
 *    → l'admin entre ce fingerprint manuellement, ou bien
 *    → l'employé scanne un QR de session (flux plus avancé)
 *
 * Pour simplifier : ici l'admin peut enrôler le téléphone qui est devant lui
 * en demandant à l'employé d'ouvrir la page /qr-scan sur son téléphone,
 * puis l'admin copie le fingerprint affiché.
 */
const manualFingerprint = ref('')
const manualDeviceInfo = ref('')

async function enrollEmployee() {
  if (!selectedEmployeeId.value || !manualFingerprint.value.trim()) {
    toast.error('Selectionnez un employe et renseignez le fingerprint de son appareil')
    return
  }
  isLoading.value = true
  try {
    await qrcodeApi.enrollDevice(
      selectedEmployeeId.value,
      manualFingerprint.value.trim(),
      manualDeviceInfo.value.trim() || undefined
    )
    enrolledEmployee.value = {
      name: `${selectedEmployee.value?.firstName} ${selectedEmployee.value?.lastName}`,
    }
    toast.success('Telephone enrole avec succes')
    manualFingerprint.value = ''
    manualDeviceInfo.value = ''
    selectedEmployeeId.value = ''
    // Rafraîchir la liste
    const response = await employeeApi.getAll({ perPage: 200 })
    employees.value = response.data
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(msg || 'Erreur lors de l\'enrolement')
  } finally {
    isLoading.value = false
  }
}

async function revokeDevice(employeeId: string, name: string) {
  isLoading.value = true
  try {
    await qrcodeApi.revokeDevice(employeeId)
    toast.success(`Telephone de ${name} revoque`)
    const response = await employeeApi.getAll({ perPage: 200 })
    employees.value = response.data
  } catch {
    toast.error('Erreur lors de la revocation')
  } finally {
    isLoading.value = false
  }
}

const enrolledEmployees = computed(() =>
  employees.value.filter((e) => e.deviceFingerprint)
)
const unenrolledEmployees = computed(() =>
  employees.value.filter((e) => e.isActive && !e.deviceFingerprint)
)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Enrolement des telephones</h1>
      <p class="mt-1 text-sm text-gray-500">
        Associez le telephone de chaque employe a son compte pour le pointage QR.
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Formulaire d'enrôlement -->
      <AppCard>
        <h2 class="mb-4 font-semibold text-gray-900">Enroler un telephone</h2>

        <div class="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
          <p class="font-medium">Procedure :</p>
          <ol class="mt-1 space-y-1 text-xs">
            <li>1. Demandez a l'employe d'ouvrir <strong>{{ $router ? '' : '' }}/qr-scan</strong> sur son telephone</li>
            <li>2. La page affiche son identifiant appareil (fingerprint)</li>
            <li>3. Copiez cet identifiant ci-dessous et associez-le a l'employe</li>
          </ol>
        </div>

        <div class="space-y-4">
          <AppSelect
            v-model="selectedEmployeeId"
            label="Employe"
            :options="employeeOptions"
          />

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Identifiant appareil (fingerprint)
              <span class="text-red-500">*</span>
            </label>
            <input
              v-model="manualFingerprint"
              type="text"
              placeholder="ex: a1b2c3d4-xyz789ab"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Info appareil (optionnel)
            </label>
            <input
              v-model="manualDeviceInfo"
              type="text"
              placeholder="ex: iPhone 14 / Safari"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <AppButton
            variant="primary"
            :loading="isLoading"
            :disabled="!selectedEmployeeId || !manualFingerprint.trim()"
            class="w-full"
            @click="enrollEmployee"
          >
            Enroler ce telephone
          </AppButton>
        </div>

        <div v-if="enrolledEmployee" class="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
          Telephone de <strong>{{ enrolledEmployee.name }}</strong> enrole avec succes.
        </div>
      </AppCard>

      <!-- Statistiques rapides -->
      <div class="space-y-4">
        <AppCard class="border-green-100 bg-green-50">
          <p class="text-sm font-medium text-green-800">Telephones enroles</p>
          <p class="text-3xl font-bold text-green-700">{{ enrolledEmployees.length }}</p>
          <p class="text-xs text-green-600">/ {{ employees.filter(e => e.isActive).length }} employes actifs</p>
        </AppCard>

        <AppCard v-if="unenrolledEmployees.length > 0" class="border-yellow-100 bg-yellow-50">
          <p class="mb-2 text-sm font-medium text-yellow-800">
            {{ unenrolledEmployees.length }} employe(s) sans telephone enrole
          </p>
          <ul class="space-y-1">
            <li
              v-for="e in unenrolledEmployees.slice(0, 5)"
              :key="e.id"
              class="text-xs text-yellow-700"
            >
              • {{ e.firstName }} {{ e.lastName }}
            </li>
            <li v-if="unenrolledEmployees.length > 5" class="text-xs text-yellow-600 italic">
              ... et {{ unenrolledEmployees.length - 5 }} autre(s)
            </li>
          </ul>
        </AppCard>
      </div>
    </div>

    <!-- Liste des appareils enrôlés -->
    <AppCard>
      <h2 class="mb-4 font-semibold text-gray-900">Appareils enroles ({{ enrolledEmployees.length }})</h2>
      <div v-if="enrolledEmployees.length === 0" class="py-8 text-center text-sm text-gray-500">
        Aucun telephone enrole pour l'instant.
      </div>
      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="emp in enrolledEmployees"
          :key="emp.id"
          class="flex items-center justify-between py-3"
        >
          <div>
            <p class="text-sm font-medium text-gray-900">{{ emp.firstName }} {{ emp.lastName }}</p>
            <p class="font-mono text-xs text-gray-400">{{ emp.deviceFingerprint }}</p>
            <p v-if="emp.deviceInfo" class="text-xs text-gray-500">{{ emp.deviceInfo }}</p>
          </div>
          <div class="flex items-center gap-3">
            <AppBadge variant="success">Enrole</AppBadge>
            <AppButton
              size="sm"
              variant="ghost"
              class="text-red-600 hover:text-red-700"
              @click="revokeDevice(emp.id, `${emp.firstName} ${emp.lastName}`)"
            >
              Revoquer
            </AppButton>
          </div>
        </div>
      </div>
    </AppCard>
  </div>
</template>
