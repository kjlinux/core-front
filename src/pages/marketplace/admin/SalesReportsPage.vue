<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { salesReportApi, type SalesReportData } from '@/services/api/sales-report.api'
import { useToast } from '@/composables/useToast'
import { formatCurrency } from '@/utils/format'
import { exportToPdf, exportToExcel } from '@/utils/export-helpers'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import StatCard from '@/components/data-display/StatCard.vue'
import BarChart from '@/components/charts/BarChart.vue'
import PieChart from '@/components/charts/PieChart.vue'

const { t } = useI18n()
const toast = useToast()

const startDate = ref('')
const endDate = ref('')
const isLoading = ref(false)
const report = ref<SalesReportData | null>(null)

const revenueChartData = computed(() => {
  if (!report.value) return []
  return report.value.revenueByMonth.map((item) => ({
    name: item.month,
    value: item.revenue,
  }))
})

const statusPieData = computed(() => report.value?.ordersByStatus ?? [])
const topProductsData = computed(() => report.value?.topProducts ?? [])
const monthlyData = computed(() => report.value?.revenueByMonth ?? [])

async function fetchReport() {
  isLoading.value = true
  try {
    const params: Record<string, string> = {}
    if (startDate.value) params.start_date = startDate.value
    if (endDate.value) params.end_date = endDate.value
    report.value = await salesReportApi.getReport(params)
  } catch {
    toast.showError('Erreur lors du chargement du rapport')
  } finally {
    isLoading.value = false
  }
}

const periodLabel = computed(() => {
  if (startDate.value && endDate.value) return `Periode: ${startDate.value} au ${endDate.value}`
  return 'Toutes les periodes'
})

async function handleExportPdf() {
  if (!report.value) return
  await exportToPdf({
    filename: `ventes-rapport-${startDate.value || 'complet'}`,
    title: 'Rapport de ventes - Marketplace',
    subtitle: periodLabel.value,
    summaryRows: [
      { label: t('marketplace.totalOrders'), value: report.value.totalOrders },
      { label: t('marketplace.totalRevenue'), value: formatCurrency(report.value.totalRevenue) },
      { label: t('marketplace.avgCart'), value: formatCurrency(report.value.averageBasket) },
      { label: t('marketplace.pendingOrders'), value: report.value.pendingOrders },
    ],
    columns: [
      { header: t('marketplace.month'), key: 'month' },
      { header: t('marketplace.nbOrders'), key: 'orders' },
      { header: t('marketplace.revenue'), key: 'revenueFormatted' },
    ],
    data: report.value.revenueByMonth.map((r) => ({
      ...r,
      revenueFormatted: formatCurrency(r.revenue),
    })),
  })
  toast.showSuccess(t('marketplace.pdfDownloaded'))
}

async function handleExportExcel() {
  if (!report.value) return
  await exportToExcel({
    filename: `ventes-rapport-${startDate.value || 'complet'}`,
    title: 'Rapport de ventes - Marketplace',
    subtitle: periodLabel.value,
    summaryRows: [
      { label: t('marketplace.totalOrders'), value: report.value.totalOrders },
      { label: t('marketplace.totalRevenue'), value: formatCurrency(report.value.totalRevenue) },
      { label: t('marketplace.avgCart'), value: formatCurrency(report.value.averageBasket) },
      { label: t('marketplace.pendingOrders'), value: report.value.pendingOrders },
    ],
    columns: [
      { header: t('marketplace.month'), key: 'month', width: 20 },
      { header: t('marketplace.nbOrders'), key: 'orders', width: 18 },
      { header: t('marketplace.revenue'), key: 'revenueFormatted', width: 22 },
    ],
    data: report.value.revenueByMonth.map((r) => ({
      ...r,
      revenueFormatted: formatCurrency(r.revenue),
    })),
  })
  toast.showSuccess(t('marketplace.excelDownloaded'))
}

watch([startDate, endDate], () => {
  if (startDate.value && endDate.value) {
    fetchReport()
  }
})

onMounted(() => {
  fetchReport()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('marketplace.salesReportsTitle') }}</h1>
      <div class="flex gap-2">
        <AppButton variant="outline" size="sm" :disabled="!report" @click="handleExportPdf">
          {{ t('common.exportPdf') }}
        </AppButton>
        <AppButton variant="outline" size="sm" :disabled="!report" @click="handleExportExcel">
          {{ t('common.exportExcel') }}
        </AppButton>
      </div>
    </div>

    <div class="flex gap-4">
      <AppInput v-model="startDate" type="date" />
      <AppInput v-model="endDate" type="date" />
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard :title="t('marketplace.totalOrders')" :value="report?.totalOrders ?? 0" />
      <StatCard :title="t('marketplace.totalRevenue')" :value="formatCurrency(report?.totalRevenue ?? 0)" />
      <StatCard :title="t('marketplace.avgCart')" :value="formatCurrency(report?.averageBasket ?? 0)" />
      <StatCard :title="t('marketplace.pendingOrders')" :value="report?.pendingOrders ?? 0" />
    </div>

    <AppCard :title="t('marketplace.revenueChart')">
      <BarChart :data="revenueChartData" :title="t('marketplace.monthlyRevenue')" />
    </AppCard>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AppCard :title="t('marketplace.ordersByStatus')">
        <PieChart :data="statusPieData" title="Repartition" />
      </AppCard>
      <AppCard :title="t('marketplace.topProducts')">
        <BarChart :data="topProductsData" :title="t('marketplace.soldQty')" />
      </AppCard>
    </div>

    <AppCard :title="t('marketplace.monthlyBalance')">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('marketplace.month') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('marketplace.nbOrders') }}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ t('marketplace.revenue') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="row in monthlyData" :key="row.month" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ row.month }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ row.orders }}</td>
              <td class="px-4 py-3 text-sm font-semibold text-primary">{{ formatCurrency(row.revenue) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>
  </div>
</template>
