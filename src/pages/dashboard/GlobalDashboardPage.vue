<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
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

const { t } = useI18n()
const dashboardStore = useDashboardStore()
const permissions = usePermissions()
const authStore = useAuthStore()

const isSuperAdmin = permissions.isSuperAdmin
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return t('dashboard.greetingMorning')
  if (h < 18) return t('dashboard.greetingAfternoon')
  return t('dashboard.greetingEvening')
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
    { name: t('dashboard.days.mon'), value: 0 }, { name: t('dashboard.days.tue'), value: 0 }, { name: t('dashboard.days.wed'), value: 0 },
    { name: t('dashboard.days.thu'), value: 0 }, { name: t('dashboard.days.fri'), value: 0 }, { name: t('dashboard.days.sat'), value: 0 },
  ]
})

const satisfactionTrendData = computed(() => {
  if (charts.value?.satisfactionTrend?.length) return charts.value.satisfactionTrend.map(p => ({ name: p.label, value: p.value }))
  return [
    { name: t('dashboard.days.mon'), value: 0 }, { name: t('dashboard.days.tue'), value: 0 }, { name: t('dashboard.days.wed'), value: 0 },
    { name: t('dashboard.days.thu'), value: 0 }, { name: t('dashboard.days.fri'), value: 0 }, { name: t('dashboard.days.sat'), value: 0 },
  ]
})

const attendanceByDeptData = computed(() => {
  if (charts.value?.attendanceByDepartment?.length) return charts.value.attendanceByDepartment.map(p => ({ name: p.label, value: p.value }))
  return []
})

const revenueMonthlyData = computed(() => {
  if (charts.value?.revenueMonthly?.length) return charts.value.revenueMonthly.map(p => ({ name: p.label, value: p.value }))
  return [
    { name: t('dashboard.months.jan'), value: 0 }, { name: t('dashboard.months.feb'), value: 0 }, { name: t('dashboard.months.mar'), value: 0 },
    { name: t('dashboard.months.apr'), value: 0 }, { name: t('dashboard.months.may'), value: 0 }, { name: t('dashboard.months.jun'), value: 0 },
  ]
})

