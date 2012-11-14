<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import AppCard from '@/components/ui/AppCard.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Calendar from 'primevue/calendar'
import MultiSelect from 'primevue/multiselect'
import { useAttendanceStore } from '@/stores/attendance'
import type { SelectOption } from '@/types/components'

interface ReportPreviewData {
  id: number
  [key: string]: any
}

interface ReportSummary {
  label: string
  value: string | number
  icon?: string
}

interface RecentExport {
  id: number
  name: string
  type: string
  dateRange: string
  generatedDate: string
  format: string
}

const toast = useToast()
const attendanceStore = useAttendanceStore()

// Report type options
const reportTypes: SelectOption[] = [
  { label: 'Rapport journalier', value: 'daily' },
  { label: 'Rapport mensuel', value: 'monthly' },
  { label: 'Rapport par employe', value: 'by_employee' },
  { label: 'Rapport par departement', value: 'by_department' },
  { label: 'Rapport des retards', value: 'late' },
  { label: 'Rapport des absences', value: 'absence' }
]

// Status options
const statusOptions: SelectOption[] = [
  { label: 'Present', value: 'present' },
  { label: 'Absent', value: 'absent' },
  { label: 'En retard', value: 'late' }
]

// Mock data for companies, sites, departments, employees
const companies: SelectOption[] = [
  { label: 'Entreprise A', value: '1' },
  { label: 'Entreprise B', value: '2' },
  { label: 'Entreprise C', value: '3' }
]

const sites: SelectOption[] = [
  { label: 'Site Principal', value: '1' },
  { label: 'Site Secondaire', value: '2' },
  { label: 'Site Tertiaire', value: '3' }
]

const departments: SelectOption[] = [
  { label: 'Departement IT', value: '1' },
  { label: 'Departement RH', value: '2' },
  { label: 'Departement Finance', value: '3' },
  { label: 'Departement Commercial', value: '4' }
]

const employees: SelectOption[] = [
  { label: 'Jean Dupont', value: '1' },
  { label: 'Marie Martin', value: '2' },
  { label: 'Pierre Durand', value: '3' },
  { label: 'Sophie Bernard', value: '4' },
  { label: 'Luc Petit', value: '5' }
]

// Form state
const selectedReportType = ref<string>('')
const startDate = ref<Date | null>(null)
const endDate = ref<Date | null>(null)
const selectedCompany = ref<string>('')
const selectedSite = ref<string>('')
const selectedDepartment = ref<string>('')
const selectedEmployee = ref<string>('')
const selectedStatuses = ref<string[]>([])

// Preview state
const isLoadingPreview = ref(false)
const previewData = ref<ReportPreviewData[]>([])
const summaryStats = ref<ReportSummary[]>([])

// Recent exports mock data
const recentExports = ref<RecentExport[]>([
  {
    id: 1,
    name: 'Rapport journalier - 2026-02-23',
    type: 'Rapport journalier',
    dateRange: '2026-02-23',
    generatedDate: '2026-02-23 14:30',
    format: 'PDF'
  },
  {
    id: 2,
    name: 'Rapport mensuel - Fevrier 2026',
    type: 'Rapport mensuel',
    dateRange: '2026-02-01 - 2026-02-28',
    generatedDate: '2026-02-22 10:15',
    format: 'Excel'
  },
  {
    id: 3,
    name: 'Rapport par employe - Jean Dupont',
    type: 'Rapport par employe',
    dateRange: '2026-02-01 - 2026-02-23',
    generatedDate: '2026-02-21 16:45',
    format: 'PDF'
  },
  {
    id: 4,
    name: 'Rapport des retards - Fevrier',
    type: 'Rapport des retards',
    dateRange: '2026-02-01 - 2026-02-23',
    generatedDate: '2026-02-20 09:00',
    format: 'Excel'
  },
  {
    id: 5,
    name: 'Rapport par departement - IT',
    type: 'Rapport par departement',
    dateRange: '2026-02-01 - 2026-02-15',
    generatedDate: '2026-02-19 11:30',
    format: 'PDF'
  }
])

