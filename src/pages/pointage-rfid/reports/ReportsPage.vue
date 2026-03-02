<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import DataTable from '@/components/data-display/DataTable.vue'
import StatCard from '@/components/data-display/StatCard.vue'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth.store'
import { attendanceReportApi, type AttendanceReportData } from '@/services/api/attendance-report.api'
import { exportToPdf, exportToExcel } from '@/utils/export-helpers'
import { companyApi } from '@/services/api/company.api'
import type { TableColumn } from '@/types/common'
import type { Company, Site, Department } from '@/types'

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
const reportTypeOptions = [
  { label: 'Rapport journalier', value: 'daily' },
  { label: 'Rapport hebdomadaire', value: 'weekly' },
  { label: 'Rapport mensuel', value: 'monthly' },
  { label: 'Rapport de retards', value: 'late' },
  { label: "Rapport d'absences", value: 'absence' },
]

const exportFormatOptions = [
  { label: 'PDF', value: 'pdf' },
  { label: 'Excel', value: 'excel' },
]

// ---------- Dynamic columns per report type ----------
const columnsByType: Record<string, TableColumn[]> = {
  daily: [
    { key: 'employee', label: 'Employe' },
    { key: 'department', label: 'Departement' },
    { key: 'site', label: 'Site' },
    { key: 'present', label: 'Present', align: 'center' },
    { key: 'absent', label: 'Absent', align: 'center' },
    { key: 'late', label: 'Retards', align: 'center' },
    { key: 'overtime', label: 'Heures sup.', align: 'center' },
    { key: 'rate', label: 'Taux presence', align: 'center' },
  ],
  weekly: [
    { key: 'employee', label: 'Employe' },
    { key: 'department', label: 'Departement' },
    { key: 'site', label: 'Site' },
    { key: 'present', label: 'Jours presents', align: 'center' },
    { key: 'absent', label: 'Absences', align: 'center' },
    { key: 'late', label: 'Retards', align: 'center' },
    { key: 'overtime', label: 'Heures sup.', align: 'center' },
    { key: 'rate', label: 'Taux presence', align: 'center' },
  ],
  monthly: [
    { key: 'employee', label: 'Employe' },
    { key: 'department', label: 'Departement' },
    { key: 'site', label: 'Site' },
    { key: 'present', label: 'Jours presents', align: 'center' },
    { key: 'absent', label: 'Absences', align: 'center' },
    { key: 'late', label: 'Retards', align: 'center' },
    { key: 'overtime', label: 'Heures sup.', align: 'center' },
    { key: 'rate', label: 'Taux presence', align: 'center' },
  ],
  late: [
    { key: 'employee', label: 'Employe' },
    { key: 'department', label: 'Departement' },
    { key: 'site', label: 'Site' },
    { key: 'late', label: 'Nb retards', align: 'center' },
    { key: 'overtime', label: 'Heures sup.', align: 'center' },
    { key: 'rate', label: 'Taux presence', align: 'center' },
  ],
  absence: [
    { key: 'employee', label: 'Employe' },
    { key: 'department', label: 'Departement' },
    { key: 'site', label: 'Site' },
    { key: 'absent', label: 'Absences', align: 'center' },
    { key: 'rate', label: 'Taux presence', align: 'center' },
  ],
}

const currentColumns = computed(() => columnsByType[reportType.value] ?? columnsByType.daily)

const currentReportLabel = computed(() => {
  return reportTypeOptions.find((o) => o.value === reportType.value)?.label ?? 'Rapport'
})

const periodLabel = computed(() => {
  if (startDate.value && endDate.value) return `Periode: ${startDate.value} au ${endDate.value}`
  return ''
})

