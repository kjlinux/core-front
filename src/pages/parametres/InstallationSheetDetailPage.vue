<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  installationApi,
  INSTALLATION_SOLUTION_LABELS,
  type InstallationSheet,
} from '@/services/api/installation.api'
import { ArrowLeftIcon, PrinterIcon } from '@heroicons/vue/24/outline'
import { useToast } from '@/composables/useToast'
import { extractApiErrorMessage } from '@/utils/api-error'
import { followupStatusLabel, followupTypeLabel } from '@/services/api/followup.api'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const sheet = ref<InstallationSheet | null>(null)
const loading = ref(true)
const pdfLoading = ref(false)

function fmtDate(d?: string | null) {
  return d ? new Date(d).toLocaleDateString('fr-FR') : '-'
}

function statusVariant(s: string) {
  return s === 'done' ? 'success' : s === 'escalated' ? 'danger' : s === 'skipped' ? 'neutral' : 'warning'
}

/** Génère le PDF côté serveur et l'ouvre dans un nouvel onglet. */
async function openPdf() {
  if (!sheet.value || pdfLoading.value) return
  // On ouvre l'onglet de façon synchrone (dans le geste utilisateur) pour éviter
  // le blocage des popups, puis on y pointe le PDF une fois généré.
  const tab = window.open('', '_blank')
  pdfLoading.value = true
  try {
    const blob = await installationApi.pdf(sheet.value.id)
    const url = URL.createObjectURL(blob)
    if (tab) {
      tab.location.href = url
    } else {
      window.open(url, '_blank')
    }
  } catch (error: unknown) {
    tab?.close()
    toast.error('Erreur', extractApiErrorMessage(error, 'Impossible de générer le PDF'))
  } finally {
    pdfLoading.value = false
  }
}

