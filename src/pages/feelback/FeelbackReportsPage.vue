<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'
import {
  feelbackReportApi,
  type FeelbackReportData,
  type FeelbackReportParams,
} from '@/services/api/feelback-report.api'
import { companyApi } from '@/services/api/company.api'
import { exportToPdf, exportToExcel } from '@/utils/export-helpers'
import { formatPercent } from '@/utils/format'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import StatCard from '@/components/data-display/StatCard.vue'
import DataTable from '@/components/data-display/DataTable.vue'
import type { TableColumn } from '@/types/common'

const auth = useAuthStore()
const toast = useToast()

const isSuperAdmin = computed(() => auth.userRole === 'super_admin')

// Parametres du rapport
const reportType = ref<'global' | 'site' | 'department' | 'period'>('global')
const startDate = ref('')
const endDate = ref('')
const selectedCompany = ref('')
const selectedSite = ref('')
const selectedDepartment = ref('')
const periodGranularity = ref<'day' | 'week' | 'month'>('month')

// Options dynamiques
const companyOptions = ref<{ label: string; value: string }[]>([])
const siteOptions = ref<{ label: string; value: string }[]>([])
const departmentOptions = ref<{ label: string; value: string }[]>([])

const loadingCompanies = ref(false)
const loadingSites = ref(false)
const loadingDepartments = ref(false)
const loading = ref(false)
const reportGenerated = ref(false)
const report = ref<FeelbackReportData | null>(null)

const reportTypes = [
  { label: 'Rapport global', value: 'global' },
  { label: 'Rapport par site', value: 'site' },
  { label: 'Rapport par departement', value: 'department' },
  { label: 'Rapport par periode', value: 'period' },
]

const granularityOptions = [
  { label: 'Par jour', value: 'day' },
  { label: 'Par semaine', value: 'week' },
  { label: 'Par mois', value: 'month' },
]

// Champs conditionnels selon le type de rapport
const showSiteFilter = computed(() =>
  reportType.value === 'site' || reportType.value === 'department',
)
const showDepartmentFilter = computed(() => reportType.value === 'department')
const showGranularity = computed(() => reportType.value === 'period')

async function loadCompanies() {
  if (!isSuperAdmin.value) return
  loadingCompanies.value = true
  try {
    const companies = await companyApi.getAll()
    companyOptions.value = companies.map((c) => ({ label: c.name, value: c.id }))
  } catch {
    // silencieux
  } finally {
    loadingCompanies.value = false
  }
}

async function loadSites() {
  siteOptions.value = []
  selectedSite.value = ''
  departmentOptions.value = []
  selectedDepartment.value = ''

  const companyId = isSuperAdmin.value ? selectedCompany.value : auth.user?.companyId ?? ''
  if (!companyId) return

  loadingSites.value = true
  try {
    const sites = await companyApi.getSites(companyId)
    siteOptions.value = [
      { label: 'Tous les sites', value: '' },
      ...sites.map((s) => ({ label: s.name, value: s.id })),
    ]
  } catch {
    // silencieux
  } finally {
    loadingSites.value = false
  }
}

async function loadDepartments() {
  departmentOptions.value = []
  selectedDepartment.value = ''
  if (!selectedSite.value) return

  loadingDepartments.value = true
  try {
    const departments = await companyApi.getDepartments(selectedSite.value)
    departmentOptions.value = [
      { label: 'Tous les departements', value: '' },
      ...departments.map((d) => ({ label: d.name, value: d.id })),
    ]
  } catch {
    // silencieux
  } finally {
    loadingDepartments.value = false
  }
}

watch(selectedCompany, () => {
  if (isSuperAdmin.value) loadSites()
})

watch(selectedSite, () => {
  if (showDepartmentFilter.value) loadDepartments()
})

