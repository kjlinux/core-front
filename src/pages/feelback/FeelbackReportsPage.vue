<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { feelbackReportApi, type FeelbackReportData } from '@/services/api/feelback-report.api'
import { siteApi } from '@/services/api/site.api'
import { exportToPdf, exportToExcel } from '@/utils/export-helpers'
import { formatPercent } from '@/utils/format'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import StatCard from '@/components/data-display/StatCard.vue'
import DataTable from '@/components/data-display/DataTable.vue'
import type { TableColumn } from '@/types/common'

const toast = useToast()

const reportType = ref('global')
const startDate = ref('')
const endDate = ref('')
const selectedSite = ref('')
const loading = ref(false)
const reportGenerated = ref(false)
const report = ref<FeelbackReportData | null>(null)

const reportTypes = [
  { label: 'Rapport global', value: 'global' },
  { label: 'Rapport par site', value: 'site' },
  { label: 'Rapport par periode', value: 'period' },
]

const siteOptions = ref([{ label: 'Tous les sites', value: '' }])

async function loadSites() {
  try {
    const response = await siteApi.getAll()
    siteOptions.value = [
      { label: 'Tous les sites', value: '' },
      ...response.data.map((s) => ({ label: s.name, value: s.id })),
    ]
  } catch {
    // Garder l'option par defaut si l'API echoue
  }
}

onMounted(() => {
  loadSites()
})


const siteColumns: TableColumn[] = [
  { key: 'site', label: 'Site' },
  { key: 'totalResponses', label: 'Total reponses', align: 'center' },
  { key: 'bon', label: 'Bon', align: 'center' },
  { key: 'neutre', label: 'Neutre', align: 'center' },
  { key: 'mauvais', label: 'Mauvais', align: 'center' },
  { key: 'satisfactionRateFormatted', label: 'Taux satisfaction', align: 'center' },
]

const activeColumns = computed(() => siteColumns)

const tableData = computed(() => {
  if (!report.value) return []
  const source = report.value.bySite
  return source.map((row) => ({
    ...row,
    satisfactionRateFormatted: formatPercent(row.satisfactionRate),
  }))
})

const periodLabel = computed(() => {
  if (startDate.value && endDate.value) return `Periode: ${startDate.value} au ${endDate.value}`
  return ''
})

async function generateReport() {
  if (!startDate.value || !endDate.value) {
    toast.showError('Veuillez selectionner une periode')
    return
  }
  loading.value = true
  try {
    const params: Record<string, string> = {
      start_date: startDate.value,
      end_date: endDate.value,
      type: reportType.value,
    }
    if (selectedSite.value) params.site_id = selectedSite.value
    report.value = await feelbackReportApi.getReport(params)
    reportGenerated.value = true
    toast.showSuccess('Rapport genere avec succes')
  } catch {
    toast.showError('Erreur lors de la generation du rapport')
  } finally {
    loading.value = false
  }
}

async function handleExportPdf() {
  if (!report.value) return
  const reportLabel = reportTypes.find((o) => o.value === reportType.value)?.label ?? 'Rapport'
  await exportToPdf({
    filename: `feelback-${reportType.value}-${startDate.value}`,
    title: `Rapport Feelback - ${reportLabel}`,
    subtitle: periodLabel.value,
    summaryRows: [
      { label: 'Total reponses', value: report.value.totalResponses },
      { label: 'Taux bon', value: formatPercent(report.value.bonRate) },
      { label: 'Taux neutre', value: formatPercent(report.value.neutreRate) },
      { label: 'Taux mauvais', value: formatPercent(report.value.mauvaisRate) },
    ],
    columns: activeColumns.value.map((c) => ({ header: c.label, key: c.key })),
    data: tableData.value,
  })
  toast.showSuccess('Le fichier PDF a ete telecharge')
}

async function handleExportExcel() {
  if (!report.value) return
  const reportLabel = reportTypes.find((o) => o.value === reportType.value)?.label ?? 'Rapport'
  await exportToExcel({
    filename: `feelback-${reportType.value}-${startDate.value}`,
    title: `Rapport Feelback - ${reportLabel}`,
    subtitle: periodLabel.value,
    summaryRows: [
      { label: 'Total reponses', value: report.value.totalResponses },
      { label: 'Taux bon', value: formatPercent(report.value.bonRate) },
      { label: 'Taux neutre', value: formatPercent(report.value.neutreRate) },
      { label: 'Taux mauvais', value: formatPercent(report.value.mauvaisRate) },
    ],
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

    <!-- Filters -->
    <AppCard title="Parametres du rapport">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <AppSelect v-model="reportType" label="Type de rapport" :options="reportTypes" />
        <AppInput v-model="startDate" label="Date debut" type="date" />
        <AppInput v-model="endDate" label="Date fin" type="date" />
        <AppSelect v-model="selectedSite" label="Site" :options="siteOptions" />
      </div>
      <div class="flex gap-3">
        <AppButton :loading="loading" @click="generateReport">Generer le rapport</AppButton>
      </div>
    </AppCard>

    <!-- Results -->
    <template v-if="reportGenerated && report">
      <!-- Summary Stats -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total reponses" :value="report.totalResponses" />
        <StatCard title="Taux bon" :value="formatPercent(report.bonRate)" />
        <StatCard title="Taux neutre" :value="formatPercent(report.neutreRate)" />
        <StatCard title="Taux mauvais" :value="formatPercent(report.mauvaisRate)" />
      </div>

      <!-- Data Table -->
      <AppCard title="Resultats detailles">
        <template #header-actions>
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
