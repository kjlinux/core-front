<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { followupApi, type ClientFollowupCall } from '@/services/api/followup.api'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSelect from '@/components/ui/AppSelect.vue'

const router = useRouter()
const items = ref<ClientFollowupCall[]>([])
const filter = ref({ status: '', type: '' })

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
  const r = await followupApi.list({ status: filter.value.status || undefined, type: filter.value.type || undefined })
  items.value = r.data
}
onMounted(load)

function statusVariant(s: string) {
  return s === 'done' ? 'success' : (s === 'escalated' ? 'danger' : (s === 'skipped' ? 'neutral' : 'warning'))
}
function resultLabel(r: string | null) {
  if (!r) return ''
  return { ok: '✅ OK', partial: '⚠ Partiel', problem: '⬤ Problème' }[r] ?? r
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Routine clients — Appels J+2 / J+7 / J+30</h1>
      <button class="text-sm text-primary-600 underline" @click="router.push({ name: 'crm-followups-dashboard' })">Tableau de bord</button>
    </div>

    <AppCard>
      <div class="flex gap-3 mb-4">
        <AppSelect v-model="filter.status" :options="statusOptions" @update:model-value="load" />
        <AppSelect v-model="filter.type" :options="typeOptions" @update:model-value="load" />
      </div>

      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-3 py-2 text-left">Type</th>
            <th class="px-3 py-2 text-left">Client</th>
            <th class="px-3 py-2 text-left">Planifié</th>
            <th class="px-3 py-2 text-left">Statut</th>
            <th class="px-3 py-2 text-left">Résultat</th>
            <th class="px-3 py-2 text-left">Note</th>
            <th class="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in items" :key="c.id" class="border-t">
            <td class="px-3 py-2 font-mono">{{ c.call_type.toUpperCase() }}</td>
            <td class="px-3 py-2">{{ c.company?.name }}</td>
            <td class="px-3 py-2">{{ new Date(c.scheduled_at).toLocaleDateString('fr-FR') }}</td>
            <td class="px-3 py-2"><AppBadge :variant="statusVariant(c.status)">{{ c.status }}</AppBadge></td>
            <td class="px-3 py-2">{{ resultLabel(c.result) }}</td>
            <td class="px-3 py-2">{{ c.satisfaction_score ? `${c.satisfaction_score}/10` : '—' }}</td>
            <td class="px-3 py-2 text-right">
              <button class="text-primary-600 text-sm underline" @click="router.push({ name: 'crm-followup-detail', params: { id: c.id } })">Ouvrir</button>
            </td>
          </tr>
          <tr v-if="!items.length"><td colspan="7" class="px-3 py-6 text-center text-gray-500">Aucun appel à afficher.</td></tr>
        </tbody>
      </table>
    </AppCard>
  </div>
</template>