watch(reportType, () => {
  // Recharger les donnees dependantes si besoin
  if (showSiteFilter.value && siteOptions.value.length === 0) loadSites()
  if (!showDepartmentFilter.value) {
    selectedDepartment.value = ''
    departmentOptions.value = []
  }
  reportGenerated.value = false
  report.value = null
})

onMounted(() => {
  if (isSuperAdmin.value) {
    loadCompanies()
  } else {
    // Pour admin_enterprise / manager, charger directement les sites de leur entreprise
    loadSites()
  }
})

// Colonnes dynamiques selon le type de rapport
const activeColumns = computed<TableColumn[]>(() => {
  const common = [
    { key: 'totalResponses', label: 'Total reponses', align: 'center' as const },
    { key: 'bon', label: 'Bon', align: 'center' as const },
    { key: 'neutre', label: 'Neutre', align: 'center' as const },
    { key: 'mauvais', label: 'Mauvais', align: 'center' as const },
    { key: 'satisfactionRateFormatted', label: 'Taux satisfaction', align: 'center' as const },
  ]

  if (reportType.value === 'site') {
    return [{ key: 'site', label: 'Site' }, ...common]
  }
  if (reportType.value === 'department') {
    return [
      { key: 'department', label: 'Departement' },
      { key: 'site', label: 'Site' },
      ...common,
    ]
  }
  if (reportType.value === 'period') {
    return [{ key: 'period', label: 'Periode' }, ...common]
  }
  // global
  return [{ key: 'site', label: 'Site' }, ...common]
})

const tableData = computed(() => {
  if (!report.value) return []

  let source: Record<string, unknown>[] = []
  if (reportType.value === 'department') {
    source = (report.value.byDepartment ?? []) as unknown as Record<string, unknown>[]
  } else if (reportType.value === 'period') {
    source = (report.value.byPeriod ?? []) as unknown as Record<string, unknown>[]
  } else {
    source = (report.value.bySite ?? []) as unknown as Record<string, unknown>[]
  }

  return source.map((row) => ({
    ...row,
    satisfactionRateFormatted: formatPercent((row.satisfactionRate as number) ?? 0),
  }))
})

const periodLabel = computed(() => {
  if (startDate.value && endDate.value) return `Periode: ${startDate.value} au ${endDate.value}`
  return ''
})

const reportLabel = computed(
  () => reportTypes.find((o) => o.value === reportType.value)?.label ?? 'Rapport',
)

function validate(): boolean {
  if (!startDate.value || !endDate.value) {
    toast.showError('Veuillez selectionner une periode')
    return false
  }
  if (isSuperAdmin.value && !selectedCompany.value) {
    toast.showError('Veuillez selectionner une entreprise')
    return false
  }
  if (showSiteFilter.value && siteOptions.value.length <= 1) {
    toast.showError('Aucun site disponible pour cette entreprise')
    return false
  }
  return true
}

async function generateReport() {
  if (!validate()) return

  loading.value = true
  reportGenerated.value = false
  report.value = null

  try {
    const params: FeelbackReportParams = {
      start_date: startDate.value,
      end_date: endDate.value,
      type: reportType.value,
    }
    if (isSuperAdmin.value && selectedCompany.value) {
      params.company_id = selectedCompany.value
    } else if (!isSuperAdmin.value && auth.user?.companyId) {
      params.company_id = auth.user.companyId
    }
    if (selectedSite.value) params.site_id = selectedSite.value
    if (selectedDepartment.value) params.department_id = selectedDepartment.value
    if (showGranularity.value) params.period_granularity = periodGranularity.value

    report.value = await feelbackReportApi.getReport(params)
    reportGenerated.value = true
    toast.showSuccess('Rapport genere avec succes')
  } catch {
    toast.showError('Erreur lors de la generation du rapport')
  } finally {
    loading.value = false
  }
}

