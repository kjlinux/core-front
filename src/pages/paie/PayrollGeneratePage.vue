<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { usePayrollStore } from '@/stores/payroll.store'
import { useCompanyStore } from '@/stores/company.store'
import { useSiteStore } from '@/stores/site.store'
import { useDepartmentStore } from '@/stores/department.store'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'
import { usePayrollPdf } from '@/composables/usePayrollPdf'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import FeatureLock from '@/components/ui/FeatureLock.vue'
import { DocumentArrowDownIcon, DocumentCheckIcon } from '@heroicons/vue/24/outline'
import { usePlan } from '@/composables/usePlan'
import type { Payslip } from '@/types/payroll'

const authStore = useAuthStore()
const payrollStore = usePayrollStore()
const companyStore = useCompanyStore()
const siteStore = useSiteStore()
const departmentStore = useDepartmentStore()
const toast = useToast()
const { t } = useI18n()
const { generatePayslipPdf, generateBatchPayslipPdf } = usePayrollPdf()
const { hasFeature } = usePlan()

const isSuperAdmin = computed(() => authStore.user?.role === 'super_admin')
const selectedCompanyId = ref('')
const companyId = computed(() => authStore.user?.companyId || selectedCompanyId.value || '')

const companyOptions = computed(() => [
  { label: 'Sélectionner une entreprise...', value: '' },
  ...companyStore.companies.map((c) => ({ label: c.name, value: c.id })),
])

const filters = ref({
  siteId: '',
  departmentId: '',
  periodStart: '',
  periodEnd: '',
})

// Initialiser les dates par defaut: premier et dernier jour du mois courant
const now = new Date()
const y = now.getFullYear()
const m = String(now.getMonth() + 1).padStart(2, '0')
const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
filters.value.periodStart = `${y}-${m}-01`
filters.value.periodEnd = `${y}-${m}-${String(lastDay).padStart(2, '0')}`

const siteOptions = computed(() => [
  { label: 'Tous les sites', value: '' },
  ...siteStore.sites.map((s) => ({ label: s.name, value: s.id })),
])

const departmentOptions = computed(() => [
  { label: 'Tous les départements', value: '' },
  ...departmentStore.departments
    .filter((d) => !filters.value.siteId || d.siteId === filters.value.siteId)
    .map((d) => ({ label: d.name, value: d.id })),
])

const paymentModeLabels: Record<string, string> = {
  monthly: 'Mensuel',
  hourly: 'Horaire',
  daily: 'Journalier',
  weekly: 'Hebdomadaire',
  forfait: 'Forfait',
}

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

function formatAmount(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
}

async function generatePayslips() {
  if (!filters.value.periodStart || !filters.value.periodEnd) {
    toast.showError(t('toast.payroll.periodRequired'))
    return
  }
  if (filters.value.periodEnd < filters.value.periodStart) {
    toast.showError(t('toast.payroll.endAfterStart'))
    return
  }
  if (!companyId.value) {
    toast.showError(t('toast.payroll.selectCompany'))
    return
  }
  try {
    await payrollStore.generatePayslips({
      companyId: companyId.value,
      siteId: filters.value.siteId || undefined,
      departmentId: filters.value.departmentId || undefined,
      periodStart: filters.value.periodStart,
      periodEnd: filters.value.periodEnd,
    })
    toast.showSuccess(t('toast.payroll.payslipsGenerated', { count: payrollStore.payslips.length }))
  } catch {
    toast.showError(t('toast.payroll.generateError'))
  }
}

async function loadExistingPayslips() {
  try {
    await payrollStore.fetchPayslips({
      companyId: companyId.value,
      siteId: filters.value.siteId || undefined,
      departmentId: filters.value.departmentId || undefined,
    })
  } catch {
    toast.showError(t('toast.payroll.loadPayslipsError'))
  }
}

async function validatePayslip(payslip: Payslip) {
  try {
    await payrollStore.validatePayslip(payslip.id)
    toast.showSuccess(t('toast.payroll.payslipValidated'))
  } catch {
    toast.showError(t('toast.payroll.validateError'))
  }
}

function downloadPdf(payslip: Payslip) {
  generatePayslipPdf(payslip)
}

function downloadAll() {
  if (!payrollStore.payslips.length) return
  generateBatchPayslipPdf(payrollStore.payslips)
}

async function loadData() {
  if (!companyId.value) return
  await Promise.all([
    siteStore.fetchSites({ companyId: companyId.value }),
    departmentStore.fetchDepartments({ companyId: companyId.value, perPage: 200 }),
    payrollStore.fetchPayslips({
      companyId: companyId.value,
    }),
  ])
}

watch(companyId, () => {
  filters.value.siteId = ''
  filters.value.departmentId = ''
  loadData()
})

