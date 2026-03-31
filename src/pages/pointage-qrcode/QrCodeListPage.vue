<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import QRCode from 'qrcode'
import { useQrcodeStore } from '@/stores/qrcode.store'
import { usePermissions } from '@/composables/usePermissions'
import { useToast } from '@/composables/useToast'
import type { QrCode } from '@/types'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import DataTable from '@/components/data-display/DataTable.vue'
import { PlusIcon, TrashIcon, ArrowDownTrayIcon, PrinterIcon } from '@heroicons/vue/24/outline'

const store = useQrcodeStore()
const router = useRouter()
const permissions = usePermissions()
const toast = useToast()

const confirmRevokeId = ref<string | null>(null)
const viewingQr = ref<QrCode | null>(null)
const qrDataUrl = ref<string | null>(null)

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

async function handleRowClick(row: QrCode) {
  if (!row.isActive) return
  viewingQr.value = row
  qrDataUrl.value = null
  const scanUrl = `${window.location.origin}/qr-scan?token=${row.token}`
  qrDataUrl.value = await QRCode.toDataURL(scanUrl, { width: 300, margin: 2 })
}

function closeViewModal() {
  viewingQr.value = null
  qrDataUrl.value = null
}

function downloadQr() {
  if (!qrDataUrl.value || !viewingQr.value) return
  const a = document.createElement('a')
  a.href = qrDataUrl.value
  a.download = `qr-site-${viewingQr.value.siteName ?? 'site'}.png`
  a.click()
}

function printQr() {
  if (!qrDataUrl.value || !viewingQr.value) return
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`
    <html><body style="display:flex;flex-direction:column;align-items:center;padding:40px;font-family:sans-serif">
      <h2 style="margin-bottom:8px">${viewingQr.value.siteName ?? 'Site'}</h2>
      ${viewingQr.value.label ? `<p style="color:#64748b;margin-bottom:16px">${viewingQr.value.label}</p>` : ''}
      <img src="${qrDataUrl.value}" style="width:280px;height:280px" />
      <p style="margin-top:16px;font-size:13px;color:#94a3b8">Scannez ce QR Code avec votre telephone pour pointer</p>
    </body></html>
  `)
  win.document.close()
  win.print()
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
      <DataTable :columns="columns" :data="store.qrCodes" :loading="store.isLoading" @row-click="handleRowClick">
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

    <!-- Modal voir QR code -->
    <AppModal
      :is-open="!!viewingQr"
      :title="viewingQr?.siteName ?? 'QR Code'"
      size="sm"
      @close="closeViewModal"
    >
      <div class="flex flex-col items-center gap-4">
        <p v-if="viewingQr?.label" class="text-sm text-gray-500">{{ viewingQr.label }}</p>
        <div v-if="!qrDataUrl" class="flex h-40 items-center justify-center">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-600" />
        </div>
        <img v-else :src="qrDataUrl" alt="QR Code" class="rounded-lg border border-gray-200" />
        <p class="text-xs text-gray-400">
          Ce QR Code est unique pour ce site.
        </p>
      </div>

      <template #footer>
        <AppButton variant="ghost" @click="downloadQr">
          <ArrowDownTrayIcon class="mr-1 h-4 w-4" />
          Telecharger
        </AppButton>
        <AppButton variant="outline" @click="printQr">
          <PrinterIcon class="mr-1 h-4 w-4" />
          Imprimer
        </AppButton>
      </template>
    </AppModal>

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
