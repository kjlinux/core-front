<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFirmwareStore } from '@/stores/firmware.store'
import { usePermissions } from '@/composables/usePermissions'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import DataTable from '@/components/data-display/DataTable.vue'
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'

const store = useFirmwareStore()
const router = useRouter()
const permissions = usePermissions()
const toast = useToast()

const deviceKindFilter = ref('')
const confirmDeleteId = ref<string | null>(null)

const columns = [
  { key: 'version', label: 'Version' },
  { key: 'deviceKind', label: 'Type' },
  { key: 'description', label: 'Description' },
  { key: 'fileSize', label: 'Taille' },
  { key: 'isAutoUpdate', label: 'Auto' },
  { key: 'uploadedAt', label: 'Mis en ligne' },
  { key: 'actions', label: 'Actions' },
]

onMounted(() => loadData())

async function loadData() {
  await store.fetchVersions(deviceKindFilter.value ? { deviceKind: deviceKindFilter.value } : {})
}

function formatSize(bytes?: number) {
  if (!bytes) return '-'
  return (bytes / 1024).toFixed(1) + ' KB'
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR')
}

async function toggleAutoUpdate(id: string, current: boolean) {
  try {
    await store.setAutoUpdate(id, !current)
    toast.success('Mise a jour automatique modifiee')
  } catch {
    toast.error('Erreur')
  }
}

async function handleDelete(id: string) {
  try {
    await store.deleteVersion(id)
    toast.success('Version supprimee')
    confirmDeleteId.value = null
  } catch {
    toast.error('Erreur lors de la suppression')
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Versions Firmware</h1>
      <AppButton
        v-if="permissions.isSetupRole.value"
        variant="primary"
        @click="router.push({ name: 'firmware-upload' })"
      >
        <PlusIcon class="mr-1 h-4 w-4" />
        Telecharger firmware
      </AppButton>
    </div>

    <AppCard>
      <div class="mb-4 flex items-center gap-4">
        <select
          v-model="deviceKindFilter"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="loadData"
        >
          <option value="">Tous les types</option>
          <option value="rfid">RFID</option>
          <option value="biometric">Biometrique</option>
        </select>
      </div>

      <DataTable :columns="columns" :data="store.versions" :loading="store.isLoading">
        <template #deviceKind="{ row }">
          <AppBadge variant="info">{{ row.deviceKind === 'rfid' ? 'RFID' : 'Biometrique' }}</AppBadge>
        </template>
        <template #fileSize="{ row }">{{ formatSize(row.fileSize) }}</template>
        <template #isAutoUpdate="{ row }">
          <AppToggle
            :modelValue="row.isAutoUpdate"
            :disabled="!permissions.isSetupRole.value"
            @update:modelValue="toggleAutoUpdate(row.id, row.isAutoUpdate)"
          />
        </template>
        <template #uploadedAt="{ row }">{{ formatDate(row.uploadedAt) }}</template>
        <template #actions="{ row }">
          <div class="flex items-center gap-2" @click.stop>
            <AppButton
              v-if="permissions.isSuperAdmin.value"
              size="sm"
              variant="ghost"
              class="text-red-600 hover:text-red-700"
              title="Supprimer"
              @click="confirmDeleteId = row.id"
            >
              <TrashIcon class="h-4 w-4" />
            </AppButton>
          </div>
        </template>
      </DataTable>
    </AppCard>

    <div
      v-if="confirmDeleteId"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="confirmDeleteId = null"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 class="mb-2 text-lg font-semibold text-gray-900">Supprimer cette version</h3>
        <p class="mb-6 text-sm text-gray-600">Cette action est irreversible.</p>
        <div class="flex justify-end gap-3">
          <AppButton variant="ghost" @click="confirmDeleteId = null">Annuler</AppButton>
          <AppButton variant="danger" @click="handleDelete(confirmDeleteId!)">Supprimer</AppButton>
        </div>
      </div>
    </div>
  </div>
</template>
