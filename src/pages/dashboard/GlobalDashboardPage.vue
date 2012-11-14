<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Tableau de bord</h1>
      <p class="text-sm text-gray-600 mt-1">Vue d'ensemble des statistiques globales</p>
    </div>

    <!-- Loading State -->
    <div v-if="dashboardStore.isLoading" class="flex items-center justify-center py-12">
      <AppSpinner size="lg" class="text-primary-600" />
    </div>

    <!-- Stats Grid -->
    <div
      v-else-if="dashboardStore.stats"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <StatCard
        title="Entreprises actives"
        :value="dashboardStore.stats.activeCompanies"
        icon="🏢"
        icon-bg-class="bg-blue-100"
        icon-color-class="text-blue-600"
      />

      <StatCard
        title="Equipements connectes"
        :value="dashboardStore.stats.connectedDevices"
        icon="📱"
        icon-bg-class="bg-purple-100"
        icon-color-class="text-purple-600"
      />

      <StatCard
        title="Employes enregistres"
        :value="dashboardStore.stats.totalEmployees"
        icon="👥"
        icon-bg-class="bg-green-100"
        icon-color-class="text-green-600"
      />

      <StatCard
        title="Taux satisfaction global"
        :value="dashboardStore.stats.globalSatisfactionRate"
        suffix="%"
        icon="⭐"
        icon-bg-class="bg-yellow-100"
        icon-color-class="text-yellow-600"
        :trend="{ value: 5.2, isPositive: true }"
      />

      <StatCard
        title="Cartes RFID vendues"
        :value="dashboardStore.stats.rfidCardsSold"
        icon="💳"
        icon-bg-class="bg-indigo-100"
        icon-color-class="text-indigo-600"
      />

      <StatCard
        title="Revenus marketplace"
        :value="dashboardStore.stats.marketplaceRevenue"
        suffix="XOF"
        icon="💰"
        icon-bg-class="bg-emerald-100"
        icon-color-class="text-emerald-600"
        :trend="{ value: 12.8, isPositive: true }"
      />

      <StatCard
        title="Alertes techniques"
        :value="dashboardStore.stats.technicalAlerts"
        icon="⚠️"
        icon-bg-class="bg-red-100"
        icon-color-class="text-red-600"
        :trend="{ value: 3.1, isPositive: false }"
      />
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="text-center py-12 bg-white rounded-xl border border-gray-200"
    >
      <p class="text-gray-500">Aucune donnee disponible</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard.store'
import StatCard from '@/components/data-display/StatCard.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'

const dashboardStore = useDashboardStore()

onMounted(async () => {
  await dashboardStore.fetchStats()
})
</script>