onMounted(async () => {
  // Pas de chargement si le plan n'inclut pas la paie : la page affiche le verrou.
  if (!hasFeature('payroll')) return
  if (isSuperAdmin.value) {
    await companyStore.fetchCompanies({ perPage: 200 })
  }
  await loadData()
})
</script>

<template>
  <FeatureLock feature="payroll">
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Génération des fiches de paie</h1>
      <p class="text-sm text-gray-500 mt-1">
        Générez et exportez les fiches de paie par période, site ou département
      </p>
    </div>

    <!-- Selecteur entreprise (super_admin) -->
    <AppCard v-if="isSuperAdmin">
      <label class="mb-1 block text-sm font-medium text-gray-700">Entreprise</label>
      <AppSelect v-model="selectedCompanyId" :options="companyOptions" />
    </AppCard>

    <div
      v-if="isSuperAdmin && !companyId"
      class="rounded-lg border border-dashed border-gray-300 py-12 text-center text-sm text-gray-500"
    >
      Sélectionnez une entreprise pour générer les fiches de paie.
    </div>

    <!-- Filtres de generation -->
    <AppCard v-else title="Paramètres de génération">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Période du</label>
          <AppInput v-model="filters.periodStart" type="date" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Au</label>
          <AppInput v-model="filters.periodEnd" type="date" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Site</label>
          <AppSelect
            v-model="filters.siteId"
            :options="siteOptions"
            @update:model-value="filters.departmentId = ''"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Département</label>
          <AppSelect v-model="filters.departmentId" :options="departmentOptions" />
        </div>
      </div>

      <div class="flex gap-3 mt-4">
        <AppButton
          variant="primary"
          :loading="payrollStore.isGenerating"
          @click="generatePayslips"
        >
          Générer les fiches
        </AppButton>
        <AppButton
          variant="secondary"
          :loading="payrollStore.isLoading"
          @click="loadExistingPayslips"
        >
          Charger les fiches existantes
        </AppButton>
        <AppButton
          v-if="payrollStore.payslips.length > 0"
          variant="secondary"
          @click="downloadAll"
        >
          <DocumentArrowDownIcon class="w-4 h-4 mr-2" />
          Exporter tout en PDF
        </AppButton>
      </div>
    </AppCard>

    <!-- Loader -->
    <div v-if="payrollStore.isGenerating" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>

    <!-- Resultats -->
    <template v-else-if="payrollStore.payslips.length > 0">
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-600">
          <span class="font-semibold">{{ payrollStore.payslips.length }}</span> fiche(s) générée(s)
        </p>
      </div>

      <div class="overflow-x-auto rounded-lg border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matricule</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employé</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site / Dept</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Brut</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Déductions</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 bg-white">
            <tr
              v-for="slip in payrollStore.payslips"
              :key="slip.id"
              class="hover:bg-gray-50"
            >
              <td class="px-4 py-3 font-mono text-gray-600">{{ slip.employeeNumber }}</td>
              <td class="px-4 py-3">
                <p class="font-medium text-gray-900">{{ slip.employeeFirstName }} {{ slip.employeeLastName }}</p>
                <p class="text-xs text-gray-400">{{ slip.employeePosition }}</p>
              </td>
              <td class="px-4 py-3 text-gray-600">
                <p>{{ slip.siteName ?? '-' }}</p>
                <p class="text-xs text-gray-400">{{ slip.departmentName ?? '-' }}</p>
              </td>
              <td class="px-4 py-3 text-gray-600">{{ paymentModeLabels[slip.paymentMode] ?? slip.paymentMode }}</td>
              <td class="px-4 py-3 text-right font-medium text-gray-900">{{ formatAmount(slip.grossAmount) }}</td>
              <td class="px-4 py-3 text-right text-red-600">
                -{{ formatAmount(slip.latenessDeduction + slip.absenceDeduction) }}
              </td>
              <td class="px-4 py-3 text-right font-bold text-green-700">{{ formatAmount(slip.netAmount) }}</td>
              <td class="px-4 py-3">
                <AppBadge :variant="(statusVariants[slip.status] ?? 'neutral') as any">
                  {{ statusLabels[slip.status] ?? slip.status }}
                </AppBadge>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <button
                    v-if="slip.status === 'draft'"
                    type="button"
                    class="text-blue-600 hover:text-blue-800"
                    title="Valider"
                    @click="validatePayslip(slip)"
                  >
                    <DocumentCheckIcon class="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    class="text-gray-500 hover:text-gray-700"
                    title="Télécharger PDF"
                    @click="downloadPdf(slip)"
                  >
                    <DocumentArrowDownIcon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <div v-else-if="companyId" class="text-center py-12 text-gray-400">
      <p>Utilisez les filtres ci-dessus pour générer les fiches de paie</p>
    </div>
  </div>
  </FeatureLock>
</template>
