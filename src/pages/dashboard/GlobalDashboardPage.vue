<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard.store'
import { usePermissions } from '@/composables/usePermissions'
import { useAuthStore } from '@/stores/auth.store'
import StatCard from '@/components/data-display/StatCard.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import PieChart from '@/components/charts/PieChart.vue'
import {
  BuildingOffice2Icon,
  DevicePhoneMobileIcon,
  UsersIcon,
  StarIcon,
  CreditCardIcon,
  BanknotesIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ShoppingCartIcon,
  FingerPrintIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/vue/24/outline'

const dashboardStore = useDashboardStore()
const permissions = usePermissions()
const authStore = useAuthStore()

const isSuperAdmin = permissions.isSuperAdmin
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon apres-midi'
  return 'Bonsoir'
})

const stats = computed(() => dashboardStore.stats)
const charts = computed(() => dashboardStore.charts)

// Valeur affichée : undefined/null → '-'
function val(v: number | undefined | null): number | string {
  return v != null ? v : '-'
}

// Données de fallback pour les graphiques (en cas d'absence de données API)
const attendanceTrendData = computed(() => {
  if (charts.value?.attendanceTrend?.length) return charts.value.attendanceTrend.map(p => ({ name: p.label, value: p.value }))
  return [
    { name: 'Lun', value: 0 }, { name: 'Mar', value: 0 }, { name: 'Mer', value: 0 },
    { name: 'Jeu', value: 0 }, { name: 'Ven', value: 0 }, { name: 'Sam', value: 0 },
  ]
})

const satisfactionTrendData = computed(() => {
  if (charts.value?.satisfactionTrend?.length) return charts.value.satisfactionTrend.map(p => ({ name: p.label, value: p.value }))
  return [
    { name: 'Lun', value: 0 }, { name: 'Mar', value: 0 }, { name: 'Mer', value: 0 },
    { name: 'Jeu', value: 0 }, { name: 'Ven', value: 0 }, { name: 'Sam', value: 0 },
  ]
})

const attendanceByDeptData = computed(() => {
  if (charts.value?.attendanceByDepartment?.length) return charts.value.attendanceByDepartment.map(p => ({ name: p.label, value: p.value }))
  return []
})

const revenueMonthlyData = computed(() => {
  if (charts.value?.revenueMonthly?.length) return charts.value.revenueMonthly.map(p => ({ name: p.label, value: p.value }))
  return [
    { name: 'Jan', value: 0 }, { name: 'Fev', value: 0 }, { name: 'Mar', value: 0 },
    { name: 'Avr', value: 0 }, { name: 'Mai', value: 0 }, { name: 'Jun', value: 0 },
  ]
})

const attendancePieData = computed(() => {
  if (!stats.value) return []
  return [
    { name: 'Presents', value: stats.value.presentToday },
    { name: 'Absents', value: stats.value.absentToday },
    { name: 'En retard', value: stats.value.lateToday },
  ].filter(d => d.value > 0)
})

const companiesByModuleData = computed(() => {
  if (charts.value?.companiesByModule?.length) return charts.value.companiesByModule.map(p => ({ name: p.label, value: p.value }))
  return []
})

function formatRevenue(v: number) {
  return v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000
    ? `${(v / 1_000).toFixed(0)}k`
    : `${v}`
}

