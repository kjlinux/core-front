<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQrcodeStore } from '@/stores/qrcode.store'
import { usePermissions } from '@/composables/usePermissions'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import DataTable from '@/components/data-display/DataTable.vue'
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'

const store = useQrcodeStore()
const router = useRouter()
const permissions = usePermissions()
const toast = useToast()

const confirmRevokeId = ref<string | null>(null)

const columns = [
  { key: 'siteName', label: 'Site' },
  { key: 'label', label: 'Libelle' },
  { key: 'token', label: 'Token' },
  { key: 'isActive', label: 'Statut' },
  { key: 'generatedAt', label: 'Genere le' },
  { key: 'actions', label: 'Actions' },
]

onMounted(() => store.fetchQrCodes())

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR')
}

async function handleRevoke(id: string) {
  try {
    await store.revokeQrCode(id)
    toast.success('QR Code revoque')
    confirmRevokeId.value = null
  } catch {
    toast.error('Erreur lors de la revocation')
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">QR Codes de sites</h1>
        <p class="mt-1 text-sm text-gray-500">
          Un QR Code par site, affiché à l'entrée. Les employés scannent depuis leur téléphone enrôlé.
        </p>
      </div>
      <AppButton
        v-if="permissions.isAdminOrSuperOrTech.value"
        variant="primary"
        @click="router.push({ name: 'qrcode-generate' })"
      >
        <PlusIcon class="mr-1 h-4 w-4" />
        Generer un QR Code
      </AppButton>
    </div>

    <AppCard>
      <DataTable :columns="columns" :data="store.qrCodes" :loading="store.isLoading">
        <template #siteName="{ row }">
          <span class="font-medium text-gray-900">{{ row.siteName ?? '-' }}</span>
        </template>

        <template #label="{ row }">
          <span class="text-sm text-gray-600">{{ row.label ?? '-' }}</span>
        </template>

        <template #isActive="{ row }">
          <AppBadge :variant="row.isActive ? 'success' : 'neutral'">
            {{ row.isActive ? 'Actif' : 'Revoque' }}
          </AppBadge>
        </template>

        <template #generatedAt="{ row }">
          {{ formatDate(row.generatedAt) }}
        </template>

        <template #token="{ row }">
          <span class="font-mono text-xs text-gray-600">{{ row.token.slice(0, 12) }}...</span>
        </template>

        <template #actions="{ row }">
          <div class="flex items-center gap-2" @click.stop>
            <AppButton
              v-if="permissions.isAdminOrSuperOrTech.value && row.isActive"
              size="sm"
              variant="ghost"
              class="text-red-600 hover:text-red-700"
              title="Revoquer"
              @click="confirmRevokeId = row.id"
            >
              <TrashIcon class="h-4 w-4" />
            </AppButton>
          </div>
        </template>
      </DataTable>
    </AppCard>

    <!-- Confirm revoke modal -->
    <div
      v-if="confirmRevokeId"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="confirmRevokeId = null"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 class="mb-2 text-lg font-semibold text-gray-900">Revoquer le QR Code</h3>
        <p class="mb-6 text-sm text-gray-600">
          Etes-vous sur de vouloir revoquer ce QR Code ? Les employes ne pourront plus pointer via ce code de site.
        </p>
        <div class="flex justify-end gap-3">
          <AppButton variant="ghost" @click="confirmRevokeId = null">Annuler</AppButton>
          <AppButton variant="danger" @click="handleRevoke(confirmRevokeId!)">Revoquer</AppButton>
        </div>
      </div>
    </div>
  </div>
</template>