const summaryRows = computed(() => {
  if (!report.value) return []
  return [
    { label: 'Total reponses', value: report.value.totalResponses },
    { label: 'Taux bon', value: formatPercent(report.value.bonRate) },
    { label: 'Taux neutre', value: formatPercent(report.value.neutreRate) },
    { label: 'Taux mauvais', value: formatPercent(report.value.mauvaisRate) },
  ]
})

async function handleExportPdf() {
  if (!report.value) return
  await exportToPdf({
    filename: `feelback-${reportType.value}-${startDate.value}`,
    title: `Rapport Feelback - ${reportLabel.value}`,
    subtitle: periodLabel.value,
    summaryRows: summaryRows.value,
    columns: activeColumns.value.map((c) => ({ header: c.label, key: c.key })),
    data: tableData.value,
  })
  toast.showSuccess('Le fichier PDF a ete telecharge')
}

async function handleExportExcel() {
  if (!report.value) return
  await exportToExcel({
    filename: `feelback-${reportType.value}-${startDate.value}`,
    title: `Rapport Feelback - ${reportLabel.value}`,
    subtitle: periodLabel.value,
    summaryRows: summaryRows.value,
    columns: activeColumns.value.map((c) => ({ header: c.label, key: c.key, width: 18 })),
    data: tableData.value,
  })
  toast.showSuccess('Le fichier Excel a ete telecharge')
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Rapports Feelback</h1>
    </div>

    <!-- Parametres du rapport -->
    <AppCard title="Parametres du rapport">
      <div class="space-y-4">
        <!-- Ligne 1 : type + entreprise (si super_admin) -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AppSelect v-model="reportType" label="Type de rapport" :options="reportTypes" />

          <AppSelect
            v-if="isSuperAdmin"
            v-model="selectedCompany"
            label="Entreprise"
            :options="companyOptions"
            :disabled="loadingCompanies"
            placeholder="Selectionner une entreprise"
          />

          <!-- Granularite si rapport periode -->
          <AppSelect
            v-if="showGranularity"
            v-model="periodGranularity"
            label="Granularite"
            :options="granularityOptions"
          />
        </div>

        <!-- Ligne 2 : periode -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AppInput v-model="startDate" label="Date debut" type="date" />
          <AppInput v-model="endDate" label="Date fin" type="date" />
        </div>

        <!-- Ligne 3 : filtres site / departement (conditionnels) -->
        <div v-if="showSiteFilter" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AppSelect
            v-model="selectedSite"
            label="Site"
            :options="siteOptions"
            :disabled="loadingSites || siteOptions.length === 0"
            placeholder="Selectionner un site"
          />

          <AppSelect
            v-if="showDepartmentFilter"
            v-model="selectedDepartment"
            label="Departement"
            :options="departmentOptions"
            :disabled="loadingDepartments || !selectedSite"
            placeholder="Selectionner un departement"
          />
        </div>
      </div>

      <div class="flex gap-3 mt-6">
        <AppButton :loading="loading" @click="generateReport">Generer le rapport</AppButton>
      </div>
    </AppCard>

    <!-- Resultats -->
    <template v-if="reportGenerated && report">
      <!-- Statistiques globales -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total reponses" :value="report.totalResponses" />
        <StatCard title="Taux bon" :value="formatPercent(report.bonRate)" />
        <StatCard title="Taux neutre" :value="formatPercent(report.neutreRate)" />
        <StatCard title="Taux mauvais" :value="formatPercent(report.mauvaisRate)" />
      </div>

      <!-- Tableau detaille -->
      <AppCard :title="reportLabel">
        <template #actions>
          <div class="flex gap-2">
            <AppButton variant="outline" size="sm" @click="handleExportPdf">
              Exporter PDF
            </AppButton>
            <AppButton variant="outline" size="sm" @click="handleExportExcel">
              Exporter Excel
            </AppButton>
          </div>
        </template>
        <DataTable :columns="activeColumns" :data="tableData" :loading="loading" />
      </AppCard>
    </template>
  </div>
</template>