onMounted(async () => {
  await Promise.all([dashboardStore.fetchStats(), dashboardStore.fetchCharts()])
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">{{ greeting }}, {{ authStore.user?.firstName ?? '' }}</h1>
      <p class="text-sm text-gray-500 mt-1">
        {{ isSuperAdmin ? 'Vue globale de la plateforme' : 'Vue d\'ensemble de votre entreprise' }}
      </p>
    </div>

    <!-- Loading -->
    <div v-if="dashboardStore.isLoading" class="flex items-center justify-center py-16">
      <AppSpinner size="lg" />
    </div>

    <template v-else-if="stats">

      <!-- ===== SUPER ADMIN KPIs ===== -->
      <template v-if="isSuperAdmin">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Entreprises actives"
            :value="val(stats.activeCompanies)"
            :icon="BuildingOffice2Icon"
            icon-bg-class="bg-blue-100"
            icon-color-class="text-blue-600"
          />
          <StatCard
            title="Employes total"
            :value="val(stats.totalEmployees)"
            :icon="UsersIcon"
            icon-bg-class="bg-green-100"
            icon-color-class="text-green-600"
          />
          <StatCard
            title="Equipements connectes"
            :value="val(stats.connectedDevices)"
            :icon="DevicePhoneMobileIcon"
            icon-bg-class="bg-purple-100"
            icon-color-class="text-purple-600"
          />
          <StatCard
            title="Alertes techniques"
            :value="val(stats.technicalAlerts)"
            :icon="ExclamationTriangleIcon"
            icon-bg-class="bg-red-100"
            icon-color-class="text-red-600"
          />
          <StatCard
            title="Satisfaction globale"
            :value="val(stats.globalSatisfactionRate)"
            :suffix="stats.globalSatisfactionRate != null ? '%' : ''"
            :icon="StarIcon"
            icon-bg-class="bg-yellow-100"
            icon-color-class="text-yellow-600"
          />
          <StatCard
            title="Cartes RFID vendues"
            :value="val(stats.rfidCardsSold)"
            :icon="CreditCardIcon"
            icon-bg-class="bg-indigo-100"
            icon-color-class="text-indigo-600"
          />
          <StatCard
            title="Revenus marketplace"
            :value="stats.marketplaceRevenue != null ? formatRevenue(stats.marketplaceRevenue) : '-'"
            :suffix="stats.marketplaceRevenue != null ? 'FCFA' : ''"
            :icon="BanknotesIcon"
            icon-bg-class="bg-emerald-100"
            icon-color-class="text-emerald-600"
          />
          <StatCard
            title="Commandes totales"
            :value="val(stats.totalOrders)"
            :icon="ShoppingCartIcon"
            icon-bg-class="bg-orange-100"
            icon-color-class="text-orange-600"
          />
        </div>

        <!-- Charts super admin -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AppCard>
            <template #header>
              <span class="text-sm font-semibold text-gray-700">Revenus marketplace (6 mois)</span>
            </template>
            <BarChart :data="revenueMonthlyData" color="#10b981" height="260px" series-name="Revenus (FCFA)" :loading="dashboardStore.chartsLoading" />
          </AppCard>

          <AppCard>
            <template #header>
              <span class="text-sm font-semibold text-gray-700">Entreprises par module</span>
            </template>
            <PieChart :data="companiesByModuleData.length ? companiesByModuleData : [{name:'Aucune donnee',value:1}]" height="260px" :loading="dashboardStore.chartsLoading" />
          </AppCard>

          <AppCard>
            <template #header>
              <span class="text-sm font-semibold text-gray-700">Tendance satisfaction (7 jours)</span>
            </template>
            <LineChart :data="satisfactionTrendData" color="#f59e0b" height="260px" series-name="Satisfaction (%)" :loading="dashboardStore.chartsLoading" />
          </AppCard>

          <AppCard>
            <template #header>
              <span class="text-sm font-semibold text-gray-700">Presences journalieres (7 jours)</span>
            </template>
            <LineChart :data="attendanceTrendData" color="#6366f1" height="260px" series-name="Employes presents" :loading="dashboardStore.chartsLoading" />
          </AppCard>
        </div>
      </template>

      <!-- ===== ADMIN ENTERPRISE / MANAGER KPIs ===== -->
      <template v-else>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Employes"
            :value="val(stats.totalEmployees)"
            :icon="UsersIcon"
            icon-bg-class="bg-blue-100"
            icon-color-class="text-blue-600"
          />
          <StatCard
            title="Presents aujourd'hui"
            :value="val(stats.presentToday)"
            :icon="CheckCircleIcon"
            icon-bg-class="bg-green-100"
            icon-color-class="text-green-600"
          />
          <StatCard
            title="En retard aujourd'hui"
            :value="val(stats.lateToday)"
            :icon="ClockIcon"
            icon-bg-class="bg-yellow-100"
            icon-color-class="text-yellow-600"
          />
          <StatCard
            title="Absents aujourd'hui"
            :value="val(stats.absentToday)"
            :icon="XCircleIcon"
            icon-bg-class="bg-red-100"
            icon-color-class="text-red-600"
          />
          <StatCard
            title="Taux de presence"
            :value="val(stats.attendanceRate)"
            :suffix="stats.attendanceRate != null ? '%' : ''"
            :icon="UserGroupIcon"
            icon-bg-class="bg-indigo-100"
            icon-color-class="text-indigo-600"
          />
          <StatCard
            title="Satisfaction"
            :value="val(stats.globalSatisfactionRate)"
            :suffix="stats.globalSatisfactionRate != null ? '%' : ''"
            :icon="StarIcon"
            icon-bg-class="bg-yellow-100"
            icon-color-class="text-yellow-600"
          />
          <StatCard
            title="Appareils connectes"
            :value="val(stats.connectedDevices)"
            :icon="DevicePhoneMobileIcon"
            icon-bg-class="bg-purple-100"
            icon-color-class="text-purple-600"
          />
          <StatCard
            title="Enrolements bio"
            :value="val(stats.biometricEnrolled)"
            :icon="FingerPrintIcon"
            icon-bg-class="bg-teal-100"
            icon-color-class="text-teal-600"
          />
        </div>

        <!-- Charts enterprise -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AppCard>
            <template #header>
              <span class="text-sm font-semibold text-gray-700">Presences journalieres (7 jours)</span>
            </template>
            <LineChart :data="attendanceTrendData" color="#6366f1" height="260px" series-name="Employes presents" :loading="dashboardStore.chartsLoading" />
          </AppCard>

          <AppCard>
            <template #header>
              <span class="text-sm font-semibold text-gray-700">Repartition presences du jour</span>
            </template>
            <PieChart
              :data="attendancePieData.length ? attendancePieData : [{name:'Aucune donnee',value:1}]"
              height="260px"
              :loading="dashboardStore.chartsLoading"
            />
          </AppCard>

          <AppCard>
            <template #header>
              <span class="text-sm font-semibold text-gray-700">Presences par departement</span>
            </template>
            <BarChart
              :data="attendanceByDeptData.length ? attendanceByDeptData : [{name:'Aucune donnee',value:0}]"
              color="#3b82f6"
              :horizontal="true"
              height="260px"
              series-name="Presents"
              :loading="dashboardStore.chartsLoading"
            />
          </AppCard>

          <AppCard>
            <template #header>
              <span class="text-sm font-semibold text-gray-700">Evolution satisfaction (7 jours)</span>
            </template>
            <LineChart :data="satisfactionTrendData" color="#f59e0b" height="260px" series-name="Satisfaction (%)" :loading="dashboardStore.chartsLoading" />
          </AppCard>
        </div>
      </template>

    </template>

    <!-- Empty State -->
    <div v-else class="text-center py-12 bg-white rounded-xl border border-gray-200">
      <p class="text-gray-500">Aucune donnee disponible</p>
    </div>
  </div>
</template>