// Computed properties
const showDateRange = computed(() => selectedReportType.value !== '')
const showCompanyFilter = computed(() => selectedReportType.value !== '')
const showSiteFilter = computed(() => selectedReportType.value !== '')
const showDepartmentFilter = computed(() =>
  ['by_department', 'daily', 'monthly'].includes(selectedReportType.value)
)
const showEmployeeFilter = computed(() => selectedReportType.value === 'by_employee')
const showStatusFilter = computed(() =>
  ['daily', 'monthly', 'by_employee'].includes(selectedReportType.value)
)

const canGeneratePreview = computed(() => {
  if (!selectedReportType.value) return false
  if (!startDate.value || !endDate.value) return false

  if (selectedReportType.value === 'by_employee' && !selectedEmployee.value) return false
  if (selectedReportType.value === 'by_department' && !selectedDepartment.value) return false

  return true
})

const previewColumns = computed(() => {
  switch (selectedReportType.value) {
    case 'daily':
      return [
        { field: 'employeeName', header: 'Employe' },
        { field: 'department', header: 'Departement' },
        { field: 'checkIn', header: 'Entree' },
        { field: 'checkOut', header: 'Sortie' },
        { field: 'status', header: 'Statut' }
      ]
    case 'monthly':
      return [
        { field: 'employeeName', header: 'Employe' },
        { field: 'totalDays', header: 'Jours travailles' },
        { field: 'presentDays', header: 'Presents' },
        { field: 'absentDays', header: 'Absents' },
        { field: 'lateDays', header: 'Retards' }
      ]
    case 'by_employee':
      return [
        { field: 'date', header: 'Date' },
        { field: 'checkIn', header: 'Entree' },
        { field: 'checkOut', header: 'Sortie' },
        { field: 'totalHours', header: 'Heures totales' },
        { field: 'status', header: 'Statut' }
      ]
    case 'by_department':
      return [
        { field: 'employeeName', header: 'Employe' },
        { field: 'presentDays', header: 'Jours presents' },
        { field: 'absentDays', header: 'Jours absents' },
        { field: 'lateDays', header: 'Retards' },
        { field: 'totalHours', header: 'Heures totales' }
      ]
    case 'late':
      return [
        { field: 'date', header: 'Date' },
        { field: 'employeeName', header: 'Employe' },
        { field: 'department', header: 'Departement' },
        { field: 'expectedTime', header: 'Heure prevue' },
        { field: 'actualTime', header: 'Heure reelle' },
        { field: 'delay', header: 'Retard (min)' }
      ]
    case 'absence':
      return [
        { field: 'date', header: 'Date' },
        { field: 'employeeName', header: 'Employe' },
        { field: 'department', header: 'Departement' },
        { field: 'reason', header: 'Raison' }
      ]
    default:
      return []
  }
})

