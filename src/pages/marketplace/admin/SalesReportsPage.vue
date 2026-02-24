<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useOrderStore } from '@/stores/order.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import StatCard from '@/components/data-display/StatCard.vue'
import BarChart from '@/components/charts/BarChart.vue'
import PieChart from '@/components/charts/PieChart.vue'

const store = useOrderStore()
const toast = useToast()

const startDate = ref('')
const endDate = ref('')

const revenueByMonth = {
  xData: ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'],
  series: [{ name: 'Revenus (FCFA)', data: [850000, 1200000, 950000, 1400000, 1800000, 1600000, 2100000, 1900000, 2300000, 2500000, 2200000, 2800000] }],
}
const revenueData = revenueByMonth.xData.map((name, i) => ({ name, value: revenueByMonth.series[0]?.data[i] ?? 0 }))

const statusPieData = [
  { name: 'Livrees', value: 145 },
  { name: 'En cours', value: 32 },
  { name: 'Annulees', value: 12 },
  { name: 'En attente', value: 18 },
]

const topProducts = {
  xData: ['Carte Std', 'Carte Perso', 'Pack Pro', 'Pack Enterprise', 'Accessoires'],
  series: [{ name: 'Quantite vendue', data: [520, 340, 180, 95, 210] }],
}
const topProductsData = topProducts.xData.map((name, i) => ({ name, value: topProducts.series[0]?.data[i] ?? 0 }))

const monthlyData = [
  { month: 'Octobre 2024', orders: 45, revenue: 2500000 },
  { month: 'Novembre 2024', orders: 52, revenue: 2800000 },
  { month: 'Decembre 2024', orders: 61, revenue: 3400000 },
]

function formatPrice(amount: number) {
  return `${amount.toLocaleString('fr-FR')} FCFA`
}

function exportReport() {
  toast.showSuccess('Export du rapport en cours...')
}

onMounted(async () => {
  await store.fetchAllOrders()
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
      <StatCard title="Total commandes" :value="store.orders.length" />
      <StatCard title="Revenue total" value="21 850 000 FCFA" />
      <StatCard title="Panier moyen" value="103 000 FCFA" />
      <StatCard title="Commandes en attente" :value="store.orders.filter((o) => o.status === 'pending').length" />
    </div>

    <AppCard title="Revenus par mois">
      <BarChart :data="revenueData" title="Revenus mensuels" />
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
