<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppCard from '@/components/ui/AppCard.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import DataTable from '@/components/data-display/DataTable.vue'
import StatCard from '@/components/data-display/StatCard.vue'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth.store'
import { attendanceReportApi, type AttendanceReportData, type AttendanceReportParams } from '@/services/api/attendance-report.api'
import { exportToPdf, exportToExcel } from '@/utils/export-helpers'
import { companyApi } from '@/services/api/company.api'
import type { TableColumn } from '@/types/common'
import type { Company, Site, Department } from '@/types'

const { t } = useI18n()
const { success, error } = useToast()
const authStore = useAuthStore()

// ---------- State ----------
const reportType = ref('daily')
const startDate = ref('')
const endDate = ref('')
const exportFormat = ref('pdf')
const selectedCompany = ref('')
const selectedSite = ref('')
const selectedDepartment = ref('')
const loading = ref(false)
const exporting = ref(false)
const reportGenerated = ref(false)
const report = ref<AttendanceReportData | null>(null)

// Filter lists
const companies = ref<Company[]>([])
const sites = ref<Site[]>([])
const departments = ref<Department[]>([])

const isSuperAdmin = computed(() => authStore.userRole === 'super_admin')

// ---------- Report type options ----------
const reportTypeOptions = computed(() => [
  { label: t('reports.daily'), value: 'daily' },
  { label: t('reports.weekly'), value: 'weekly' },
  { label: t('reports.monthly'), value: 'monthly' },
  { label: t('reports.lates'), value: 'late' },
  { label: t('reports.absences'), value: 'absence' },
])

const exportFormatOptions = [
  { label: 'PDF', value: 'pdf' },
  { label: 'Excel', value: 'excel' },
]

// ---------- Dynamic columns per report type ----------
const columnsByType = computed<Record<string, TableColumn[]>>(() => ({
  daily: [
    { key: 'employee', label: t('reports.employee') },
    { key: 'department', label: t('reports.dept') },
    { key: 'site', label: t('reports.site') },
    { key: 'present', label: t('reports.presentCount'), align: 'center' },
    { key: 'absent', label: t('reports.absentCount'), align: 'center' },
    { key: 'late', label: t('reports.lateCount'), align: 'center' },
    { key: 'overtime', label: t('reports.overtime'), align: 'center' },
    { key: 'rate', label: t('reports.attendanceRate'), align: 'center' },
  ],
  weekly: [
    { key: 'employee', label: t('reports.employee') },
    { key: 'department', label: t('reports.dept') },
    { key: 'site', label: t('reports.site') },
    { key: 'present', label: t('reports.presentDays'), align: 'center' },
    { key: 'absent', label: t('reports.absencesCount'), align: 'center' },
    { key: 'late', label: t('reports.lateCount'), align: 'center' },
    { key: 'overtime', label: t('reports.overtime'), align: 'center' },
    { key: 'rate', label: t('reports.attendanceRate'), align: 'center' },
  ],
  monthly: [
    { key: 'employee', label: t('reports.employee') },
    { key: 'department', label: t('reports.dept') },
    { key: 'site', label: t('reports.site') },
    { key: 'present', label: t('reports.presentDays'), align: 'center' },
    { key: 'absent', label: t('reports.absencesCount'), align: 'center' },
    { key: 'late', label: t('reports.lateCount'), align: 'center' },
    { key: 'overtime', label: t('reports.overtime'), align: 'center' },
    { key: 'rate', label: t('reports.attendanceRate'), align: 'center' },
  ],
  late: [
    { key: 'employee', label: t('reports.employee') },
    { key: 'department', label: t('reports.dept') },
    { key: 'site', label: t('reports.site') },
    { key: 'late', label: t('reports.lateNumber'), align: 'center' },
    { key: 'overtime', label: t('reports.overtime'), align: 'center' },
    { key: 'rate', label: t('reports.attendanceRate'), align: 'center' },
  ],
  absence: [
    { key: 'employee', label: t('reports.employee') },
    { key: 'department', label: t('reports.dept') },
    { key: 'site', label: t('reports.site') },
    { key: 'absent', label: t('reports.absencesCount'), align: 'center' },
    { key: 'rate', label: t('reports.attendanceRate'), align: 'center' },
  ],
}))

const currentColumns = computed<TableColumn[]>(() => columnsByType.value[reportType.value] ?? columnsByType.value.daily!)

const currentReportLabel = computed(() => {
  return reportTypeOptions.value.find((o) => o.value === reportType.value)?.label ?? t('reports.title')
})

const periodLabel = computed(() => {
  if (startDate.value && endDate.value) return t('reports.period', { start: startDate.value, end: endDate.value })
  return ''
})

// ---------- Summary stats (dynamic per type) ----------
const summaryStats = computed(() => {
  if (!report.value) return []
  const r = report.value
  const base = [
    { title: t('reports.employeesTotal'), value: r.totalEmployees },
  ]
  if (reportType.value === 'late') {
    base.push({ title: t('reports.totalLates'), value: r.totalLate })
    return base
  }
  if (reportType.value === 'absence') {
    base.push({ title: t('reports.totalAbsences'), value: r.totalAbsent })
    return base
  }
  base.push(
    { title: t('reports.presentDays'), value: r.totalPresent },
    { title: t('reports.absencesCount'), value: r.totalAbsent },
    { title: t('reports.lateCount'), value: r.totalLate },
  )
  return base
})

