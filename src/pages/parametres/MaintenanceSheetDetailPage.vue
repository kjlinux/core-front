<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  maintenanceApi,
  MAINTENANCE_SOLUTION_LABELS,
  MAINTENANCE_TYPE_LABELS,
  EQUIPMENT_STATUS_LABELS,
  type MaintenanceSheet,
} from '@/services/api/maintenance.api'
import { ArrowLeftIcon, PrinterIcon } from '@heroicons/vue/24/outline'
import { useToast } from '@/composables/useToast'
import { extractApiErrorMessage } from '@/utils/api-error'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const sheet = ref<MaintenanceSheet | null>(null)
const loading = ref(true)
const pdfLoading = ref(false)

function fmtDate(d?: string | null) {
  return d ? new Date(d).toLocaleDateString('fr-FR') : '-'
}

function statusVariant(s: string) {
  if (s === 'operational' || s === 'repaired') return 'success'
  if (s === 'replaced') return 'info'
  if (s === 'to_monitor') return 'warning'
  return 'danger'
}

/** Génère le PDF côté serveur et l'ouvre dans un nouvel onglet. */
async function openPdf() {
  if (!sheet.value || pdfLoading.value) return
  // On ouvre l'onglet de façon synchrone (dans le geste utilisateur) pour éviter
  // le blocage des popups, puis on y pointe le PDF une fois généré.
  const tab = window.open('', '_blank')
  pdfLoading.value = true
  try {
    const blob = await maintenanceApi.pdf(sheet.value.id)
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
    sheet.value = await maintenanceApi.get(route.params.id as string)
  } catch (error: unknown) {
    toast.error('Erreur', extractApiErrorMessage(error, 'Fiche introuvable'))
    router.push({ name: 'technicien-maintenance-sheets' })
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
          <AppButton variant="ghost" @click="router.push({ name: 'technicien-maintenance-sheets' })">
            <ArrowLeftIcon class="w-4 h-4 mr-1" />
            Retour
          </AppButton>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              Fiche de maintenance : {{ sheet.company?.name }}
            </h1>
            <p class="mt-1 text-sm text-gray-500">
              {{ MAINTENANCE_TYPE_LABELS[sheet.maintenance_type] ?? sheet.maintenance_type }},
              intervention du {{ fmtDate(sheet.maintained_at) }}
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

      <AppCard title="Intervention">
        <dl class="grid grid-cols-1 gap-x-6 gap-y-3 text-sm md:grid-cols-2">
          <div>
            <dt class="text-gray-500">Type</dt>
            <dd>{{ MAINTENANCE_TYPE_LABELS[sheet.maintenance_type] ?? sheet.maintenance_type }}</dd>
          </div>
          <div>
            <dt class="text-gray-500">Durée</dt>
            <dd>{{ sheet.duration_minutes != null ? `${sheet.duration_minutes} min` : '-' }}</dd>
          </div>
          <div>
            <dt class="text-gray-500">Statut</dt>
            <dd>
              <AppBadge :variant="sheet.resolved ? 'success' : 'warning'">
                {{ sheet.resolved ? 'Résolue' : 'À suivre' }}
              </AppBadge>
            </dd>
          </div>
          <div>
            <dt class="text-gray-500">Prochaine maintenance</dt>
            <dd>{{ fmtDate(sheet.next_maintenance_at) }}</dd>
          </div>
          <div v-if="sheet.installation_sheet_id" class="md:col-span-2">
            <dt class="text-gray-500">Fiche d'installation d'origine</dt>
            <dd>
              <router-link
                :to="{ name: 'technicien-installation-sheet-detail', params: { id: sheet.installation_sheet_id } }"
                class="text-primary-700 underline"
              >
                Voir la fiche
                <span v-if="sheet.installation_sheet?.installed_at">(installée le {{ fmtDate(sheet.installation_sheet.installed_at) }})</span>
              </router-link>
            </dd>
          </div>
          <div v-if="sheet.reported_issue" class="md:col-span-2">
            <dt class="text-gray-500">Problème signalé</dt>
            <dd class="whitespace-pre-line">{{ sheet.reported_issue }}</dd>
          </div>
        </dl>
      </AppCard>

      <AppCard :title="`Équipements maintenus (${sheet.equipments?.length ?? 0})`">
        <div class="space-y-4">
          <div v-for="(e, i) in sheet.equipments" :key="i" class="rounded-lg border border-gray-200 p-4">
            <div class="mb-2 flex items-center justify-between">
              <p class="text-sm font-medium text-gray-700">
                Équipement {{ i + 1 }} : {{ MAINTENANCE_SOLUTION_LABELS[e.solution] ?? e.solution }}
              </p>
              <AppBadge :variant="statusVariant(e.status)">
                {{ EQUIPMENT_STATUS_LABELS[e.status] ?? e.status }}
              </AppBadge>
            </div>
            <dl class="grid grid-cols-1 gap-x-6 gap-y-3 text-sm md:grid-cols-2">
              <div><dt class="text-gray-500">N° série</dt><dd class="font-mono">{{ e.serial_number }}</dd></div>
              <div class="md:col-span-2"><dt class="text-gray-500">Intervention effectuée</dt><dd class="whitespace-pre-line">{{ e.operation || '-' }}</dd></div>
            </dl>
          </div>
          <p v-if="!sheet.equipments?.length" class="text-sm text-gray-500">Aucun équipement.</p>
        </div>
      </AppCard>

      <AppCard title="Contrôles effectués">
        <ul class="space-y-1 text-sm">
          <li v-for="item in sheet.checklist" :key="item.key" class="flex items-center gap-2">
            <span :class="item.done ? 'text-green-600' : 'text-gray-300'">{{ item.done ? '✓' : '○' }}</span>
            <span :class="item.done ? 'text-gray-800' : 'text-gray-400'">{{ item.label }}</span>
          </li>
        </ul>
        <p class="mt-4 text-sm">
          <span class="text-gray-500">Satisfaction client :</span>
          {{ sheet.satisfaction_rating ? `${sheet.satisfaction_rating}/5` : '-' }}
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
    </template>
  </div>
</template>
