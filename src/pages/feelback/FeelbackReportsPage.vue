<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
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

const { t } = useI18n()
const auth = useAuthStore()
const toast = useToast()

const isSuperAdmin = computed(() => auth.userRole === 'super_admin')

const reportType = ref<'global' | 'site' | 'department' | 'period'>('global')
const startDate = ref('')
const endDate = ref('')
const selectedCompany = ref('')
const selectedSite = ref('')
const selectedDepartment = ref('')
const periodGranularity = ref<'day' | 'week' | 'month'>('month')

const companyOptions = ref<{ label: string; value: string }[]>([])
const siteOptions = ref<{ label: string; value: string }[]>([])
const departmentOptions = ref<{ label: string; value: string }[]>([])

const loadingCompanies = ref(false)
const loadingSites = ref(false)
const loadingDepartments = ref(false)
const loading = ref(false)
const reportGenerated = ref(false)
const report = ref<FeelbackReportData | null>(null)

const reportTypes = computed(() => [
  { label: t('feelback.globalReport'), value: 'global' },
  { label: t('feelback.bySiteReport'), value: 'site' },
  { label: t('feelback.byDeptReport'), value: 'department' },
  { label: t('feelback.byPeriodReport'), value: 'period' },
])

const granularityOptions = computed(() => [
  { label: t('feelback.byDay'), value: 'day' },
  { label: t('feelback.byWeek'), value: 'week' },
  { label: t('feelback.byMonth'), value: 'month' },
])

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
      { label: t('feelback.allSites'), value: '' },
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
    loadSites()
  }
})

const activeColumns = computed<TableColumn[]>(() => {
  const common = [
    { key: 'totalResponses', label: t('feelback.totalResponses'), align: 'center' as const },
    { key: 'bon', label: t('feelback.good'), align: 'center' as const },
    { key: 'neutre', label: t('feelback.neutral'), align: 'center' as const },
    { key: 'mauvais', label: t('feelback.bad'), align: 'center' as const },
    { key: 'satisfactionRateFormatted', label: t('feelback.satisfactionRate'), align: 'center' as const },
  ]

  if (reportType.value === 'site') {
    return [{ key: 'site', label: t('feelback.siteLabel') }, ...common]
  }
  if (reportType.value === 'department') {
    return [
      { key: 'department', label: t('feelback.deptLabel') },
      { key: 'site', label: t('feelback.siteLabel') },
      ...common,
    ]
  }
  if (reportType.value === 'period') {
    return [{ key: 'period', label: t('feelback.selectPeriod') }, ...common]
  }
  return [{ key: 'site', label: t('feelback.siteLabel') }, ...common]
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
  () => reportTypes.value.find((o) => o.value === reportType.value)?.label ?? 'Rapport',
)

function validate(): boolean {
  if (!startDate.value || !endDate.value) {
    toast.showError(t('feelback.selectPeriod'))
    return false
  }
  if (isSuperAdmin.value && !selectedCompany.value) {
    toast.showError(t('feelback.companyRequired'))
    return false
  }
  if (showSiteFilter.value && siteOptions.value.length <= 1) {
    toast.showError(t('feelback.noSiteAvailable'))
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
    toast.showSuccess(t('feelback.reportGeneratedSuccess'))
  } catch {
    toast.showError(t('feelback.reportGenerateError'))
  } finally {
    loading.value = false
  }
}

const summaryRows = computed(() => {
  if (!report.value) return []
  return [
    { label: t('feelback.totalResponses'), value: report.value.totalResponses },
    { label: t('feelback.goodRate'), value: formatPercent(report.value.bonRate) },
    { label: t('feelback.neutralRate'), value: formatPercent(report.value.neutreRate) },
    { label: t('feelback.badRate'), value: formatPercent(report.value.mauvaisRate) },
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
  toast.showSuccess(t('marketplace.pdfDownloaded'))
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
  toast.showSuccess(t('marketplace.excelDownloaded'))
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('feelback.reportsTitle') }}</h1>
    </div>

    <!-- Parametres du rapport -->
    <AppCard :title="t('feelback.reportParams')">
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AppSelect v-model="reportType" :label="t('feelback.reportType')" :options="reportTypes" />

          <AppSelect
            v-if="isSuperAdmin"
            v-model="selectedCompany"
            :label="t('feelback.company')"
            :options="companyOptions"
            :disabled="loadingCompanies"
          />

          <AppSelect
            v-if="showGranularity"
            v-model="periodGranularity"
            :label="t('feelback.granularity')"
            :options="granularityOptions"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AppInput v-model="startDate" :label="t('feelback.startDate')" type="date" />
          <AppInput v-model="endDate" :label="t('feelback.endDate')" type="date" />
        </div>

        <div v-if="showSiteFilter" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AppSelect
            v-model="selectedSite"
            :label="t('feelback.siteLabel')"
            :options="siteOptions"
            :disabled="loadingSites || siteOptions.length === 0"
          />

          <AppSelect
            v-if="showDepartmentFilter"
            v-model="selectedDepartment"
            :label="t('feelback.deptLabel')"
            :options="departmentOptions"
            :disabled="loadingDepartments || !selectedSite"
          />
        </div>
      </div>

      <div class="flex gap-3 mt-6">
        <AppButton :loading="loading" @click="generateReport">{{ t('feelback.generateReport') }}</AppButton>
      </div>
    </AppCard>

    <!-- Resultats -->
    <template v-if="reportGenerated && report">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard :title="t('feelback.totalResponses')" :value="report.totalResponses" />
        <StatCard :title="t('feelback.goodRate')" :value="formatPercent(report.bonRate)" />
        <StatCard :title="t('feelback.neutralRate')" :value="formatPercent(report.neutreRate)" />
        <StatCard :title="t('feelback.badRate')" :value="formatPercent(report.mauvaisRate)" />
      </div>

      <AppCard :title="reportLabel">
        <template #actions>
          <div class="flex gap-2">
            <AppButton variant="outline" size="sm" @click="handleExportPdf">
              {{ t('common.exportPdf') }}
            </AppButton>
            <AppButton variant="outline" size="sm" @click="handleExportExcel">
              {{ t('common.exportExcel') }}
            </AppButton>
          </div>
        </template>
        <DataTable :columns="activeColumns" :data="tableData" :loading="loading" />
      </AppCard>
    </template>
  </div>
</template>
