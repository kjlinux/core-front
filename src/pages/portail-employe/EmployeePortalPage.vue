<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { usePayrollStore } from '@/stores/payroll.store'
import { useToast } from '@/composables/useToast'
import { usePayrollPdf } from '@/composables/usePayrollPdf'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { DocumentArrowDownIcon, CalendarDaysIcon, BanknotesIcon, ClipboardDocumentListIcon } from '@heroicons/vue/24/outline'
import type { Payslip } from '@/types/payroll'

const authStore = useAuthStore()
const payrollStore = usePayrollStore()
const toast = useToast()
const { generatePayslipPdf } = usePayrollPdf()

const activeTab = ref<'presences' | 'fiches' | 'absences'>('presences')
const showAbsenceModal = ref(false)

const employeeId = computed(() => authStore.user?.employeeId ?? '')
const employeeName = computed(() => {
  const u = authStore.user
  if (!u) return ''
  return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
})

// Formulaire de demande d'absence
const absenceForm = ref({
  dateStart: '',
  dateEnd: '',
  reason: '',
  justificatif: null as File | null,
})

const tabs = [
  { key: 'presences', label: 'Mes présences', icon: CalendarDaysIcon },
  { key: 'fiches', label: 'Mes fiches de paie', icon: BanknotesIcon },
  { key: 'absences', label: 'Justificatifs', icon: ClipboardDocumentListIcon },
]

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  validated: 'Validé',
  paid: 'Payé',
}

const statusVariants: Record<string, string> = {
  draft: 'neutral',
  validated: 'info',
  paid: 'success',
}

const paymentModeLabels: Record<string, string> = {
  monthly: 'Mensuel',
  hourly: 'Horaire',
  daily: 'Journalier',
  weekly: 'Hebdomadaire',
  forfait: 'Forfait',
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR')
}

function formatPeriod(period: string) {
  const [year, month] = period.split('-')
  const d = new Date(Number(year), Number(month) - 1, 1)
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

function downloadPayslip(slip: Payslip) {
  generatePayslipPdf(slip)
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) {
    absenceForm.value.justificatif = input.files[0]
  }
}

async function submitAbsence() {
  if (!absenceForm.value.dateStart || !absenceForm.value.dateEnd || !absenceForm.value.reason.trim()) {
    toast.showError('Veuillez remplir tous les champs obligatoires')
    return
  }
  // TODO: appeler l'API absence quand elle sera disponible
  toast.showSuccess('Demande d\'absence envoyée')
  showAbsenceModal.value = false
  absenceForm.value = { dateStart: '', dateEnd: '', reason: '', justificatif: null }
}

onMounted(async () => {
  if (!employeeId.value) return
  await payrollStore.fetchMyPayslips(employeeId.value)
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Mon espace personnel</h1>
      <p class="text-sm text-gray-500 mt-1">Bienvenue, {{ employeeName }}</p>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex gap-6">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          :class="[
            'flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === tab.key
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
          ]"
          @click="activeTab = tab.key as any"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Onglet Presences -->
    <div v-if="activeTab === 'presences'" class="space-y-4">
      <AppCard title="Mes pointages du mois">
        <div class="text-sm text-gray-500 py-6 text-center">
          Historique de pointage disponible via le module Pointage RFID / QR Code
        </div>
      </AppCard>
    </div>

    <!-- Onglet Fiches de paie -->
    <div v-if="activeTab === 'fiches'" class="space-y-4">
      <div v-if="payrollStore.isLoading" class="flex justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>

      <div v-else-if="payrollStore.payslips.length === 0" class="text-center py-12 text-gray-400">
        Aucune fiche de paie disponible
      </div>

      <div v-else class="space-y-3">
        <AppCard
          v-for="slip in payrollStore.payslips"
          :key="slip.id"
        >
          <div class="flex items-center justify-between gap-4 flex-wrap">
            <div class="flex items-center gap-4">
              <BanknotesIcon class="w-8 h-8 text-gray-300 flex-shrink-0" />
              <div>
                <p class="font-semibold text-gray-900 capitalize">{{ formatPeriod(slip.period) }}</p>
                <p class="text-xs text-gray-400">
                  {{ formatDate(slip.periodStart) }} — {{ formatDate(slip.periodEnd) }}
                  · {{ paymentModeLabels[slip.paymentMode] ?? slip.paymentMode }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-6 flex-wrap">
              <div class="text-right">
                <p class="text-xs text-gray-400">Salaire brut</p>
                <p class="font-medium text-gray-900">{{ formatAmount(slip.grossAmount) }}</p>
              </div>
              <div class="text-right">
                <p class="text-xs text-gray-400">Déductions</p>
                <p class="font-medium text-red-600">-{{ formatAmount(slip.latenessDeduction + slip.absenceDeduction) }}</p>
              </div>
              <div class="text-right">
                <p class="text-xs text-gray-400">Net à payer</p>
                <p class="text-lg font-bold text-green-700">{{ formatAmount(slip.netAmount) }}</p>
              </div>

              <AppBadge :variant="(statusVariants[slip.status] ?? 'neutral') as any">
                {{ statusLabels[slip.status] ?? slip.status }}
              </AppBadge>

              <button
                type="button"
                class="text-gray-500 hover:text-gray-700"
                title="Télécharger PDF"
                @click="downloadPayslip(slip)"
              >
                <DocumentArrowDownIcon class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Détail des lignes -->
          <div v-if="slip.lines.length > 0" class="mt-4 pt-4 border-t border-gray-100">
            <div
              v-for="line in slip.lines"
              :key="line.label"
              class="flex justify-between text-sm py-1"
            >
              <span class="text-gray-600">{{ line.label }}</span>
              <span :class="line.type === 'deduction' ? 'text-red-600' : 'text-green-700'" class="font-medium">
                {{ line.type === 'deduction' ? '-' : '+' }}{{ formatAmount(line.amount) }}
              </span>
            </div>
          </div>
        </AppCard>
      </div>
    </div>

    <!-- Onglet Justificatifs absences -->
    <div v-if="activeTab === 'absences'" class="space-y-4">
      <div class="flex justify-end">
        <AppButton variant="primary" @click="showAbsenceModal = true">
          Soumettre un justificatif
        </AppButton>
      </div>

      <AppCard title="Mes demandes d'absence">
        <div class="text-sm text-gray-500 py-6 text-center">
          Aucune demande d'absence soumise pour le moment
        </div>
      </AppCard>
    </div>

    <!-- Modal justificatif -->
    <AppModal v-model="showAbsenceModal" title="Soumettre un justificatif d'absence" size="md">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date de début <span class="text-red-500">*</span></label>
          <AppInput v-model="absenceForm.dateStart" type="date" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date de fin <span class="text-red-500">*</span></label>
          <AppInput v-model="absenceForm.dateEnd" type="date" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Motif <span class="text-red-500">*</span></label>
          <textarea
            v-model="absenceForm.reason"
            rows="3"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Décrivez le motif de l'absence..."
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Pièce justificative (optionnel)</label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            class="w-full text-sm text-gray-600 file:mr-3 file:rounded file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-gray-200"
            @change="handleFileChange"
          />
          <p class="text-xs text-gray-400 mt-1">PDF, JPG ou PNG · max 5 Mo</p>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButton variant="secondary" @click="showAbsenceModal = false">Annuler</AppButton>
          <AppButton variant="primary" @click="submitAbsence">Soumettre</AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