// Methods
const generateMockPreviewData = (): ReportPreviewData[] => {
  switch (selectedReportType.value) {
    case 'daily':
      return [
        { id: 1, employeeName: 'Jean Dupont', department: 'IT', checkIn: '08:00', checkOut: '17:00', status: 'Present' },
        { id: 2, employeeName: 'Marie Martin', department: 'RH', checkIn: '08:15', checkOut: '17:15', status: 'En retard' },
        { id: 3, employeeName: 'Pierre Durand', department: 'Finance', checkIn: '08:00', checkOut: '17:00', status: 'Present' },
        { id: 4, employeeName: 'Sophie Bernard', department: 'Commercial', checkIn: '-', checkOut: '-', status: 'Absent' },
        { id: 5, employeeName: 'Luc Petit', department: 'IT', checkIn: '08:05', checkOut: '17:05', status: 'Present' }
      ]
    case 'monthly':
      return [
        { id: 1, employeeName: 'Jean Dupont', totalDays: 20, presentDays: 18, absentDays: 1, lateDays: 1 },
        { id: 2, employeeName: 'Marie Martin', totalDays: 20, presentDays: 19, absentDays: 0, lateDays: 1 },
        { id: 3, employeeName: 'Pierre Durand', totalDays: 20, presentDays: 20, absentDays: 0, lateDays: 0 },
        { id: 4, employeeName: 'Sophie Bernard', totalDays: 20, presentDays: 17, absentDays: 3, lateDays: 0 },
        { id: 5, employeeName: 'Luc Petit', totalDays: 20, presentDays: 19, absentDays: 0, lateDays: 1 }
      ]
    case 'by_employee':
      return [
        { id: 1, date: '2026-02-23', checkIn: '08:00', checkOut: '17:00', totalHours: '9h00', status: 'Present' },
        { id: 2, date: '2026-02-22', checkIn: '08:15', checkOut: '17:15', totalHours: '9h00', status: 'En retard' },
        { id: 3, date: '2026-02-21', checkIn: '08:00', checkOut: '17:00', totalHours: '9h00', status: 'Present' },
        { id: 4, date: '2026-02-20', checkIn: '08:00', checkOut: '17:00', totalHours: '9h00', status: 'Present' },
        { id: 5, date: '2026-02-19', checkIn: '-', checkOut: '-', totalHours: '0h00', status: 'Absent' }
      ]
    case 'by_department':
      return [
        { id: 1, employeeName: 'Jean Dupont', presentDays: 18, absentDays: 1, lateDays: 1, totalHours: '162h00' },
        { id: 2, employeeName: 'Luc Petit', presentDays: 19, absentDays: 0, lateDays: 1, totalHours: '171h00' },
        { id: 3, employeeName: 'Marc Lefebvre', presentDays: 20, absentDays: 0, lateDays: 0, totalHours: '180h00' },
        { id: 4, employeeName: 'Anne Moreau', presentDays: 17, absentDays: 2, lateDays: 1, totalHours: '153h00' }
      ]
    case 'late':
      return [
        { id: 1, date: '2026-02-23', employeeName: 'Marie Martin', department: 'RH', expectedTime: '08:00', actualTime: '08:15', delay: 15 },
        { id: 2, date: '2026-02-22', employeeName: 'Jean Dupont', department: 'IT', expectedTime: '08:00', actualTime: '08:20', delay: 20 },
        { id: 3, date: '2026-02-21', employeeName: 'Luc Petit', department: 'IT', expectedTime: '08:00', actualTime: '08:10', delay: 10 },
        { id: 4, date: '2026-02-20', employeeName: 'Marie Martin', department: 'RH', expectedTime: '08:00', actualTime: '08:25', delay: 25 },
        { id: 5, date: '2026-02-19', employeeName: 'Anne Moreau', department: 'IT', expectedTime: '08:00', actualTime: '08:30', delay: 30 }
      ]
    case 'absence':
      return [
        { id: 1, date: '2026-02-23', employeeName: 'Sophie Bernard', department: 'Commercial', reason: 'Conge maladie' },
        { id: 2, date: '2026-02-22', employeeName: 'Marc Lefebvre', department: 'Finance', reason: 'Conge personnel' },
        { id: 3, date: '2026-02-21', employeeName: 'Jean Dupont', department: 'IT', reason: 'Conge maladie' },
        { id: 4, date: '2026-02-20', employeeName: 'Sophie Bernard', department: 'Commercial', reason: 'Conge maladie' },
        { id: 5, date: '2026-02-19', employeeName: 'Sophie Bernard', department: 'Commercial', reason: 'Conge maladie' }
      ]
    default:
      return []
  }
}

