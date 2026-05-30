<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { followupApi, type ClientFollowupCall } from '@/services/api/followup.api'
import { extractApiErrorMessage } from '@/utils/api-error'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import {
  PhoneIcon,
  ChartBarIcon,
  FaceSmileIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'

interface DashboardData {
  by_status: Record<string, number>
  missing_j2_overdue: number
  avg_usage_j7: number | null
  avg_satisfaction_j30: number | null
}

const toast = useToast()
const { t } = useI18n()
const data = ref<DashboardData | null>(null)
const overdue = ref<ClientFollowupCall[]>([])
const isLoading = ref(true)

async function load() {
  isLoading.value = true
  try {
    const [dash, list] = await Promise.all([
      followupApi.dashboard(),
      followupApi.list({ overdue: true }).then((r) => r.data ?? []).catch(() => []),
    ])
    data.value = dash
    overdue.value = list
  } catch (e) {
    toast.error(t('toast.crm.loadDashboardError'), extractApiErrorMessage(e, t('common.genericError')))
  } finally {
    isLoading.value = false
  }
}

onMounted(load)

const statusLabel: Record<string, string> = {
  pending: 'À traiter',
  done: 'Terminés',
  skipped: 'Ignorés',
  escalated: 'Escaladés',
}

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  pending: 'warning',
  done: 'success',
  skipped: 'neutral',
  escalated: 'danger',
}

const callTypeLabel: Record<string, string> = {
  j2: 'J+2',
  j7: 'J+7',
  j30: 'J+30',
}

const totalActions = computed(() => {
  if (!data.value) return 0
  return Object.values(data.value.by_status).reduce((a, b) => a + b, 0)
})

const completionRate = computed(() => {
  if (!data.value || !totalActions.value) return 0
  return Math.round(((data.value.by_status.done ?? 0) / totalActions.value) * 100)
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Routine clients</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Suivi automatique J+2 / J+7 / J+30 après installation
        </p>
      </div>
      <AppButton variant="ghost" size="sm" :disabled="isLoading" @click="load">
        Actualiser
      </AppButton>
    </div>

    <!-- KPI principaux -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AppCard>
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Appels J+2 en retard</p>
            <p v-if="!isLoading && data" class="mt-2 text-3xl font-bold text-red-600">{{ data.missing_j2_overdue }}</p>
            <AppSkeleton v-else width="3rem" height="2rem" class="mt-2" />
          </div>
          <ExclamationTriangleIcon class="h-8 w-8 text-red-500" />
        </div>
      </AppCard>
      <AppCard>
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Utilisation moyenne J+7</p>
            <p v-if="!isLoading && data" class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ data.avg_usage_j7 ?? '-' }}<span v-if="data.avg_usage_j7 != null" class="ml-1 text-base text-gray-500">%</span>
            </p>
            <AppSkeleton v-else width="4rem" height="2rem" class="mt-2" />
          </div>
          <ChartBarIcon class="h-8 w-8 text-blue-500" />
        </div>
      </AppCard>
      <AppCard>
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Satisfaction moyenne J+30</p>
            <p v-if="!isLoading && data" class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ data.avg_satisfaction_j30 ?? '-' }}<span v-if="data.avg_satisfaction_j30 != null" class="ml-1 text-base text-gray-500">/10</span>
            </p>
            <AppSkeleton v-else width="4rem" height="2rem" class="mt-2" />
          </div>
          <FaceSmileIcon class="h-8 w-8 text-green-500" />
        </div>
      </AppCard>
      <AppCard>
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Taux complétion</p>
            <p v-if="!isLoading" class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{{ completionRate }}%</p>
            <AppSkeleton v-else width="4rem" height="2rem" class="mt-2" />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ totalActions }} actions au total</p>
          </div>
          <PhoneIcon class="h-8 w-8 text-primary-700" />
        </div>
      </AppCard>
    </div>

    <!-- Distribution par statut -->
    <AppCard v-if="data && !isLoading">
      <h3 class="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Répartition des suivis</h3>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div
          v-for="(count, status) in data.by_status"
          :key="status"
          class="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
        >
          <p class="text-xs font-medium text-gray-600 dark:text-gray-300">{{ statusLabel[status] ?? status }}</p>
          <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{{ count }}</p>
        </div>
      </div>
    </AppCard>

    <!-- Suivis en retard -->
    <AppCard>
      <h3 class="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
        Suivis en retard <span class="ml-1 text-xs font-normal text-gray-400">({{ overdue.length }})</span>
      </h3>
      <div v-if="isLoading" class="space-y-2">
        <AppSkeleton v-for="i in 3" :key="i" height="2.5rem" />
      </div>
      <div v-else-if="overdue.length === 0" class="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Aucun suivi en retard. Bravo !
      </div>
      <ul v-else class="divide-y divide-gray-200 dark:divide-gray-700">
        <li
          v-for="f in overdue"
          :key="f.id"
          class="flex items-center justify-between py-3"
        >
          <div>
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ f.company?.name ?? 'Client inconnu' }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Programmé le {{ formatDate(f.scheduled_at) }}
              <span v-if="f.company?.phone" class="ml-2">- {{ f.company.phone }}</span>
            </p>
          </div>
          <AppBadge :variant="statusVariant[f.status] ?? 'neutral'" size="sm">
            {{ callTypeLabel[f.call_type] ?? f.call_type }}
          </AppBadge>
        </li>
      </ul>
    </AppCard>
  </div>
</template>
