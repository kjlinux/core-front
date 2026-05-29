<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  reportScheduleApi,
  type ReportSchedule,
  type ReportSchedulePayload,
  type ReportScheduleType,
  type ReportScheduleFormat,
  type ReportScheduleFrequency,
} from '@/services/api/report-schedule.api'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'

const { t } = useI18n()
const toast = useToast()

const schedules = ref<ReportSchedule[]>([])
const loading = ref(false)
const saving = ref(false)
const modalOpen = ref(false)
const editingId = ref<string | null>(null)

const confirmOpen = ref(false)
const deleteTarget = ref<string | null>(null)

const form = ref<{
  report_type: ReportScheduleType
  format: ReportScheduleFormat
  frequency: ReportScheduleFrequency
  recipientsText: string
  is_active: boolean
}>({
  report_type: 'attendance',
  format: 'pdf',
  frequency: 'monthly',
  recipientsText: '',
  is_active: true,
})

const typeOptions = computed(() => [
  { label: t('reportSchedule.typeAttendance'), value: 'attendance' },
  { label: t('reportSchedule.typeFeelback'), value: 'feelback' },
  { label: t('reportSchedule.typeSales'), value: 'sales' },
])

const formatOptions = [
  { label: 'PDF', value: 'pdf' },
  { label: 'CSV', value: 'csv' },
]

const frequencyOptions = computed(() => [
  { label: t('reportSchedule.daily'), value: 'daily' },
  { label: t('reportSchedule.weekly'), value: 'weekly' },
  { label: t('reportSchedule.monthly'), value: 'monthly' },
])

function typeLabel(v: string) {
  return typeOptions.value.find((o) => o.value === v)?.label ?? v
}
function frequencyLabel(v: string) {
  return frequencyOptions.value.find((o) => o.value === v)?.label ?? v
}
function formatDate(d: string | null) {
  return d ? new Date(d).toLocaleString('fr-FR') : '-'
}

