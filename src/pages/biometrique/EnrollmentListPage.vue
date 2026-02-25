<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBiometricStore } from '@/stores/biometric.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import { ArrowPathIcon, TrashIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const store = useBiometricStore()
const toast = useToast()

const filterStatus = ref('')
const filterDevice = ref('')

const statusOptions = [
  { label: 'Tous les statuts', value: '' },
  { label: 'En attente', value: 'pending' },
  { label: 'Inscrit', value: 'enrolled' },
  { label: 'Echec', value: 'failed' },
]

const deviceOptions = computed(() => [
  { label: 'Tous les terminaux', value: '' },
  ...store.devices.map((d) => ({ label: d.name, value: d.id })),
])

const filteredEnrollments = computed(() => {
  let list = store.enrollments
  if (filterStatus.value) {
    list = list.filter((e) => e.status === filterStatus.value)
  }
  if (filterDevice.value) {
    list = list.filter((e) => e.deviceId === filterDevice.value)
  }
  return list
})

function getStatusVariant(status: string) {
  switch (status) {
    case 'enrolled': return 'success'
    case 'failed': return 'danger'
    default: return 'warning'
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'enrolled': return 'Inscrit'
    case 'failed': return 'Echec'
    default: return 'En attente'
  }
}

function formatDate(date?: string) {
  if (!date) return '-'
  return new Date(date).toLocaleString('fr-FR')
}

function truncateHash(hash: string) {
  return hash.length > 12 ? hash.substring(0, 12) + '...' : hash
}

async function handleDelete(id: string) {
  try {
    await store.deleteEnrollment(id)
    toast.showSuccess('Inscription supprimee')
  } catch {
    toast.showError("Erreur lors de la suppression")
  }
}

onMounted(async () => {
  await Promise.all([store.fetchEnrollments(), store.fetchDevices()])
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Inscriptions biometriques</h1>
        <p class="text-sm text-gray-500 mt-1">Liste des empreintes digitales enregistrees</p>
      </div>
      <AppButton variant="primary" @click="router.push('/biometrique/enrollment/new')">
        Nouvelle inscription
      </AppButton>
    </div>

    <AppCard>
      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <AppSelect v-model="filterStatus" :options="statusOptions" class="w-full sm:w-48" />
        <AppSelect v-model="filterDevice" :options="deviceOptions" class="w-full sm:w-64" />
      </div>

      <div v-if="store.isLoading" class="flex justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>

      <div v-else-if="filteredEnrollments.length === 0" class="text-center py-12 text-gray-500">
        Aucune inscription trouvee
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employe</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Terminal</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date inscription</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Template</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-100">
            <tr v-for="enrollment in filteredEnrollments" :key="enrollment.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ enrollment.employeeName }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ store.devices.find((d) => d.id === enrollment.deviceId)?.name ?? enrollment.deviceId }}
              </td>
              <td class="px-4 py-3">
                <AppBadge :variant="getStatusVariant(enrollment.status)">
                  {{ getStatusLabel(enrollment.status) }}
                </AppBadge>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(enrollment.enrolledAt) }}</td>
              <td class="px-4 py-3 font-mono text-xs text-gray-500">{{ truncateHash(enrollment.templateHash) }}</td>
              <td class="px-4 py-3">
                <div class="flex gap-2">
                  <AppButton
                    v-if="enrollment.status === 'failed'"
                    size="sm"
                    variant="ghost"
                    @click="router.push('/biometrique/enrollment/new')"
                    title="Recommencer"
                  >
                    <ArrowPathIcon class="w-4 h-4" />
                  </AppButton>
                  <AppButton size="sm" variant="ghost" class="text-red-600 hover:text-red-700" @click="handleDelete(enrollment.id)" title="Supprimer">
                    <TrashIcon class="w-4 h-4" />
                  </AppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>
  </div>
</template>
