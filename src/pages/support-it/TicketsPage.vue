<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supportTicketApi, type SupportTicket, type TicketStatus, type TicketPriority } from '@/services/api/support-ticket.api'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { PhoneIcon, EnvelopeIcon, BuildingOffice2Icon, WrenchScrewdriverIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const toast = useToast()

const tickets = ref<SupportTicket[]>([])
const loading = ref(false)
const filterStatus = ref<TicketStatus | ''>('open')
const filterPriority = ref<TicketPriority | ''>('')

const statusOptions = [
  { value: '', label: 'Tous statuts' },
  { value: 'open', label: 'Ouvertes' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'resolved', label: 'Résolues' },
]
const priorityOptions = [
  { value: '', label: 'Toutes priorités' },
  { value: 'high', label: 'Urgente' },
  { value: 'medium', label: 'Normale' },
  { value: 'low', label: 'Basse' },
]

const statusLabel: Record<string, string> = { open: 'Ouverte', in_progress: 'En cours', resolved: 'Résolue' }
const statusVariant: Record<string, 'warning' | 'info' | 'success'> = { open: 'warning', in_progress: 'info', resolved: 'success' }
const priorityLabel: Record<string, string> = { low: 'Basse', medium: 'Normale', high: 'Urgente' }

// Tri urgent en premier
const sorted = computed(() =>
  [...tickets.value].sort((a, b) => {
    const rank: Record<string, number> = { high: 3, medium: 2, low: 1 }
    return (rank[b.priority] ?? 0) - (rank[a.priority] ?? 0)
  }),
)

const selected = ref<SupportTicket | null>(null)
const editStatus = ref<TicketStatus>('open')
const editNotes = ref('')
const saving = ref(false)

async function load() {
  loading.value = true
  try {
    tickets.value = await supportTicketApi.listAll({
      status: filterStatus.value || undefined,
      priority: filterPriority.value || undefined,
    })
  } catch (e) {
    toast.error('Erreur de chargement', String((e as Error).message))
  } finally {
    loading.value = false
  }
}

function openDetail(t: SupportTicket) {
  selected.value = t
  editStatus.value = t.status
  editNotes.value = t.supportNotes ?? ''
}

async function save() {
  if (!selected.value) return
  saving.value = true
  try {
    await supportTicketApi.update(selected.value.id, {
      status: editStatus.value,
      support_notes: editNotes.value,
    })
    toast.success('Ticket mis à jour')
    selected.value = null
    await load()
  } catch (e) {
    toast.error('Échec', String((e as Error).message))
  } finally {
    saving.value = false
  }
}

function fmtDate(s: string | null) {
  return s ? new Date(s).toLocaleString('fr-FR') : '-'
}

function goCompany() {
  if (selected.value?.company) {
    router.push(`/support-it/companies/${selected.value.company.id}`)
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-gray-900">Plaintes clients</h1>
      <p class="text-sm text-gray-500">Plaintes envoyées par les compagnies — rappeler, agir à distance, marquer résolu.</p>
    </div>

    <AppCard>
      <div class="flex gap-3 flex-wrap mb-4">
        <AppSelect v-model="filterStatus" :options="statusOptions" @update:model-value="load" />
        <AppSelect v-model="filterPriority" :options="priorityOptions" @update:model-value="load" />
      </div>
      <div v-if="loading" class="py-4 text-sm text-gray-500">Chargement...</div>
      <div v-else-if="sorted.length === 0" class="py-4 text-sm text-gray-500">Aucune plainte.</div>
      <div v-else class="divide-y divide-gray-100">
        <div v-for="t in sorted" :key="t.id" class="py-3 hover:bg-gray-50 cursor-pointer px-2 rounded" @click="openDetail(t)">
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <AppBadge :variant="t.priority === 'high' ? 'danger' : t.priority === 'medium' ? 'warning' : 'neutral'" size="sm">{{ priorityLabel[t.priority] }}</AppBadge>
                <p class="text-sm font-medium text-gray-900 truncate">{{ t.subject }}</p>
              </div>
              <p class="text-xs text-gray-500 mt-0.5">
                <BuildingOffice2Icon class="w-3 h-3 inline" />
                {{ t.company?.name ?? '-' }} · {{ t.createdBy?.name ?? '-' }} · {{ fmtDate(t.createdAt) }}
              </p>
              <p class="text-sm text-gray-700 mt-1 line-clamp-2">{{ t.message }}</p>
            </div>
            <AppBadge :variant="statusVariant[t.status]" size="sm">{{ statusLabel[t.status] }}</AppBadge>
          </div>
        </div>
      </div>
    </AppCard>

    <AppModal :model-value="selected !== null" :title="selected?.subject ?? ''" @update:model-value="selected = null">
      <div v-if="selected" class="space-y-4">
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p class="text-gray-500 text-xs">Compagnie</p>
            <p class="font-medium">{{ selected.company?.name ?? '-' }}</p>
          </div>
          <div>
            <p class="text-gray-500 text-xs">Émetteur</p>
            <p class="font-medium">{{ selected.createdBy?.name ?? '-' }}</p>
          </div>
        </div>

        <div class="flex gap-2 flex-wrap">
          <a v-if="selected.company?.phone" :href="`tel:${selected.company.phone}`">
            <AppButton variant="outline" size="sm"><PhoneIcon class="w-4 h-4" /> {{ selected.company.phone }}</AppButton>
          </a>
          <a v-if="selected.createdBy?.phone" :href="`tel:${selected.createdBy.phone}`">
            <AppButton variant="outline" size="sm"><PhoneIcon class="w-4 h-4" /> Émetteur</AppButton>
          </a>
          <a v-if="selected.createdBy?.email" :href="`mailto:${selected.createdBy.email}`">
            <AppButton variant="outline" size="sm"><EnvelopeIcon class="w-4 h-4" /> Email</AppButton>
          </a>
          <AppButton v-if="selected.company" variant="outline" size="sm" @click="goCompany">
            <WrenchScrewdriverIcon class="w-4 h-4" /> Agir sur la compagnie
          </AppButton>
        </div>

        <div>
          <p class="text-gray-500 text-xs mb-1">Description du client</p>
          <p class="text-sm text-gray-700 whitespace-pre-line bg-gray-50 rounded p-3">{{ selected.message }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes / réponse au client</label>
          <textarea
            v-model="editNotes"
            rows="4"
            maxlength="5000"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="Diagnostic, action menée, prochaine étape..."
          />
        </div>

        <div class="flex items-end justify-between gap-3">
          <AppSelect v-model="editStatus" label="Statut" :options="[
            { value: 'open', label: 'Ouverte' },
            { value: 'in_progress', label: 'En cours' },
            { value: 'resolved', label: 'Résolue' },
          ]" />
          <AppButton variant="primary" :disabled="saving" @click="save">Enregistrer</AppButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>
