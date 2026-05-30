<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  followupApi,
  followupStatusLabel,
  followupTypeLabel,
  FOLLOWUP_RESULT_LABELS,
  type ClientFollowupCall,
} from '@/services/api/followup.api'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'

const router = useRouter()
const items = ref<ClientFollowupCall[]>([])
const loading = ref(true)
const filter = ref({ status: '', type: '' })
const currentPage = ref(1)
const totalPages = ref(1)
const perPage = ref(50)

const statusOptions = [
  { value: '', label: 'Tous statuts' },
  { value: 'pending', label: 'En attente' },
  { value: 'done', label: 'Fait' },
  { value: 'skipped', label: 'Passé' },
  { value: 'escalated', label: 'Escaladé' },
]
const typeOptions = [
  { value: '', label: 'Tous types' },
  { value: 'j2', label: 'J+2' },
  { value: 'j7', label: 'J+7' },
  { value: 'j30', label: 'J+30' },
]

async function load() {
  loading.value = true
  try {
    const r = await followupApi.list({
      status: filter.value.status || undefined,
      type: filter.value.type || undefined,
      page: currentPage.value,
    })
    items.value = r.data
    currentPage.value = r.meta.currentPage
    totalPages.value = r.meta.totalPages
    perPage.value = r.meta.perPage
  } finally {
    loading.value = false
  }
}

function reload() {
  currentPage.value = 1
  load()
}

function goToPage(page: number) {
  currentPage.value = page
  load()
}

onMounted(load)

function statusVariant(s: string) {
  return s === 'done' ? 'success' : (s === 'escalated' ? 'danger' : (s === 'skipped' ? 'neutral' : 'warning'))
}
function resultLabel(r: string | null | undefined) {
  if (!r) return '-'
  const icon: Record<string, string> = { ok: '✅', partial: '⚠️', problem: '🔴' }
  const label = FOLLOWUP_RESULT_LABELS[r as keyof typeof FOLLOWUP_RESULT_LABELS] ?? r
  return `${icon[r] ?? ''} ${label}`.trim()
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Routine clients - Appels J+2 / J+7 / J+30</h1>
      <button class="text-sm text-primary-600 underline" @click="router.push({ name: 'crm-followups-dashboard' })">Tableau de bord</button>
    </div>

    <AppCard>
      <div class="flex gap-3 mb-4">
        <AppSelect v-model="filter.status" :options="statusOptions" @update:model-value="reload" />
        <AppSelect v-model="filter.type" :options="typeOptions" @update:model-value="reload" />
      </div>

      <div v-if="loading" class="flex justify-center py-10">
        <AppSpinner size="lg" class="text-primary-600" />
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-3 py-2 text-left">Type</th>
              <th class="px-3 py-2 text-left">Client</th>
              <th class="px-3 py-2 text-left">Planifié</th>
              <th class="px-3 py-2 text-left">Statut</th>
              <th class="px-3 py-2 text-left">Résultat de l'appel</th>
              <th class="px-3 py-2 text-left">Satisfaction</th>
              <th class="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in items" :key="c.id" class="border-t">
              <td class="px-3 py-2 font-mono">{{ followupTypeLabel(c.call_type) }}</td>
              <td class="px-3 py-2">{{ c.company?.name }}</td>
              <td class="px-3 py-2">{{ new Date(c.scheduled_at).toLocaleDateString('fr-FR') }}</td>
              <td class="px-3 py-2"><AppBadge :variant="statusVariant(c.status)">{{ followupStatusLabel(c.status) }}</AppBadge></td>
              <td class="px-3 py-2">{{ resultLabel(c.result) }}</td>
              <td class="px-3 py-2">{{ c.satisfaction_score ? `${c.satisfaction_score}/10` : '-' }}</td>
              <td class="px-3 py-2 text-right">
                <button class="text-primary-600 text-sm underline" @click="router.push({ name: 'crm-followup-detail', params: { id: c.id } })">Ouvrir</button>
              </td>
            </tr>
            <tr v-if="!items.length"><td colspan="7" class="px-3 py-6 text-center text-gray-500">Aucun appel à afficher.</td></tr>
          </tbody>
        </table>
      </div>

      <AppPagination
        v-if="totalPages > 1"
        class="mt-4"
        :current-page="currentPage"
        :total-pages="totalPages"
        :per-page="perPage"
        @page-change="goToPage"
      />
    </AppCard>
  </div>
</template>
