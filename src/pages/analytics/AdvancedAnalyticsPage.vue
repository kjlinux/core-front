<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { usePlan } from '@/composables/usePlan'
import { analyticsApi, type AdvancedAnalytics } from '@/services/api/analytics.api'
import FeatureLock from '@/components/ui/FeatureLock.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import StatCard from '@/components/data-display/StatCard.vue'
import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import { ChartBarIcon, ClockIcon } from '@heroicons/vue/24/outline'

const { hasFeature } = usePlan()

const data = ref<AdvancedAnalytics | null>(null)
const isLoading = ref(false)

const presenceParMois = computed(() =>
  (data.value?.monthlyAttendance ?? []).map((p) => ({ name: p.label, value: p.present })),
)
const retardsParMois = computed(() =>
  (data.value?.monthlyAttendance ?? []).map((p) => ({ name: p.label, value: p.late })),
)
const satisfactionParMois = computed(() =>
  (data.value?.satisfactionByMonth ?? []).map((p) => ({ name: p.label, value: p.satisfactionRate })),
)
const presenceParDept = computed(() =>
  (data.value?.attendanceByDepartment ?? []).map((p) => ({ name: p.label, value: p.present })),
)
const presenceParSite = computed(() =>
  (data.value?.attendanceBySite ?? []).map((p) => ({ name: p.label, value: p.present })),
)
const effectif = computed(() =>
  (data.value?.headcountEvolution ?? []).map((p) => ({ name: p.label, value: p.headcount })),
)

async function load() {
  isLoading.value = true
  try {
    data.value = await analyticsApi.advanced()
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  // N'appelle l'API que si le plan inclut la feature (sinon 403). super_admin = true.
  if (hasFeature('advanced_analytics')) {
    load()
  }
})
</script>

<template>
  <FeatureLock feature="advanced_analytics">
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Analytics avancés</h1>
        <p class="text-sm text-gray-500 mt-1">
          Tendances de présence, ponctualité et satisfaction sur les derniers mois.
        </p>
      </div>

      <div v-if="isLoading" class="flex items-center justify-center py-16">
        <AppSpinner size="lg" />
      </div>

      <template v-else-if="data">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Taux de ponctualité"
            :value="data.punctuality.punctualityRate"
            suffix="%"
            :icon="ClockIcon"
            icon-bg-class="bg-indigo-100"
            icon-color-class="text-indigo-600"
          />
          <StatCard
            title="Présences (période)"
            :value="data.punctuality.present"
            :icon="ChartBarIcon"
            icon-bg-class="bg-green-100"
            icon-color-class="text-green-600"
          />
          <StatCard
            title="Retards (période)"
            :value="data.punctuality.late"
            :icon="ClockIcon"
            icon-bg-class="bg-yellow-100"
            icon-color-class="text-yellow-600"
          />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AppCard>
            <template #header>
              <span class="text-sm font-semibold text-gray-700">Présences par mois</span>
            </template>
            <LineChart :data="presenceParMois" color="#6366f1" height="260px" series-name="Présences" />
          </AppCard>

          <AppCard>
            <template #header>
              <span class="text-sm font-semibold text-gray-700">Retards par mois</span>
            </template>
            <LineChart :data="retardsParMois" color="#f59e0b" height="260px" series-name="Retards" />
          </AppCard>

          <AppCard>
            <template #header>
              <span class="text-sm font-semibold text-gray-700">Satisfaction par mois</span>
            </template>
            <LineChart :data="satisfactionParMois" color="#10b981" height="260px" series-name="Satisfaction (%)" />
          </AppCard>

          <AppCard>
            <template #header>
              <span class="text-sm font-semibold text-gray-700">Évolution de l'effectif</span>
            </template>
            <LineChart :data="effectif" color="#3b82f6" height="260px" series-name="Effectif" />
          </AppCard>

          <AppCard>
            <template #header>
              <span class="text-sm font-semibold text-gray-700">Présences par département</span>
            </template>
            <BarChart
              :data="presenceParDept.length ? presenceParDept : [{ name: 'Aucune donnée', value: 0 }]"
              color="#3b82f6"
              :horizontal="true"
              height="260px"
              series-name="Présences"
            />
          </AppCard>

          <AppCard>
            <template #header>
              <span class="text-sm font-semibold text-gray-700">Présences par site</span>
            </template>
            <BarChart
              :data="presenceParSite.length ? presenceParSite : [{ name: 'Aucune donnée', value: 0 }]"
              color="#8b5cf6"
              :horizontal="true"
              height="260px"
              series-name="Présences"
            />
          </AppCard>
        </div>
      </template>

      <div v-else class="text-center py-12 bg-white rounded-xl border border-gray-200">
        <p class="text-gray-500">Aucune donnée disponible.</p>
      </div>
    </div>
  </FeatureLock>
</template>
