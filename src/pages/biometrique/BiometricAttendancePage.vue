<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Pointage biométrique</h1>
        <p class="mt-1 text-sm text-gray-500">
          Historique des pointages capturés par les terminaux biométriques
        </p>
      </div>
      <div class="flex items-center gap-3">
        <input
          v-model="selectedDate"
          type="date"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          @change="fetchData"
        />
        <AppButton variant="secondary" size="sm" @click="fetchData">
          Actualiser
        </AppButton>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total pointages"
        :value="stats.totalEmployees"
        icon-bg-class="bg-blue-100"
        icon-color-class="text-blue-600"
      />
      <StatCard
        title="Présents"
        :value="stats.present"
        icon-bg-class="bg-green-100"
        icon-color-class="text-green-600"
      />
      <StatCard
        title="En retard"
        :value="stats.late"
        icon-bg-class="bg-orange-100"
        icon-color-class="text-orange-600"
      />
      <StatCard
        title="Double badge détecté"
        :value="stats.doubleBadgeCount"
        icon-bg-class="bg-red-100"
        icon-color-class="text-red-600"
      />
    </div>

    <!-- Tableau des pointages -->
    <AppCard title="Pointages du jour" :subtitle="formattedDate">
      <div v-if="loading" class="flex justify-center py-12">
        <AppSpinner />
      </div>

      <div v-else-if="records.length === 0" class="py-12 text-center text-sm text-gray-500">
        Aucun pointage biométrique pour cette date.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Employé
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Département
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Entrée
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Sortie
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Statut
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Retard
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Double badge
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Notes
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr
              v-for="record in records"
              :key="record.id"
              class="transition-colors hover:bg-gray-50"
              :class="{ 'bg-red-50': record.isDoubleBadge }"
            >
              <td class="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                {{ record.employeeName }}
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                {{ record.department }}
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                {{ record.entryTime ?? '—' }}
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                {{ record.exitTime ?? '—' }}
              </td>
              <td class="whitespace-nowrap px-4 py-4">
                <AppBadge :variant="statusVariant(record.status)" size="sm">
                  {{ statusLabel(record.status) }}
                </AppBadge>
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-sm">
                <span v-if="record.lateMinutes > 0" class="font-medium text-orange-600">
                  {{ record.lateMinutes }} min
                </span>
                <span v-else class="text-gray-400">—</span>
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-sm">
                <AppBadge v-if="record.isDoubleBadge" variant="danger" size="sm">
                  Oui ({{ record.ignoredBadges }} ignoré{{ record.ignoredBadges > 1 ? 's' : '' }})
                </AppBadge>
                <span v-else class="text-gray-400">—</span>
              </td>
              <td class="px-4 py-4 text-sm text-gray-500">
                {{ record.notes || '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAttendanceStore } from '@/stores/attendance.store'
import StatCard from '@/components/data-display/StatCard.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'

const attendanceStore = useAttendanceStore()

const selectedDate = ref(new Date().toISOString().split('T')[0])
const loading = ref(false)
const rawReport = ref<any>(null)

const formattedDate = computed(() =>
  new Date(selectedDate.value).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
)

const records = computed(() => rawReport.value?.records ?? [])

const stats = computed(() => ({
  totalEmployees: rawReport.value?.totalEmployees ?? 0,
  present: rawReport.value?.present ?? 0,
  late: rawReport.value?.late ?? 0,
  doubleBadgeCount: rawReport.value?.doubleBadgeCount ?? 0,
}))

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    present: 'Présent',
    absent: 'Absent',
    late: 'En retard',
    left_early: 'Départ anticipé',
  }
  return map[status] ?? status
}

function statusVariant(status: string): 'success' | 'danger' | 'warning' | 'default' {
  const map: Record<string, 'success' | 'danger' | 'warning' | 'default'> = {
    present: 'success',
    absent: 'danger',
    late: 'warning',
    left_early: 'warning',
  }
  return map[status] ?? 'default'
}

async function fetchData() {
  loading.value = true
  try {
    rawReport.value = await attendanceStore.fetchBiometricAttendance(selectedDate.value)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>
