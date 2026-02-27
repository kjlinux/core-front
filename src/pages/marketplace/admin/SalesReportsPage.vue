<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { salesReportApi, type SalesReportData } from '@/services/api/sales-report.api'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import StatCard from '@/components/data-display/StatCard.vue'
import BarChart from '@/components/charts/BarChart.vue'
import PieChart from '@/components/charts/PieChart.vue'

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

function formatPrice(amount: number) {
  return `${amount.toLocaleString('fr-FR')} FCFA`
}

async function fetchReport() {
  isLoading.value = true
  try {
    const params: Record<string, string> = {}
    if (startDate.value) params.start_date = startDate.value
    if (endDate.value) params.end_date = endDate.value
    const response = await salesReportApi.getReport(params)
    report.value = response.data
  } catch {
    toast.showError('Erreur lors du chargement du rapport')
  } finally {
    isLoading.value = false
  }
}

function exportReport() {
  toast.showSuccess('Export du rapport en cours...')
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
      <h1 class="text-2xl font-bold text-gray-900">Rapports de ventes</h1>
      <AppButton variant="secondary" @click="exportReport">Exporter</AppButton>
    </div>

    <div class="flex gap-4">
      <AppInput v-model="startDate" type="date" placeholder="Date debut" />
      <AppInput v-model="endDate" type="date" placeholder="Date fin" />
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Total commandes" :value="report?.totalOrders ?? 0" />
      <StatCard title="Revenue total" :value="formatPrice(report?.totalRevenue ?? 0)" />
      <StatCard title="Panier moyen" :value="formatPrice(report?.averageBasket ?? 0)" />
      <StatCard title="Commandes en attente" :value="report?.pendingOrders ?? 0" />
    </div>

    <AppCard title="Revenus par mois">
      <BarChart :data="revenueChartData" title="Revenus mensuels" />
    </AppCard>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AppCard title="Commandes par statut">
        <PieChart :data="statusPieData" title="Repartition" />
      </AppCard>
      <AppCard title="Top produits vendus">
        <BarChart :data="topProductsData" title="Quantites vendues" />
      </AppCard>
    </div>

    <AppCard title="Bilan mensuel">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mois</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nb commandes</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="row in monthlyData" :key="row.month" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ row.month }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ row.orders }}</td>
              <td class="px-4 py-3 text-sm font-semibold text-primary">{{ formatPrice(row.revenue) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>
  </div>
</template>