// ---------- Load filter data ----------
onMounted(async () => {
  if (isSuperAdmin.value) {
    try {
      companies.value = await companyApi.getAll()
    } catch {
      // silent
    }
  }
})

watch(selectedCompany, async (companyId) => {
  selectedSite.value = ''
  selectedDepartment.value = ''
  sites.value = []
  departments.value = []
  if (companyId) {
    try {
      sites.value = await companyApi.getSites(companyId)
    } catch {
      // silent
    }
  }
})

watch(selectedSite, async (siteId) => {
  selectedDepartment.value = ''
  departments.value = []
  if (siteId) {
    try {
      departments.value = await companyApi.getDepartments(siteId)
    } catch {
      // silent
    }
  }
})

// Reset report when type changes
watch(reportType, () => {
  reportGenerated.value = false
  report.value = null
})

// ---------- Generate report ----------
const generateReport = async () => {
  if (!startDate.value || !endDate.value) {
    error(t('reports.requiredFields'), t('reports.periodRequired'))
    return
  }
  if (isSuperAdmin.value && !selectedCompany.value) {
    error(t('reports.requiredFields'), t('reports.companyRequired'))
    return
  }
  loading.value = true
  try {
    const params: AttendanceReportParams = {
      start_date: startDate.value,
      end_date: endDate.value,
      type: reportType.value,
    }
    if (selectedCompany.value) params.company_id = selectedCompany.value
    if (selectedSite.value) params.site_id = selectedSite.value
    if (selectedDepartment.value) params.department_id = selectedDepartment.value

    report.value = await attendanceReportApi.getReport(params)
    reportGenerated.value = true
    success(t('reports.generated'), t('reports.generatedMsg'))
  } catch {
    error(t('common.error'), t('reports.generateError'))
  } finally {
    loading.value = false
  }
}

// ---------- Export helpers ----------
function buildExportColumns() {
  return currentColumns.value.map((c) => ({
    header: c.label,
    key: c.key,
    width: c.key === 'employee' ? 22 : 16,
  }))
}

function buildSummaryRows() {
  return summaryStats.value.map((s) => ({ label: s.title, value: s.value }))
}

const handleExport = async () => {
  if (!report.value || report.value.rows.length === 0) {
    error(t('reports.exportImpossible'), t('reports.noDataExport'))
    return
  }

  exporting.value = true
  try {
    const baseFilename = `pointage-${reportType.value}-${startDate.value}`
    const title = `${t('reports.title')} - ${currentReportLabel.value}`

    if (exportFormat.value === 'pdf') {
      await exportToPdf({
        filename: baseFilename,
        title,
        subtitle: periodLabel.value,
        summaryRows: buildSummaryRows(),
        columns: buildExportColumns(),
        data: report.value.rows as Record<string, unknown>[],
      })
      success(t('reports.pdfTitle'), t('reports.pdfExported'))
    } else {
      await exportToExcel({
        filename: baseFilename,
        title,
        subtitle: periodLabel.value,
        summaryRows: buildSummaryRows(),
        columns: buildExportColumns(),
        data: report.value.rows as Record<string, unknown>[],
      })
      success(t('reports.excelTitle'), t('reports.excelExported'))
    }
  } catch {
    error(t('reports.exportErrorTitle'), t('reports.exportError'))
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('reports.title') }}</h1>
    </div>

    <!-- Filters -->
    <AppCard :title="t('reports.params')">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('reports.reportType') }}</label>
          <AppSelect v-model="reportType" :options="reportTypeOptions" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('reports.startDate') }}</label>
          <AppInput v-model="startDate" type="date" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('reports.endDate') }}</label>
          <AppInput v-model="endDate" type="date" />
        </div>

        <!-- Location filters -->
        <div v-if="isSuperAdmin">
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('reports.company') }}</label>
          <AppSelect
            v-model="selectedCompany"
            :options="companies.map(c => ({ label: c.name, value: c.id }))"
            :placeholder="t('reports.selectCompany')"
          />
        </div>
        <div v-if="sites.length > 0">
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('reports.site') }}</label>
          <AppSelect
            v-model="selectedSite"
            :options="sites.map(s => ({ label: s.name, value: s.id }))"
            :placeholder="t('reports.allSites')"
          />
        </div>
        <div v-if="departments.length > 0">
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('reports.department') }}</label>
          <AppSelect
            v-model="selectedDepartment"
            :options="departments.map(d => ({ label: d.name, value: d.id }))"
            :placeholder="t('reports.allDepts')"
          />
        </div>
      </div>

      <div class="flex flex-wrap items-end gap-3 mt-4">
        <AppButton :loading="loading" @click="generateReport">
          {{ t('reports.generate') }}
        </AppButton>
      </div>
    </AppCard>

    <!-- Results -->
    <template v-if="reportGenerated && report">
      <!-- Summary Stats -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          v-for="stat in summaryStats"
          :key="stat.title"
          :title="stat.title"
          :value="stat.value"
        />
      </div>

      <!-- Data Table -->
      <AppCard :title="currentReportLabel">
        <template #actions>
          <div class="flex items-center gap-2">
            <AppSelect
              v-model="exportFormat"
              :options="exportFormatOptions"
              class="w-28"
            />
            <AppButton variant="outline" size="sm" :loading="exporting" @click="handleExport">
              {{ t('reports.download') }}
            </AppButton>
          </div>
        </template>
        <DataTable :columns="currentColumns" :data="report.rows" :loading="loading" />
      </AppCard>
    </template>
  </div>
</template>