const attendancePieData = computed(() => {
  if (!stats.value) return []
  return [
    { name: t('dashboard.presentsPie'), value: stats.value.presentToday },
    { name: t('dashboard.absentsPie'), value: stats.value.absentToday },
    { name: t('dashboard.latePie'), value: stats.value.lateToday },
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
        {{ isSuperAdmin ? t('dashboard.globalView') : t('dashboard.companyView') }}
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
            :title="t('dashboard.activeCompanies')"
            :value="val(stats.activeCompanies)"
            :icon="BuildingOffice2Icon"
            icon-bg-class="bg-blue-100"
            icon-color-class="text-blue-600"
          />
          <StatCard
            :title="t('dashboard.employeesTotal')"
            :value="val(stats.totalEmployees)"
            :icon="UsersIcon"
            icon-bg-class="bg-green-100"
            icon-color-class="text-green-600"
          />
          <StatCard
            :title="t('dashboard.connectedDevices')"
            :value="val(stats.connectedDevices)"
            :icon="DevicePhoneMobileIcon"
            icon-bg-class="bg-purple-100"
            icon-color-class="text-purple-600"
          />
          <StatCard
            :title="t('dashboard.technicalAlerts')"
            :value="val(stats.technicalAlerts)"
            :icon="ExclamationTriangleIcon"
            icon-bg-class="bg-red-100"
            icon-color-class="text-red-600"
          />
          <StatCard
            :title="t('dashboard.globalSatisfaction')"
            :value="val(stats.globalSatisfactionRate)"
            :suffix="stats.globalSatisfactionRate != null ? '%' : ''"
            :icon="StarIcon"
            icon-bg-class="bg-yellow-100"
            icon-color-class="text-yellow-600"
          />
          <StatCard
            :title="t('dashboard.rfidCardsSold')"
            :value="val(stats.rfidCardsSold)"
            :icon="CreditCardIcon"
            icon-bg-class="bg-indigo-100"
            icon-color-class="text-indigo-600"
          />
          <StatCard
            :title="t('dashboard.marketplaceRevenue')"
            :value="stats.marketplaceRevenue != null ? formatRevenue(stats.marketplaceRevenue) : '-'"
            :suffix="stats.marketplaceRevenue != null ? 'FCFA' : ''"
            :icon="BanknotesIcon"
            icon-bg-class="bg-emerald-100"
            icon-color-class="text-emerald-600"
          />
          <StatCard
            :title="t('dashboard.totalOrders')"
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
              <span class="text-sm font-semibold text-gray-700">{{ t('dashboard.revenueChart') }}</span>
            </template>
            <BarChart :data="revenueMonthlyData" color="#10b981" height="260px" :series-name="t('dashboard.revenuesSeries')" :loading="dashboardStore.chartsLoading" />
          </AppCard>

          <AppCard>
            <template #header>
              <span class="text-sm font-semibold text-gray-700">{{ t('dashboard.companiesByModule') }}</span>
            </template>
            <PieChart :data="companiesByModuleData.length ? companiesByModuleData : [{name:t('common.noData'),value:1}]" height="260px" :loading="dashboardStore.chartsLoading" />
          </AppCard>

          <AppCard>
            <template #header>
              <span class="text-sm font-semibold text-gray-700">{{ t('dashboard.satisfactionTrend') }}</span>
            </template>
            <LineChart :data="satisfactionTrendData" color="#f59e0b" height="260px" :series-name="t('dashboard.satisfactionSeries')" :loading="dashboardStore.chartsLoading" />
          </AppCard>

          <AppCard>
            <template #header>
              <span class="text-sm font-semibold text-gray-700">{{ t('dashboard.attendanceTrend') }}</span>
            </template>
            <LineChart :data="attendanceTrendData" color="#6366f1" height="260px" :series-name="t('dashboard.presentSeries')" :loading="dashboardStore.chartsLoading" />
          </AppCard>
        </div>
      </template>

      <!-- ===== ADMIN ENTERPRISE / MANAGER KPIs ===== -->
      <template v-else>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            :title="t('dashboard.employees')"
            :value="val(stats.totalEmployees)"
            :icon="UsersIcon"
            icon-bg-class="bg-blue-100"
            icon-color-class="text-blue-600"
          />
          <StatCard
            :title="t('dashboard.presentTodayStat')"
            :value="val(stats.presentToday)"
            :icon="CheckCircleIcon"
            icon-bg-class="bg-green-100"
            icon-color-class="text-green-600"
          />
          <StatCard
            :title="t('dashboard.lateTodayStat')"
            :value="val(stats.lateToday)"
            :icon="ClockIcon"
            icon-bg-class="bg-yellow-100"
            icon-color-class="text-yellow-600"
          />
          <StatCard
            :title="t('dashboard.absentTodayStat')"
            :value="val(stats.absentToday)"
            :icon="XCircleIcon"
            icon-bg-class="bg-red-100"
            icon-color-class="text-red-600"
          />
          <StatCard
            :title="t('dashboard.attendanceRateStat')"
            :value="val(stats.attendanceRate)"
            :suffix="stats.attendanceRate != null ? '%' : ''"
            :icon="UserGroupIcon"
            icon-bg-class="bg-indigo-100"
            icon-color-class="text-indigo-600"
          />
          <StatCard
            :title="t('dashboard.satisfaction')"
            :value="val(stats.globalSatisfactionRate)"
            :suffix="stats.globalSatisfactionRate != null ? '%' : ''"
            :icon="StarIcon"
            icon-bg-class="bg-yellow-100"
            icon-color-class="text-yellow-600"
          />
          <StatCard
            :title="t('dashboard.connectedDevicesStat')"
            :value="val(stats.connectedDevices)"
            :icon="DevicePhoneMobileIcon"
            icon-bg-class="bg-purple-100"
            icon-color-class="text-purple-600"
          />
          <StatCard
            :title="t('dashboard.biometricEnrolled')"
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
              <span class="text-sm font-semibold text-gray-700">{{ t('dashboard.attendanceTrend') }}</span>
            </template>
            <LineChart :data="attendanceTrendData" color="#6366f1" height="260px" :series-name="t('dashboard.presentSeries')" :loading="dashboardStore.chartsLoading" />
          </AppCard>

          <AppCard>
            <template #header>
              <span class="text-sm font-semibold text-gray-700">{{ t('dashboard.attendancePie') }}</span>
            </template>
            <PieChart
              :data="attendancePieData.length ? attendancePieData : [{name:t('common.noData'),value:1}]"
              height="260px"
              :loading="dashboardStore.chartsLoading"
            />
          </AppCard>

          <AppCard>
            <template #header>
              <span class="text-sm font-semibold text-gray-700">{{ t('dashboard.attendanceByDept') }}</span>
            </template>
            <BarChart
              :data="attendanceByDeptData.length ? attendanceByDeptData : [{name:t('common.noData'),value:0}]"
              color="#3b82f6"
              :horizontal="true"
              height="260px"
              :series-name="t('dashboard.presentsPie')"
              :loading="dashboardStore.chartsLoading"
            />
          </AppCard>

          <AppCard>
            <template #header>
              <span class="text-sm font-semibold text-gray-700">{{ t('dashboard.satisfactionEvolution') }}</span>
            </template>
            <LineChart :data="satisfactionTrendData" color="#f59e0b" height="260px" :series-name="t('dashboard.satisfactionSeries')" :loading="dashboardStore.chartsLoading" />
          </AppCard>
        </div>
      </template>

    </template>

    <!-- Empty State -->
    <div v-else class="text-center py-12 bg-white rounded-xl border border-gray-200">
      <p class="text-gray-500">{{ t('dashboard.noData') }}</p>
    </div>
  </div>
</template>
