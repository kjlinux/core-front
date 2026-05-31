<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supportTicketApi, type SupportTicket, type TicketStatus, type TicketPriority } from '@/services/api/support-ticket.api'
import { supportApi } from '@/services/api/support.api'
import { useAuthStore } from '@/stores/auth.store'
import type { PaginatedResponse } from '@/types'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'
import { useServerTable } from '@/composables/useServerTable'
import { extractApiErrorMessage } from '@/utils/api-error'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppModal from '@/components/ui/AppModal.vue'
import DataTable from '@/components/data-display/DataTable.vue'
import type { TableColumn } from '@/types/common'
import { PhoneIcon, EnvelopeIcon, BuildingOffice2Icon, WrenchScrewdriverIcon, ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'
import {
  ticketStatusLabel,
  ticketStatusVariant,
  ticketPriorityLabel,
  ticketPriorityVariant,
  labelOf,
  variantOf,
} from '@/utils/support-labels'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const { t } = useI18n()

const tickets = ref<SupportTicket[]>([])
const pagination = ref<PaginatedResponse<SupportTicket>['meta'] | null>(null)
const loading = ref(false)

const { filters, search, applyFilters, handlePageChange, reload } = useServerTable({
  initialFilters: {
    status: 'open' as TicketStatus | '',
    priority: '' as TicketPriority | '',
  },
  fetcher: async (p) => {
    loading.value = true
    try {
      const r = await supportTicketApi.listAll({
        page: p.page,
        perPage: p.perPage,
        search: p.search || undefined,
        status: (p.status || undefined) as TicketStatus | undefined,
        priority: (p.priority || undefined) as TicketPriority | undefined,
      })
      tickets.value = r.data
      pagination.value = r.meta
    } catch (e) {
      toast.error(t('toast.support.loadError'), extractApiErrorMessage(e, t('common.genericError')))
    } finally {
      loading.value = false
    }
  },
})

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

const columns: TableColumn[] = [
  { key: 'priority', label: 'Priorité', sortable: false },
  { key: 'subject', label: 'Sujet', sortable: false },
  { key: 'company', label: 'Compagnie', sortable: false },
  { key: 'status', label: 'Statut', sortable: false },
  { key: 'createdAt', label: 'Créé le', sortable: false },
]

const selected = ref<SupportTicket | null>(null)
const editStatus = ref<TicketStatus>('open')
const editNotes = ref('')
const saving = ref(false)
const takingControl = ref(false)

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
    toast.success(t('toast.support.ticketUpdated'))
    selected.value = null
    await reload()
  } catch (e) {
    toast.error(t('common.failed'), extractApiErrorMessage(e, t('common.genericError')))
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

async function takeControl() {
  if (!selected.value?.company) return
  takingControl.value = true
  try {
    const res = await supportApi.impersonateCompany(selected.value.company.id)
    authStore.startImpersonation(res, router.currentRoute.value.fullPath)
    toast.success('Prise de contrôle activée')
    selected.value = null
    router.push('/')
  } catch (e) {
    toast.error(t('common.failed'), extractApiErrorMessage(e, t('common.genericError')))
  } finally {
    takingControl.value = false
  }
}

onMounted(reload)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-gray-900">Plaintes clients</h1>
      <p class="text-sm text-gray-500">Plaintes envoyées par les compagnies. Rappeler, agir à distance, marquer résolu.</p>
    </div>

    <AppCard>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AppInput v-model="search" :placeholder="t('common.search') || 'Rechercher...'" :label="t('common.search') || 'Rechercher'" />
        <AppSelect v-model="filters.status" :options="statusOptions" label="Statut" @update:model-value="applyFilters" />
        <AppSelect v-model="filters.priority" :options="priorityOptions" label="Priorité" @update:model-value="applyFilters" />
      </div>
    </AppCard>

    <AppCard padding="none">
      <DataTable
        :columns="columns"
        :data="tickets"
        :loading="loading"
        :pagination="pagination ?? undefined"
        empty-message="Aucune plainte."
        @row-click="openDetail"
        @page-change="handlePageChange"
      >
        <template #priority="{ row }">
          <AppBadge :variant="variantOf(ticketPriorityVariant, row.priority)" size="sm">{{ labelOf(ticketPriorityLabel, row.priority) }}</AppBadge>
        </template>
        <template #subject="{ row }">
          <div class="font-medium text-gray-900">{{ row.subject }}</div>
          <div class="text-xs text-gray-500 line-clamp-1">{{ row.message }}</div>
        </template>
        <template #company="{ row }">
          <div class="text-sm text-gray-700">
            <BuildingOffice2Icon class="w-3 h-3 inline" /> {{ row.company?.name ?? '-' }}
          </div>
          <div class="text-xs text-gray-500">{{ row.createdBy?.name ?? '-' }}</div>
        </template>
        <template #status="{ row }">
          <AppBadge :variant="variantOf(ticketStatusVariant, row.status)" size="sm">{{ labelOf(ticketStatusLabel, row.status) }}</AppBadge>
        </template>
        <template #createdAt="{ row }">
          <span class="text-sm text-gray-700">{{ fmtDate(row.createdAt) }}</span>
        </template>
      </DataTable>
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
            <WrenchScrewdriverIcon class="w-4 h-4" /> Fiche entreprise
          </AppButton>
          <AppButton v-if="selected.company" variant="primary" size="sm" :disabled="takingControl" @click="takeControl">
            <ArrowRightOnRectangleIcon class="w-4 h-4" /> Prendre le contrôle de l'entreprise
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