onMounted(async () => {
  try {
    sheet.value = await installationApi.get(route.params.id as string)
  } catch (error: unknown) {
    toast.error('Erreur', extractApiErrorMessage(error, 'Fiche introuvable'))
    router.push({ name: 'technicien-installation-sheets' })
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="space-y-6">
    <div v-if="loading" class="flex justify-center py-16">
      <AppSpinner size="lg" class="text-primary-600" />
    </div>

    <template v-else-if="sheet">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-4">
          <AppButton variant="ghost" @click="router.push({ name: 'technicien-installation-sheets' })">
            <ArrowLeftIcon class="w-4 h-4 mr-1" />
            Retour
          </AppButton>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              Fiche d'installation : {{ sheet.company?.name }}
            </h1>
            <p class="mt-1 text-sm text-gray-500">
              {{ sheet.materials?.length ?? 0 }} matériel(s), installé le {{ fmtDate(sheet.installed_at) }}
            </p>
          </div>
        </div>
        <AppButton variant="secondary" size="sm" class="shrink-0" :disabled="pdfLoading" @click="openPdf">
          <AppSpinner v-if="pdfLoading" size="sm" class="mr-1" />
          <PrinterIcon v-else class="w-4 h-4 mr-1" />
          {{ pdfLoading ? 'Génération…' : 'Imprimer' }}
        </AppButton>
      </div>

      <AppCard title="Client &amp; site">
        <dl class="grid grid-cols-1 gap-x-6 gap-y-3 text-sm md:grid-cols-2">
          <div><dt class="text-gray-500">Contact</dt><dd>{{ sheet.client_contact_name || '-' }}</dd></div>
          <div><dt class="text-gray-500">Fonction</dt><dd>{{ sheet.client_contact_role || '-' }}</dd></div>
          <div><dt class="text-gray-500">Téléphone</dt><dd>{{ sheet.client_phone || '-' }}</dd></div>
          <div><dt class="text-gray-500">Email</dt><dd>{{ sheet.client_email || '-' }}</dd></div>
          <div class="md:col-span-2"><dt class="text-gray-500">Adresse du site</dt><dd>{{ sheet.site_address || '-' }}</dd></div>
          <div><dt class="text-gray-500">Technicien</dt><dd>{{ sheet.technician?.name || sheet.technician?.email || '-' }}</dd></div>
        </dl>
      </AppCard>

      <AppCard :title="`Matériels installés (${sheet.materials?.length ?? 0})`">
        <div class="space-y-4">
          <div v-for="(m, i) in sheet.materials" :key="i" class="rounded-lg border border-gray-200 p-4">
            <p class="mb-2 text-sm font-medium text-gray-700">
              Matériel {{ i + 1 }} : {{ INSTALLATION_SOLUTION_LABELS[m.solution] ?? m.solution }}
            </p>
            <dl class="grid grid-cols-1 gap-x-6 gap-y-3 text-sm md:grid-cols-2">
              <div><dt class="text-gray-500">N° série</dt><dd class="font-mono">{{ m.serial_number }}</dd></div>
              <div><dt class="text-gray-500">Quantité</dt><dd>{{ m.quantity || '-' }}</dd></div>
              <div><dt class="text-gray-500">Firmware</dt><dd>{{ m.firmware_version || '-' }}</dd></div>
              <div><dt class="text-gray-500">SSID WiFi</dt><dd>{{ m.wifi_ssid || '-' }}</dd></div>
              <div><dt class="text-gray-500">IP statique</dt><dd>{{ m.static_ip || '-' }}</dd></div>
              <div><dt class="text-gray-500">Accès distant</dt><dd>{{ m.remote_access || '-' }}</dd></div>
            </dl>
          </div>
          <p v-if="!sheet.materials?.length" class="text-sm text-gray-500">Aucun matériel.</p>
        </div>
      </AppCard>

      <AppCard title="Mise en service">
        <ul class="space-y-1 text-sm">
          <li v-for="item in sheet.checklist" :key="item.key" class="flex items-center gap-2">
            <span :class="item.done ? 'text-green-600' : 'text-gray-300'">{{ item.done ? '✓' : '○' }}</span>
            <span :class="item.done ? 'text-gray-800' : 'text-gray-400'">{{ item.label }}</span>
          </li>
        </ul>
        <p class="mt-4 text-sm">
          <span class="text-gray-500">Note de formation :</span>
          {{ sheet.training_rating ? `${sheet.training_rating}/5` : '-' }}
        </p>
        <div v-if="sheet.observations" class="mt-3 text-sm">
          <p class="text-gray-500">Observations</p>
          <p class="whitespace-pre-line">{{ sheet.observations }}</p>
        </div>
      </AppCard>

      <AppCard title="Signatures">
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p class="mb-1 text-sm text-gray-500">Client</p>
            <img v-if="sheet.client_signature_url" :src="sheet.client_signature_url" alt="Signature client" class="h-40 w-full rounded-lg border border-gray-200 bg-white object-contain" />
            <p v-else class="text-sm text-gray-400">Aucune signature</p>
          </div>
          <div>
            <p class="mb-1 text-sm text-gray-500">Technicien</p>
            <img v-if="sheet.technician_signature_url" :src="sheet.technician_signature_url" alt="Signature technicien" class="h-40 w-full rounded-lg border border-gray-200 bg-white object-contain" />
            <p v-else class="text-sm text-gray-400">Aucune signature</p>
          </div>
        </div>
      </AppCard>

      <AppCard title="Relances générées">
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-3 py-2 text-left">Type</th>
                <th class="px-3 py-2 text-left">Planifié</th>
                <th class="px-3 py-2 text-left">Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="f in sheet.followups" :key="f.id" class="border-t">
                <td class="px-3 py-2 font-mono">{{ followupTypeLabel(f.call_type) }}</td>
                <td class="px-3 py-2">{{ fmtDate(f.scheduled_at) }}</td>
                <td class="px-3 py-2"><AppBadge :variant="statusVariant(f.status)">{{ followupStatusLabel(f.status) }}</AppBadge></td>
              </tr>
              <tr v-if="!sheet.followups?.length">
                <td colspan="3" class="px-3 py-4 text-center text-gray-500">Aucune relance.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>
    </template>
  </div>
</template>