const generateMockSummaryStats = (): ReportSummary[] => {
  switch (selectedReportType.value) {
    case 'daily':
      return [
        { label: 'Total employes', value: 50 },
        { label: 'Presents', value: 42 },
        { label: 'Absents', value: 5 },
        { label: 'En retard', value: 3 }
      ]
    case 'monthly':
      return [
        { label: 'Total employes', value: 50 },
        { label: 'Taux de presence', value: '92%' },
        { label: 'Jours travailles', value: 1000 },
        { label: 'Total absences', value: 45 }
      ]
    case 'by_employee':
      return [
        { label: 'Jours travailles', value: 18 },
        { label: 'Jours absents', value: 1 },
        { label: 'Retards', value: 1 },
        { label: 'Heures totales', value: '162h00' }
      ]
    case 'by_department':
      return [
        { label: 'Total employes', value: 12 },
        { label: 'Taux de presence', value: '94%' },
        { label: 'Total heures', value: '2016h00' },
        { label: 'Total retards', value: 8 }
      ]
    case 'late':
      return [
        { label: 'Total retards', value: 45 },
        { label: 'Retard moyen', value: '18 min' },
        { label: 'Employes concernes', value: 15 },
        { label: 'Retard max', value: '45 min' }
      ]
    case 'absence':
      return [
        { label: 'Total absences', value: 45 },
        { label: 'Conges maladie', value: 25 },
        { label: 'Conges personnels', value: 15 },
        { label: 'Non justifies', value: 5 }
      ]
    default:
      return []
  }
}

const generatePreview = async () => {
  if (!canGeneratePreview.value) return

  isLoadingPreview.value = true

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    previewData.value = generateMockPreviewData()
    summaryStats.value = generateMockSummaryStats()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de la generation de l\'apercu',
      life: 3000
    })
  } finally {
    isLoadingPreview.value = false
  }
}

const exportToExcel = () => {
  toast.add({
    severity: 'info',
    summary: 'Export Excel',
    detail: 'Export Excel en cours...',
    life: 3000
  })
}

const exportToPDF = () => {
  toast.add({
    severity: 'info',
    summary: 'Export PDF',
    detail: 'Export PDF en cours...',
    life: 3000
  })
}

// Watch for form changes to regenerate preview
watch(
  [selectedReportType, startDate, endDate, selectedCompany, selectedSite, selectedDepartment, selectedEmployee, selectedStatuses],
  () => {
    if (canGeneratePreview.value) {
      generatePreview()
    } else {
      previewData.value = []
      summaryStats.value = []
    }
  },
  { deep: true }
)
</script>

