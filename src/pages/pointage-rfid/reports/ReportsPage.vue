<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import DataTable from '@/components/data-display/DataTable.vue'
import StatCard from '@/components/data-display/StatCard.vue'
import { useAttendanceStore } from '@/stores/attendance.store'
import { useToast } from '@/composables/useToast'
import type { TableColumn } from '@/types/common'

const attendanceStore = useAttendanceStore()
const { success, error } = useToast()

const reportType = ref('daily')
const startDate = ref('')
const endDate = ref('')
const selectedCompany = ref('')
const selectedSite = ref('')
const selectedDepartment = ref('')
const loading = ref(false)
const reportGenerated = ref(false)

const reportTypeOptions = [
  { label: 'Rapport journalier', value: 'daily' },
  { label: 'Rapport hebdomadaire', value: 'weekly' },
  { label: 'Rapport mensuel', value: 'monthly' },
  { label: 'Rapport de retards', value: 'late' },
  { label: 'Rapport d\'absences', value: 'absence' },
  { label: 'Rapport par employe', value: 'employee' },
]

const mockReportData = [
  { id: '1', employee: 'Amadou Diallo', department: 'RH', site: 'Siege Social', present: 22, absent: 0, late: 1, overtime: 2.5, rate: '95.6%' },
  { id: '2', employee: 'Fatima Coulibaly', department: 'Finance', site: 'Siege Social', present: 21, absent: 1, late: 0, overtime: 1.5, rate: '91.3%' },
  { id: '3', employee: 'Ibrahim Traore', department: 'IT', site: 'Agence Nord', present: 20, absent: 2, late: 2, overtime: 0, rate: '86.9%' },
  { id: '4', employee: 'Mariam Kone', department: 'Operations', site: 'Agence Est', present: 22, absent: 0, late: 0, overtime: 3.0, rate: '100%' },
  { id: '5', employee: 'Oumar Bah', department: 'Ventes', site: 'Agence Sud', present: 19, absent: 3, late: 1, overtime: 0, rate: '82.6%' },
]

const columns: TableColumn[] = [
  { key: 'employee', label: 'Employe' },
  { key: 'department', label: 'Departement' },
  { key: 'site', label: 'Site' },
  { key: 'present', label: 'Jours presents', align: 'center' },
  { key: 'absent', label: 'Absences', align: 'center' },
  { key: 'late', label: 'Retards', align: 'center' },
  { key: 'overtime', label: 'Heures sup.', align: 'center' },
  { key: 'rate', label: 'Taux presence', align: 'center' },
]

const summaryStats = computed(() => {
  const total = mockReportData.length
  const totalPresent = mockReportData.reduce((sum, r) => sum + r.present, 0)
  const totalAbsent = mockReportData.reduce((sum, r) => sum + r.absent, 0)
  const totalLate = mockReportData.reduce((sum, r) => sum + r.late, 0)
  return { total, totalPresent, totalAbsent, totalLate }
})

const generateReport = async () => {
  if (!startDate.value || !endDate.value) {
    error('Champs requis', 'Veuillez selectionner une periode')
    return
  }
  loading.value = true
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    reportGenerated.value = true
    success('Rapport genere', 'Le rapport a ete genere avec succes')
  } finally {
    loading.value = false
  }
}

const exportPdf = () => {
  success('Export PDF', 'Le fichier PDF a ete telecharge')
}

const exportExcel = () => {
  success('Export Excel', 'Le fichier Excel a ete telecharge')
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
      </div>
      <div class="flex gap-3 mt-4">
        <AppButton :loading="loading" @click="generateReport">
          Generer le rapport
        </AppButton>
      </div>
    </AppCard>

    <!-- Results -->
    <template v-if="reportGenerated">
      <!-- Summary Stats -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Employes" :value="summaryStats.total" />
        <StatCard title="Jours presents" :value="summaryStats.totalPresent" />
        <StatCard title="Absences" :value="summaryStats.totalAbsent" />
        <StatCard title="Retards" :value="summaryStats.totalLate" />
      </div>

      <!-- Data Table -->
      <AppCard title="Resultats">
        <template #header-actions>
          <div class="flex gap-2">
            <AppButton variant="outline" size="sm" @click="exportPdf">
              Exporter PDF
            </AppButton>
            <AppButton variant="outline" size="sm" @click="exportExcel">
              Exporter Excel
            </AppButton>
          </div>
        </template>
        <DataTable :columns="columns" :data="mockReportData" :loading="loading" />
      </AppCard>
    </template>
  </div>
</template>
