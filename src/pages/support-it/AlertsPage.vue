<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useSupportStore } from '@/stores/support.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import { CheckIcon, EyeIcon } from '@heroicons/vue/24/outline'
import type { AlertSeverity, AlertStatus } from '@/types'

const store = useSupportStore()
const toast = useToast()

const filter = ref<{ status?: AlertStatus | ''; severity?: AlertSeverity | '' }>({
  status: 'open',
  severity: '',
})

const statusOptions = [
  { value: '', label: 'Tous statuts' },
  { value: 'open', label: 'Ouvertes' },
  { value: 'acknowledged', label: 'Reconnues' },
  { value: 'resolved', label: 'Resolues' },
]
const severityOptions = [
  { value: '', label: 'Toutes severites' },
  { value: 'critical', label: 'Critique' },
  { value: 'high', label: 'Haute' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'low', label: 'Faible' },
]

async function load() {
  await store.fetchAlerts({
    status: (filter.value.status || undefined) as AlertStatus | undefined,
    severity: (filter.value.severity || undefined) as AlertSeverity | undefined,
    per_page: 50,
  })
}

watch(filter, load, { deep: true })

async function ack(id: string) {
  try {
    await store.acknowledgeAlert(id)
    toast.success('Alerte reconnue')
  } catch (e) {
    toast.error('Echec', String((e as Error).message))
  }
}
async function resolve(id: string) {
  try {
    await store.resolveAlert(id)
    toast.success('Alerte resolue')
  } catch (e) {
    toast.error('Echec', String((e as Error).message))
  }
}

function severityVariant(s: string) {
  if (s === 'critical' || s === 'high') return 'danger'
  if (s === 'medium') return 'warning'
  return 'info'
}
function statusVariant(s: string) {
  if (s === 'resolved') return 'success'
  if (s === 'acknowledged') return 'warning'
  return 'danger'
}

function fmtDate(s: string) {
  return new Date(s).toLocaleString('fr-FR')
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-gray-900">Alertes</h1>
      <p class="text-sm text-gray-500">Detectees automatiquement par le systeme</p>
    </div>

    <AppCard padding="sm">
      <div class="flex flex-wrap gap-3 items-end">
        <AppSelect v-model="filter.status" :options="statusOptions" label="Statut" />
        <AppSelect v-model="filter.severity" :options="severityOptions" label="Severite" />
        <div class="ml-auto text-sm text-gray-500">{{ store.alertsTotal }} resultat(s)</div>
      </div>
    </AppCard>

    <AppCard padding="none">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alerte</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severite</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detecte</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-100">
            <tr v-for="a in store.alerts" :key="a.id" class="hover:bg-gray-50">
              <td class="px-4 py-3">
                <div class="font-medium text-gray-900">{{ a.title }}</div>
                <div class="text-xs text-gray-500">{{ a.message }}</div>
              </td>
              <td class="px-4 py-3"><AppBadge :variant="severityVariant(a.severity)" size="sm">{{ a.severity }}</AppBadge></td>
              <td class="px-4 py-3 text-xs text-gray-500">{{ a.device_kind }} · {{ a.type }}</td>
              <td class="px-4 py-3"><AppBadge :variant="statusVariant(a.status)" size="sm">{{ a.status }}</AppBadge></td>
              <td class="px-4 py-3 text-sm text-gray-700">{{ fmtDate(a.created_at) }}</td>
              <td class="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                <AppButton v-if="a.status === 'open'" size="sm" variant="outline" @click="ack(a.id)">
                  <EyeIcon class="w-4 h-4" /> Reconnaitre
                </AppButton>
                <AppButton v-if="a.status !== 'resolved'" size="sm" variant="success" @click="resolve(a.id)">
                  <CheckIcon class="w-4 h-4" /> Resoudre
                </AppButton>
              </td>
            </tr>
            <tr v-if="store.alerts.length === 0">
              <td colspan="6" class="px-4 py-8 text-center text-sm text-gray-500">Aucune alerte</td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>
  </div>
</template>
