<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBiometricStore } from '@/stores/biometric.store'
import { useToast } from '@/composables/useToast'
import StatCard from '@/components/data-display/StatCard.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import type { TableColumn } from '@/types/common'

const router = useRouter()
const biometricStore = useBiometricStore()
const toast = useToast()

const totalDevices = computed(() => biometricStore.devices.length)
const onlineDevices = computed(() => biometricStore.devices.filter(d => d.isOnline).length)
const totalEnrollments = computed(() => biometricStore.enrollments.length)
const pendingEnrollments = computed(() => biometricStore.enrollments.filter(e => e.status === 'pending').length)

const deviceColumns: TableColumn[] = [
  { key: 'serialNumber', label: 'Numero de serie', sortable: true },
  { key: 'name', label: 'Nom', sortable: true },
  { key: 'siteId', label: 'Site', sortable: false },
  { key: 'statusLabel', label: 'Statut', sortable: false },
  { key: 'enrolledCount', label: 'Inscrits', sortable: true },
  { key: 'firmwareVersion', label: 'Firmware', sortable: false },
  { key: 'lastSyncAt', label: 'Derniere synchro', sortable: true },
]

const devicesTableData = computed(() =>
  biometricStore.devices.map(d => ({
    ...d,
    statusLabel: d.isOnline ? 'En ligne' : 'Hors ligne',
    lastSyncAt: d.lastSyncAt ? new Date(d.lastSyncAt).toLocaleString('fr-FR') : '-',
  }))
)

function syncDevice(deviceId: string) {
  toast.success('Synchronisation lancee', `Le terminal ${deviceId} est en cours de synchronisation.`)
}

function viewDevice(deviceId: string) {
  router.push(`/biometrique/devices/${deviceId}`)
}

onMounted(() => {
  biometricStore.fetchDevices()
  biometricStore.fetchEnrollments()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Tableau de bord Biometrique</h1>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total terminaux"
        :value="totalDevices"
        icon-bg-class="bg-blue-100"
        icon-color-class="text-blue-600"
      />
      <StatCard
        title="Terminaux en ligne"
        :value="onlineDevices"
        icon-bg-class="bg-green-100"
        icon-color-class="text-green-600"
      />
      <StatCard
        title="Total inscriptions"
        :value="totalEnrollments"
        icon-bg-class="bg-purple-100"
        icon-color-class="text-purple-600"
      />
      <StatCard
        title="Inscriptions en attente"
        :value="pendingEnrollments"
        icon-bg-class="bg-yellow-100"
        icon-color-class="text-yellow-600"
      />
    </div>

    <!-- Devices Section -->
    <AppCard title="Terminaux biometriques" subtitle="Liste de tous les terminaux enregistres">
      <template #actions>
        <AppButton size="sm" variant="secondary" @click="router.push('/biometrique/devices')">
          Voir tous
        </AppButton>
      </template>

      <div v-if="biometricStore.isLoading" class="flex justify-center py-12">
        <AppSpinner />
      </div>

      <div v-else-if="biometricStore.devices.length === 0" class="py-12 text-center text-sm text-gray-500">
        Aucun terminal enregistre.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Numero de serie
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Nom
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Site
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Statut
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Inscrits
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Firmware
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Derniere synchro
              </th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr
              v-for="device in biometricStore.devices"
              :key="device.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="whitespace-nowrap px-4 py-4 text-sm font-mono text-gray-900">
                {{ device.serialNumber }}
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                {{ device.name }}
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                {{ device.siteId }}
              </td>
              <td class="whitespace-nowrap px-4 py-4">
                <AppBadge :variant="device.isOnline ? 'success' : 'danger'" size="sm">
                  {{ device.isOnline ? 'En ligne' : 'Hors ligne' }}
                </AppBadge>
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                {{ device.enrolledCount }}
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-sm font-mono text-gray-500">
                {{ device.firmwareVersion }}
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                {{ device.lastSyncAt ? new Date(device.lastSyncAt).toLocaleString('fr-FR') : '-' }}
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <AppButton size="sm" variant="outline" @click="viewDevice(device.id)">
                    Detail
                  </AppButton>
                  <AppButton size="sm" variant="secondary" @click="syncDevice(device.id)">
                    Synchroniser
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