async function load() {
  loading.value = true
  try {
    schedules.value = await reportScheduleApi.list()
  } catch {
    toast.showError(t('reportSchedule.loadError'))
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value = {
    report_type: 'attendance',
    format: 'pdf',
    frequency: 'monthly',
    recipientsText: '',
    is_active: true,
  }
  modalOpen.value = true
}

function openEdit(s: ReportSchedule) {
  editingId.value = s.id
  form.value = {
    report_type: s.report_type,
    format: s.format,
    frequency: s.frequency,
    recipientsText: s.recipients.join(', '),
    is_active: s.is_active,
  }
  modalOpen.value = true
}

function parseRecipients(text: string): string[] {
  return text
    .split(/[,;\n]/)
    .map((e) => e.trim())
    .filter(Boolean)
}

async function save() {
  const recipients = parseRecipients(form.value.recipientsText)
  if (recipients.length === 0) {
    toast.showError(t('reportSchedule.recipientsRequired'))
    return
  }

  const payload: ReportSchedulePayload = {
    report_type: form.value.report_type,
    format: form.value.format,
    frequency: form.value.frequency,
    recipients,
    is_active: form.value.is_active,
  }

  saving.value = true
  try {
    if (editingId.value) {
      await reportScheduleApi.update(editingId.value, payload)
      toast.showSuccess(t('reportSchedule.updated'))
    } else {
      await reportScheduleApi.create(payload)
      toast.showSuccess(t('reportSchedule.created'))
    }
    modalOpen.value = false
    await load()
  } catch {
    toast.showError(t('reportSchedule.saveError'))
  } finally {
    saving.value = false
  }
}

async function toggleActive(s: ReportSchedule) {
  try {
    await reportScheduleApi.update(s.id, { is_active: !s.is_active })
    await load()
  } catch {
    toast.showError(t('reportSchedule.saveError'))
  }
}

function askDelete(id: string) {
  deleteTarget.value = id
  confirmOpen.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  try {
    await reportScheduleApi.remove(deleteTarget.value)
    toast.showSuccess(t('reportSchedule.deleted'))
    await load()
  } catch {
    toast.showError(t('reportSchedule.saveError'))
  } finally {
    confirmOpen.value = false
    deleteTarget.value = null
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('reportSchedule.title') }}</h1>
        <p class="mt-1 text-sm text-gray-500">{{ t('reportSchedule.subtitle') }}</p>
      </div>
      <AppButton variant="primary" @click="openCreate">
        {{ t('reportSchedule.add') }}
      </AppButton>
    </div>

    <AppCard>
      <div v-if="loading" class="flex justify-center py-12">
        <AppSpinner />
      </div>

      <div v-else-if="schedules.length === 0" class="py-12 text-center text-sm text-gray-500">
        {{ t('reportSchedule.empty') }}
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{{ t('reportSchedule.colType') }}</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{{ t('reportSchedule.colFormat') }}</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{{ t('reportSchedule.colFrequency') }}</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{{ t('reportSchedule.colRecipients') }}</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{{ t('reportSchedule.colNextRun') }}</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{{ t('reportSchedule.colStatus') }}</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">{{ t('reportSchedule.colActions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr v-for="s in schedules" :key="s.id" class="hover:bg-gray-50">
              <td class="px-4 py-4 text-sm font-medium text-gray-900">{{ typeLabel(s.report_type) }}</td>
              <td class="px-4 py-4 text-sm uppercase text-gray-500">{{ s.format }}</td>
              <td class="px-4 py-4 text-sm text-gray-500">{{ frequencyLabel(s.frequency) }}</td>
              <td class="px-4 py-4 text-sm text-gray-500">{{ s.recipients.join(', ') }}</td>
              <td class="px-4 py-4 text-sm text-gray-500">{{ formatDate(s.next_run_at) }}</td>
              <td class="px-4 py-4">
                <AppBadge :variant="s.is_active ? 'success' : 'neutral'" size="sm">
                  {{ s.is_active ? t('reportSchedule.active') : t('reportSchedule.inactive') }}
                </AppBadge>
              </td>
              <td class="px-4 py-4 text-right">
                <div class="flex items-center justify-end gap-3">
                  <button class="text-sm text-primary hover:underline" @click="toggleActive(s)">
                    {{ s.is_active ? t('reportSchedule.pause') : t('reportSchedule.resume') }}
                  </button>
                  <button class="text-sm text-primary hover:underline" @click="openEdit(s)">
                    {{ t('common.edit') }}
                  </button>
                  <button class="text-sm text-red-600 hover:underline" @click="askDelete(s.id)">
                    {{ t('common.delete') }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>

    <AppModal v-model="modalOpen" :title="editingId ? t('reportSchedule.editTitle') : t('reportSchedule.add')">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('reportSchedule.colType') }}</label>
          <AppSelect v-model="form.report_type" :options="typeOptions" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('reportSchedule.colFormat') }}</label>
            <AppSelect v-model="form.format" :options="formatOptions" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('reportSchedule.colFrequency') }}</label>
            <AppSelect v-model="form.frequency" :options="frequencyOptions" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('reportSchedule.colRecipients') }}</label>
          <AppInput v-model="form.recipientsText" :placeholder="t('reportSchedule.recipientsPlaceholder')" />
          <p class="mt-1 text-xs text-gray-400">{{ t('reportSchedule.recipientsHint') }}</p>
        </div>
        <AppToggle v-model="form.is_active" :label="t('reportSchedule.activeToggle')" />
      </div>
      <template #footer>
        <AppButton variant="ghost" @click="modalOpen = false">{{ t('common.cancel') }}</AppButton>
        <AppButton variant="primary" :loading="saving" @click="save">{{ t('common.save') }}</AppButton>
      </template>
    </AppModal>

    <AppConfirmDialog
      :open="confirmOpen"
      :title="t('reportSchedule.deleteTitle')"
      :message="t('reportSchedule.deleteConfirm')"
      :confirm-label="t('common.delete')"
      variant="danger"
      @confirm="confirmDelete"
      @cancel="confirmOpen = false"
    />
  </div>
</template>
