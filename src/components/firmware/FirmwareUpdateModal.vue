<template>
  <AppModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    size="lg"
    :title="existingVersion ? 'Modifier le firmware' : 'Ajouter un firmware'"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Version <span class="text-red-500">*</span>
        </label>
        <AppInput v-model="form.version" placeholder="ex: 2.0.4" required />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Type d'appareil <span class="text-red-500">*</span>
        </label>
        <AppSelect v-model="form.deviceKind" :options="deviceKindOptions" required />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          v-model="form.description"
          rows="3"
          class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Notes de version, corrections, ameliorations..."
        ></textarea>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Fichier firmware (.bin) <span class="text-red-500">*</span>
        </label>
        <input
          type="file"
          accept=".bin"
          @change="handleFileChange"
          class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
        />
      </div>

      <div class="flex items-center gap-2">
        <AppToggle v-model="form.isAutoUpdate" />
        <span class="text-sm text-gray-700 dark:text-gray-300">Activer la mise à jour automatique</span>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <AppButton variant="secondary" @click="$emit('update:modelValue', false)">Annuler</AppButton>
        <AppButton variant="primary" :loading="loading" @click="handleSubmit">
          {{ existingVersion ? 'Mettre à jour' : 'Ajouter' }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'
import { useFirmwareStore } from '@/stores/firmware.store'
import { extractApiErrorMessage } from '@/utils/api-error'
import type { FirmwareVersion } from '@/types'

const props = defineProps<{
  modelValue: boolean
  existingVersion?: FirmwareVersion
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const toast = useToast()
const { t } = useI18n()
const firmwareStore = useFirmwareStore()

const loading = ref(false)

const deviceKindOptions = [
  { value: 'rfid', label: 'RFID' },
  { value: 'biometric', label: 'Biométrique' },
]

const form = reactive({
  version: '',
  deviceKind: 'rfid' as 'rfid' | 'biometric',
  description: '',
  isAutoUpdate: false,
  file: null as File | null,
})

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      form.version = props.existingVersion?.version || ''
      form.deviceKind = props.existingVersion?.deviceKind || 'rfid'
      form.description = props.existingVersion?.description || ''
      form.isAutoUpdate = props.existingVersion?.isAutoUpdate || false
      form.file = null
    }
  }
)

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const selected = target.files?.[0]
  if (selected) {
    form.file = selected
  }
}

const handleSubmit = async () => {
  if (!form.version || !form.deviceKind) {
    toast.showError(t('toast.firmware.fillRequired'))
    return
  }

  const trimmedVersion = form.version.trim()
  if (trimmedVersion.length > 20 || !/^[vV]?\d+(\.\d+){0,3}([-.][0-9A-Za-z]+)*$/.test(trimmedVersion)) {
    toast.showError(t('toast.firmware.versionFormat'))
    return
  }

  if (!props.existingVersion && !form.file) {
    toast.showError(t('toast.firmware.selectFile'))
    return
  }

  loading.value = true
  try {
    const formData = new FormData()
    formData.append('version', form.version)
    formData.append('device_kind', form.deviceKind)
    formData.append('description', form.description)
    formData.append('is_auto_update', form.isAutoUpdate ? '1' : '0')
    if (form.file) {
      formData.append('file', form.file)
    }

    await firmwareStore.uploadVersion(formData)
    toast.showSuccess(t('toast.firmware.addedSuccess'))
    emit('saved')
    emit('update:modelValue', false)
  } catch (error: unknown) {
    toast.showError(extractApiErrorMessage(error, t('toast.firmware.uploadError')))
    return
  } finally {
    loading.value = false
  }
}
</script>