<template>
  <div class="reports-page">
    <h1 class="page-title">Rapports</h1>

    <!-- Report Configuration -->
    <AppCard title="Configuration du rapport" class="mb-4">
      <div class="form-grid">
        <!-- Report Type -->
        <div class="form-field">
          <label for="report-type">Type de rapport</label>
          <AppSelect
            id="report-type"
            v-model="selectedReportType"
            :options="reportTypes"
            placeholder="Selectionnez un type de rapport"
          />
        </div>

        <!-- Date Range -->
        <div v-if="showDateRange" class="form-field">
          <label for="start-date">Date de debut</label>
          <Calendar
            id="start-date"
            v-model="startDate"
            dateFormat="dd/mm/yy"
            showIcon
            :maxDate="endDate || undefined"
            placeholder="Selectionnez la date de debut"
          />
        </div>

        <div v-if="showDateRange" class="form-field">
          <label for="end-date">Date de fin</label>
          <Calendar
            id="end-date"
            v-model="endDate"
            dateFormat="dd/mm/yy"
            showIcon
            :minDate="startDate || undefined"
            placeholder="Selectionnez la date de fin"
          />
        </div>

        <!-- Company Filter -->
        <div v-if="showCompanyFilter" class="form-field">
          <label for="company">Entreprise</label>
          <AppSelect
            id="company"
            v-model="selectedCompany"
            :options="companies"
            placeholder="Toutes les entreprises"
          />
        </div>

        <!-- Site Filter -->
        <div v-if="showSiteFilter" class="form-field">
          <label for="site">Site</label>
          <AppSelect
            id="site"
            v-model="selectedSite"
            :options="sites"
            placeholder="Tous les sites"
          />
        </div>

        <!-- Department Filter -->
        <div v-if="showDepartmentFilter" class="form-field">
          <label for="department">Departement</label>
          <AppSelect
            id="department"
            v-model="selectedDepartment"
            :options="departments"
            placeholder="Tous les departements"
          />
        </div>

        <!-- Employee Filter -->
        <div v-if="showEmployeeFilter" class="form-field">
          <label for="employee">Employe</label>
          <AppSelect
            id="employee"
            v-model="selectedEmployee"
            :options="employees"
            placeholder="Selectionnez un employe"
          />
        </div>

        <!-- Status Filter -->
        <div v-if="showStatusFilter" class="form-field">
          <label for="status">Statuts</label>
          <MultiSelect
            id="status"
            v-model="selectedStatuses"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Tous les statuts"
            display="chip"
          />
        </div>
      </div>
    </AppCard>

    <!-- Preview Section -->
    <AppCard v-if="selectedReportType" title="Apercu du rapport" class="mb-4">
      <div v-if="!canGeneratePreview" class="preview-empty">
        <p>Veuillez remplir tous les champs requis pour generer l'apercu</p>
      </div>

      <div v-else-if="isLoadingPreview" class="preview-loading">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
        <p>Chargement de l'apercu...</p>
      </div>

      <div v-else>
        <!-- Summary Stats -->
        <div class="summary-stats mb-4">
          <div
            v-for="stat in summaryStats"
            :key="stat.label"
            class="stat-card"
          >
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-value">{{ stat.value }}</div>
          </div>
        </div>

        <!-- Preview Table -->
        <div class="preview-table">
          <h3 class="mb-3">Apercu des donnees (10 premieres lignes)</h3>
          <DataTable
            :value="previewData.slice(0, 10)"
            :paginator="false"
            stripedRows
            responsiveLayout="scroll"
          >
            <Column
              v-for="col in previewColumns"
              :key="col.field"
              :field="col.field"
              :header="col.header"
            />
          </DataTable>
        </div>

        <!-- Export Buttons -->
        <div class="export-buttons mt-4">
          <AppButton
            label="Exporter en Excel"
            icon="pi pi-file-excel"
            severity="success"
            @click="exportToExcel"
          />
          <AppButton
            label="Exporter en PDF"
            icon="pi pi-file-pdf"
            severity="danger"
            @click="exportToPDF"
          />
        </div>
      </div>
    </AppCard>

    <!-- Recent Exports -->
    <AppCard title="Exports recents">
      <DataTable
        :value="recentExports"
        :paginator="true"
        :rows="5"
        stripedRows
        responsiveLayout="scroll"
      >
        <Column field="name" header="Nom du rapport" />
        <Column field="type" header="Type" />
        <Column field="dateRange" header="Periode" />
        <Column field="generatedDate" header="Date de generation" />
        <Column field="format" header="Format" />
        <Column header="Actions">
          <template #body>
            <AppButton
              label="Telecharger"
              icon="pi pi-download"
              size="small"
              severity="secondary"
              disabled
            />
          </template>
        </Column>
      </DataTable>
    </AppCard>
  </div>
</template>

<style scoped>
.reports-page {
  padding: 1.5rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--text-color);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-weight: 500;
  color: var(--text-color);
}

.preview-empty,
.preview-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-color-secondary);
}

.preview-loading {
  gap: 1rem;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  padding: 1rem;
  text-align: center;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--primary-color);
}

.preview-table h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
}

.export-buttons {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.mb-3 {
  margin-bottom: 0.75rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.mt-4 {
  margin-top: 1rem;
}
</style>
