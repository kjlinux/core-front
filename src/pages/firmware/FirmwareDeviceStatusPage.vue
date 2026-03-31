<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useFirmwareStore } from '@/stores/firmware.store'
import { usePermissions } from '@/composables/usePermissions'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import DataTable from '@/components/data-display/DataTable.vue'
import type { DeviceFirmwareStatus, DeviceKind } from '@/types'

const store = useFirmwareStore()
const permissions = usePermissions()
const toast = useToast()

const deviceKindFilter = ref<DeviceKind | ''>('')
const selectedDevice = ref<DeviceFirmwareStatus | null>(null)
const selectedFirmwareVersionId = ref('')

const columns = [
  { key: 'deviceName', label: 'Terminal' },
  { key: 'deviceKind', label: 'Type' },
  { key: 'currentVersion', label: 'Version actuelle' },
  { key: 'targetVersion', label: 'Version cible' },
  { key: 'updateStatus', label: 'Statut' },
  { key: 'lastUpdatedAt', label: 'Derniere MAJ' },
  { key: 'actions', label: 'Actions' },
]

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  success: 'success',
  in_progress: 'info',
  pending: 'warning',
  failed: 'danger',
  skipped: 'neutral',
}

const statusLabel: Record<string, string> = {
  success: 'A jour',
  in_progress: 'En cours',
  pending: 'En attente',
  failed: 'Echec',
  skipped: 'Ignore',
}

const filteredStatuses = computed(() => {
  if (!deviceKindFilter.value) return store.deviceStatuses
  return store.deviceStatuses.filter((d) => d.deviceKind === deviceKindFilter.value)
})

const compatibleVersions = computed(() => {
  if (!selectedDevice.value) return []
  return store.versions.filter((v) => v.deviceKind === selectedDevice.value!.deviceKind)
})

onMounted(async () => {
  await Promise.all([store.fetchDeviceStatuses(), store.fetchVersions({})])
})

function openUpdateModal(device: DeviceFirmwareStatus) {
  selectedDevice.value = device
  selectedFirmwareVersionId.value = ''
}

async function confirmUpdate() {
  if (!selectedDevice.value || !selectedFirmwareVersionId.value) return
  try {
    await store.triggerUpdate(selectedDevice.value.deviceId, selectedFirmwareVersionId.value)
    toast.success('Mise a jour declenchee')
    selectedDevice.value = null
    await store.fetchDeviceStatuses()
  } catch {
    toast.error('Erreur lors du declenchement')
  }
}

function formatDate(d?: string) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('fr-FR')
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">Statut des terminaux</h1>

    <AppCard>
      <div class="mb-4 flex items-center gap-4">
        <select
          v-model="deviceKindFilter"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tous les types</option>
          <option value="rfid">RFID</option>
          <option value="biometric">Biometrique</option>
        </select>
      </div>

      <DataTable :columns="columns" :data="filteredStatuses" :loading="store.isLoading">
        <template #deviceKind="{ row }">
          <AppBadge variant="info">{{ row.deviceKind === 'rfid' ? 'RFID' : 'Biometrique' }}</AppBadge>
        </template>
        <template #currentVersion="{ row }">
          <span class="font-mono text-sm">{{ row.currentVersion || '-' }}</span>
        </template>
        <template #targetVersion="{ row }">
          <span class="font-mono text-sm text-blue-600">{{ row.targetVersion || '-' }}</span>
        </template>
        <template #updateStatus="{ row }">
          <AppBadge :variant="statusVariant[row.updateStatus] ?? 'neutral'">
            {{ statusLabel[row.updateStatus] ?? row.updateStatus }}
          </AppBadge>
        </template>
        <template #lastUpdatedAt="{ row }">{{ formatDate(row.lastUpdatedAt) }}</template>
        <template #actions="{ row }">
          <div class="flex items-center gap-2" @click.stop>
            <AppButton
              v-if="permissions.isSetupRole.value"
              size="sm"
              variant="primary"
              @click="openUpdateModal(row)"
            >
              Mettre a jour
            </AppButton>
          </div>
        </template>
      </DataTable>
    </AppCard>

    <!-- Modal declenchement OTA -->
    <div
      v-if="selectedDevice"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="selectedDevice = null"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 class="mb-1 text-lg font-semibold text-gray-900">Mettre a jour le terminal</h3>
        <p class="mb-4 text-sm text-gray-600">
          Terminal : <span class="font-medium">{{ selectedDevice.deviceName }}</span>
          — Version actuelle : <span class="font-mono text-sm">{{ selectedDevice.currentVersion || 'inconnue' }}</span>
        </p>

        <div class="mb-6">
          <label class="mb-1 block text-sm font-medium text-gray-700">Choisir la version cible</label>
          <select
            v-model="selectedFirmwareVersionId"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>Selectionner une version</option>
            <option v-for="v in compatibleVersions" :key="v.id" :value="v.id">
              {{ v.version }}{{ v.isAutoUpdate ? ' (auto)' : '' }}
            </option>
          </select>
          <p v-if="compatibleVersions.length === 0" class="mt-1 text-xs text-gray-500">
            Aucune version disponible pour ce type de terminal.
          </p>
        </div>

        <div class="flex justify-end gap-3">
          <AppButton variant="ghost" @click="selectedDevice = null">Annuler</AppButton>
          <AppButton
            variant="primary"
            :disabled="!selectedFirmwareVersionId || store.isLoading"
            @click="confirmUpdate"
          >
            Declencher la mise a jour
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>