// ---------- Summary stats (dynamic per type) ----------
const summaryStats = computed(() => {
  if (!report.value) return []
  const r = report.value
  const base = [
    { title: 'Employes', value: r.totalEmployees },
  ]
  if (reportType.value === 'late') {
    base.push({ title: 'Total retards', value: r.totalLate })
    return base
  }
  if (reportType.value === 'absence') {
    base.push({ title: 'Total absences', value: r.totalAbsent })
    return base
  }
  base.push(
    { title: 'Jours presents', value: r.totalPresent },
    { title: 'Absences', value: r.totalAbsent },
    { title: 'Retards', value: r.totalLate },
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
    error('Champs requis', 'Veuillez selectionner une periode')
    return
  }
  loading.value = true
  try {
    const params: Record<string, string> = {
      start_date: startDate.value,
      end_date: endDate.value,
      type: reportType.value,
    }
    if (selectedCompany.value) params.company_id = selectedCompany.value
    if (selectedSite.value) params.site_id = selectedSite.value
    if (selectedDepartment.value) params.department_id = selectedDepartment.value

    report.value = await attendanceReportApi.getReport(params)
    reportGenerated.value = true
    success('Rapport genere', 'Le rapport a ete genere avec succes')
  } catch {
    error('Erreur', 'Erreur lors de la generation du rapport')
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
    error('Export impossible', 'Aucune donnee a exporter')
    return
  }

  exporting.value = true
  try {
    const baseFilename = `pointage-${reportType.value}-${startDate.value}`
    const title = `Rapport de pointage - ${currentReportLabel.value}`

    if (exportFormat.value === 'pdf') {
      await exportToPdf({
        filename: baseFilename,
        title,
        subtitle: periodLabel.value,
        summaryRows: buildSummaryRows(),
        columns: buildExportColumns(),
        data: report.value.rows as Record<string, unknown>[],
      })
      success('Export PDF', 'Le fichier PDF a ete telecharge')
    } else {
      await exportToExcel({
        filename: baseFilename,
        title,
        subtitle: periodLabel.value,
        summaryRows: buildSummaryRows(),
        columns: buildExportColumns(),
        data: report.value.rows as Record<string, unknown>[],
      })
      success('Export Excel', 'Le fichier Excel a ete telecharge')
    }
  } catch {
    error('Erreur export', 'Erreur lors du telechargement du fichier')
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h1 class="text-2xl font-bold text-gray-900">Rapports de pointage</h1>
    </div>

    <!-- Filters -->
    <AppCard title="Parametres du rapport">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Type de rapport</label>
          <AppSelect v-model="reportType" :options="reportTypeOptions" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date debut</label>
          <AppInput v-model="startDate" type="date" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
          <AppInput v-model="endDate" type="date" />
        </div>

        <!-- Location filters -->
        <div v-if="isSuperAdmin">
          <label class="block text-sm font-medium text-gray-700 mb-1">Entreprise</label>
          <AppSelect
            v-model="selectedCompany"
            :options="companies.map(c => ({ label: c.name, value: c.id }))"
            placeholder="Toutes les entreprises"
          />
        </div>
        <div v-if="sites.length > 0">
          <label class="block text-sm font-medium text-gray-700 mb-1">Site</label>
          <AppSelect
            v-model="selectedSite"
            :options="sites.map(s => ({ label: s.name, value: s.id }))"
            placeholder="Tous les sites"
          />
        </div>
        <div v-if="departments.length > 0">
          <label class="block text-sm font-medium text-gray-700 mb-1">Departement</label>
          <AppSelect
            v-model="selectedDepartment"
            :options="departments.map(d => ({ label: d.name, value: d.id }))"
            placeholder="Tous les departements"
          />
        </div>
      </div>

      <div class="flex flex-wrap items-end gap-3 mt-4">
        <AppButton :loading="loading" @click="generateReport">
          Generer le rapport
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
        <template #header-actions>
          <div class="flex items-center gap-2">
            <AppSelect
              v-model="exportFormat"
              :options="exportFormatOptions"
              class="w-28"
            />
            <AppButton variant="outline" size="sm" :loading="exporting" @click="handleExport">
              Telecharger
            </AppButton>
          </div>
        </template>
        <DataTable :columns="currentColumns" :data="report.rows" :loading="loading" />
      </AppCard>
    </template>
  </div>
</template>
