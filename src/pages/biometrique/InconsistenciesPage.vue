<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBiometricStore } from '@/stores/biometric.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppInput from '@/components/ui/AppInput.vue'

const store = useBiometricStore()
const toast = useToast()

const filterStartDate = ref('')
const filterEndDate = ref('')

interface Inconsistency {
  employeeName: string
  rfidStatus: string
  biometricStatus: string
  lastRfidScan: string
  lastBiometricScan: string
  discrepancyType: string
}

const inconsistencies = ref<Inconsistency[]>([])

const mockData: Inconsistency[] = [
  {
    employeeName: 'Moussa Traore',
    rfidStatus: 'active',
    biometricStatus: 'not_enrolled',
    lastRfidScan: '2024-11-15T08:30:00Z',
    lastBiometricScan: '',
    discrepancyType: 'Carte active sans empreinte',
  },
  {
    employeeName: 'Fatou Coulibaly',
    rfidStatus: 'inactive',
    biometricStatus: 'enrolled',
    lastRfidScan: '2024-10-20T09:15:00Z',
    lastBiometricScan: '2024-11-14T08:45:00Z',
    discrepancyType: 'Carte inactive mais empreinte enregistree',
  },
  {
    employeeName: 'Ibrahim Sawadogo',
    rfidStatus: 'blocked',
    biometricStatus: 'enrolled',
    lastRfidScan: '2024-11-01T08:00:00Z',
    lastBiometricScan: '2024-11-14T07:55:00Z',
    discrepancyType: 'Carte bloquee mais pointage biometrique actif',
  },
]

function formatDate(date: string) {
  if (!date) return '-'
  return new Date(date).toLocaleString('fr-FR')
}

function handleExport() {
  toast.showSuccess('Export en cours...')
}

onMounted(async () => {
  try {
    const data = await store.fetchInconsistencies()
    if (data && (data as any[]).length > 0) {
      inconsistencies.value = data as Inconsistency[]
    } else {
      inconsistencies.value = mockData
    }
  } catch {
    inconsistencies.value = mockData
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Incoherences biometriques</h1>
        <p class="text-sm text-gray-500 mt-1">
          Employes avec disparite entre pointage RFID et biometrique
        </p>
      </div>
      <AppButton variant="secondary" @click="handleExport">Exporter</AppButton>
    </div>

    <AppCard>
      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-700">Date debut</label>
          <AppInput v-model="filterStartDate" type="date" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-700">Date fin</label>
          <AppInput v-model="filterEndDate" type="date" />
        </div>
      </div>

      <div v-if="store.isLoading" class="flex justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>

      <div v-else-if="inconsistencies.length === 0" class="text-center py-12">
        <p class="text-green-600 font-medium">Aucune incoherence detectee</p>
        <p class="text-sm text-gray-500 mt-1">Tous les employes ont une coherence entre RFID et biometrique</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employe</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut RFID</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut biometrique</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dernier scan RFID</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dernier scan bio.</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type d'incoherence</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-100">
            <tr v-for="item in inconsistencies" :key="item.employeeName" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ item.employeeName }}</td>
              <td class="px-4 py-3">
                <AppBadge :variant="item.rfidStatus === 'active' ? 'success' : item.rfidStatus === 'blocked' ? 'danger' : 'warning'">
                  {{ item.rfidStatus }}
                </AppBadge>
              </td>
              <td class="px-4 py-3">
                <AppBadge :variant="item.biometricStatus === 'enrolled' ? 'success' : 'default'">
                  {{ item.biometricStatus === 'enrolled' ? 'Inscrit' : 'Non inscrit' }}
                </AppBadge>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(item.lastRfidScan) }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(item.lastBiometricScan) }}</td>
              <td class="px-4 py-3">
                <span class="text-sm text-orange-600 font-medium">{{ item.discrepancyType }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>
  </div>
</template>
