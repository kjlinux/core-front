<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBiometricStore } from '@/stores/biometric.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'

const route = useRoute()
const router = useRouter()
const store = useBiometricStore()
const toast = useToast()

const deviceId = route.params.id as string

const device = computed(() => store.devices.find((d) => d.id === deviceId) ?? store.currentDevice)
const deviceEnrollments = computed(() => store.enrollments.filter((e) => e.deviceId === deviceId))

function formatDate(date: string) {
  return new Date(date).toLocaleString('fr-FR')
}

async function handleSync() {
  try {
    await store.syncDevice(deviceId)
    toast.showSuccess('Synchronisation lancee')
  } catch {
    toast.showError('Erreur lors de la synchronisation')
  }
}

async function handleDeleteEnrollment(enrollmentId: string) {
  try {
    await store.deleteEnrollment(enrollmentId)
    toast.showSuccess('Inscription supprimee')
  } catch {
    toast.showError("Erreur lors de la suppression")
  }
}

onMounted(async () => {
  await Promise.all([store.fetchDevices(), store.fetchEnrollments()])
  if (!device.value) {
    await store.fetchDevice(deviceId)
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <AppButton variant="ghost" @click="router.push('/biometrique/devices')">
        &larr; Retour
      </AppButton>
      <h1 class="text-2xl font-bold text-gray-900">Detail du terminal</h1>
    </div>

    <div v-if="store.isLoading && !device" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>

    <template v-else-if="device">
      <AppCard title="Informations du terminal">
        <div class="flex items-start justify-between">
          <div class="grid grid-cols-2 gap-6">
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">Nom</p>
              <p class="mt-1 font-semibold text-gray-900">{{ device.name }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">Numero de serie</p>
              <p class="mt-1 font-mono text-gray-900">{{ device.serialNumber }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">Statut</p>
              <AppBadge :variant="device.isOnline ? 'success' : 'danger'" class="mt-1">
                {{ device.isOnline ? 'En ligne' : 'Hors ligne' }}
              </AppBadge>
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">Version firmware</p>
              <p class="mt-1 text-gray-900">{{ device.firmwareVersion }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">Employes inscrits</p>
              <p class="mt-1 text-2xl font-bold text-primary">{{ device.enrolledCount }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">Derniere synchronisation</p>
              <p class="mt-1 text-gray-900">{{ formatDate(device.lastSyncAt) }}</p>
            </div>
          </div>
          <AppButton variant="primary" @click="handleSync">Synchroniser</AppButton>
        </div>
      </AppCard>

      <AppCard title="Employes inscrits">
        <div v-if="deviceEnrollments.length === 0" class="text-center py-8 text-gray-500">
          Aucune inscription sur ce terminal
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employe</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date inscription</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="enrollment in deviceEnrollments" :key="enrollment.id" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ enrollment.employeeName }}</td>
                <td class="px-4 py-3">
                  <AppBadge
                    :variant="enrollment.status === 'enrolled' ? 'success' : enrollment.status === 'failed' ? 'danger' : 'warning'"
                  >
                    {{ enrollment.status === 'enrolled' ? 'Inscrit' : enrollment.status === 'failed' ? 'Echec' : 'En attente' }}
                  </AppBadge>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">
                  {{ enrollment.enrolledAt ? formatDate(enrollment.enrolledAt) : '-' }}
                </td>
                <td class="px-4 py-3">
                  <AppButton size="sm" variant="danger" @click="handleDeleteEnrollment(enrollment.id)">
                    Supprimer
                  </AppButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>
    </template>

    <div v-else class="text-center py-12 text-gray-500">
      Terminal introuvable
    </div>
  </div>
</template>
