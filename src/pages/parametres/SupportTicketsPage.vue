<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { supportTicketApi, type ClientTicket, type TicketPriority } from '@/services/api/support-ticket.api'
import { extractApiErrorMessage } from '@/utils/api-error'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'

const toast = useToast()
const { t } = useI18n()

const tickets = ref<ClientTicket[]>([])
const loading = ref(false)
const subject = ref('')
const message = ref('')
const priority = ref<TicketPriority>('medium')
const submitting = ref(false)

const priorityOptions = [
  { value: 'low', label: 'Basse' },
  { value: 'medium', label: 'Normale' },
  { value: 'high', label: 'Urgente' },
]

const statusLabel: Record<string, string> = {
  open: 'Ouverte',
  in_progress: 'En cours',
  resolved: 'Résolue',
}

const statusVariant: Record<string, 'warning' | 'info' | 'success'> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
}

async function load() {
  loading.value = true
  try {
    tickets.value = await supportTicketApi.listMine()
  } catch (e) {
    toast.error(t('toast.parametres.ticketsLoadError'), extractApiErrorMessage(e, t('common.genericError')))
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!subject.value.trim() || !message.value.trim()) {
    toast.error(t('toast.parametres.requiredFieldsTitle'), t('toast.parametres.requiredFieldsMsg'))
    return
  }
  if (subject.value.trim().length > 200) {
    toast.error(t('toast.parametres.subjectTooLongTitle'), t('toast.parametres.subjectTooLongMsg'))
    return
  }
  submitting.value = true
  try {
    await supportTicketApi.create({ subject: subject.value, message: message.value, priority: priority.value })
    toast.success(t('toast.parametres.complaintSentTitle'), t('toast.parametres.complaintSentMsg'))
    subject.value = ''
    message.value = ''
    priority.value = 'medium'
    await load()
  } catch (e) {
    toast.error(t('common.failed'), extractApiErrorMessage(e, t('common.genericError')))
  } finally {
    submitting.value = false
  }
}

function fmtDate(s: string | null) {
  return s ? new Date(s).toLocaleString('fr-FR') : '-'
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-gray-900">Support / Plaintes</h1>
      <p class="text-sm text-gray-500">Signalez un problème — le support IT vous rappellera et pourra intervenir à distance.</p>
    </div>

    <AppCard title="Nouvelle plainte">
      <div class="space-y-3">
        <AppInput v-model="subject" label="Sujet" placeholder="Capteur RFID en panne au site X" />
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            v-model="message"
            rows="4"
            maxlength="5000"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="Décrivez le problème observé, depuis quand, quels capteurs/sites sont concernés..."
          />
        </div>
        <AppSelect v-model="priority" label="Priorité" :options="priorityOptions" />
        <div class="flex justify-end">
          <AppButton variant="primary" :disabled="submitting" @click="submit">Envoyer</AppButton>
        </div>
      </div>
    </AppCard>

    <AppCard title="Mes plaintes">
      <div v-if="loading" class="py-4 text-sm text-gray-500">Chargement...</div>
      <div v-else-if="tickets.length === 0" class="py-4 text-sm text-gray-500">Aucune plainte enregistrée.</div>
      <div v-else class="divide-y divide-gray-100">
        <div v-for="t in tickets" :key="t.id" class="py-3">
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900">{{ t.subject }}</p>
              <p class="text-xs text-gray-500">Envoyée le {{ fmtDate(t.created_at) }}</p>
              <p class="text-sm text-gray-700 mt-1 whitespace-pre-line">{{ t.message }}</p>
              <div v-if="t.support_notes" class="mt-2 p-2 bg-blue-50 rounded text-sm text-gray-700">
                <strong class="text-blue-700">Réponse support :</strong> {{ t.support_notes }}
              </div>
            </div>
            <div class="flex flex-col gap-1 items-end">
              <AppBadge :variant="statusVariant[t.status]" size="sm">{{ statusLabel[t.status] }}</AppBadge>
              <AppBadge :variant="t.priority === 'high' ? 'danger' : 'neutral'" size="sm">{{ priorityOptions.find(p => p.value === t.priority)?.label }}</AppBadge>
            </div>
          </div>
        </div>
      </div>
    </AppCard>
  </div>
</template>
