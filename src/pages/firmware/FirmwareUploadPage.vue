<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useFirmwareStore } from '@/stores/firmware.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import type { DeviceKind } from '@/types'

const { t } = useI18n()
const store = useFirmwareStore()
const router = useRouter()
const toast = useToast()

const version = ref('')
const deviceKind = ref<DeviceKind>('rfid')
const description = ref('')
const isAutoUpdate = ref(false)
const file = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const errors = ref<Record<string, string>>({})

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  file.value = target.files?.[0] ?? null
  if (errors.value.file) delete errors.value.file
}

function validate(): boolean {
  errors.value = {}
  if (!version.value.trim()) errors.value.version = t('firmware.versionRequired')
  else if (!/^\d+\.\d+\.\d+$/.test(version.value.trim())) errors.value.version = t('firmware.versionFormat')
  if (!file.value) errors.value.file = t('firmware.fileBinRequired')
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return

  const formData = new FormData()
  formData.append('version', version.value.trim())
  formData.append('device_kind', deviceKind.value)
  formData.append('description', description.value.trim())
  formData.append('is_auto_update', isAutoUpdate.value ? '1' : '0')
  formData.append('file', file.value!)

  try {
    await store.uploadVersion(formData)
    toast.success(t('firmware.uploadedSuccess'))
    router.push({ name: 'firmware-versions' })
  } catch {
    toast.error(t('firmware.uploadError'))
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <AppButton variant="ghost" @click="router.push({ name: 'firmware-versions' })">
        &larr; {{ t('common.back') }}
      </AppButton>
      <h1 class="text-2xl font-bold text-gray-900">{{ t('firmware.uploadTitle') }}</h1>
    </div>

    <AppCard class="max-w-xl">
      <form class="space-y-5" @submit.prevent="handleSubmit">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">{{ t('firmware.versionLabel') }}</label>
          <input
            v-model="version"
            type="text"
            :placeholder="t('firmware.versionPlaceholder')"
            class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="errors.version ? 'border-red-500' : 'border-gray-300'"
          />
          <p v-if="errors.version" class="mt-1 text-xs text-red-600">{{ errors.version }}</p>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">{{ t('firmware.deviceKindLabel') }}</label>
          <select
            v-model="deviceKind"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="rfid">{{ t('firmware.deviceKinds.rfid') }}</option>
            <option value="biometric">{{ t('firmware.deviceKinds.biometric') }}</option>
          </select>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">{{ t('firmware.descriptionLabel') }}</label>
          <textarea
            v-model="description"
            rows="3"
            :placeholder="t('firmware.descriptionPlaceholder')"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">{{ t('firmware.fileLabel') }}</label>
          <div
            class="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-4 py-8 text-center hover:border-blue-400"
            @click="fileInput?.click()"
          >
            <p v-if="!file" class="text-sm text-gray-500">{{ t('firmware.filePrompt') }}</p>
            <p v-else class="text-sm font-medium text-blue-700">{{ file.name }} ({{ (file.size / 1024).toFixed(1) }} KB)</p>
            <input ref="fileInput" type="file" accept=".bin" class="hidden" @change="handleFileChange" />
          </div>
          <p v-if="errors.file" class="mt-1 text-xs text-red-600">{{ errors.file }}</p>
        </div>

        <div class="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
          <div>
            <p class="text-sm font-medium text-gray-700">{{ t('firmware.isAutoUpdate') }}</p>
            <p class="text-xs text-gray-500">{{ t('firmware.autoUpdateLabel') }}</p>
          </div>
          <AppToggle v-model="isAutoUpdate" />
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <AppButton variant="ghost" type="button" @click="router.push({ name: 'firmware-versions' })">
            {{ t('common.cancel') }}
          </AppButton>
          <AppButton variant="primary" type="submit" :disabled="store.isLoading">
            {{ store.isLoading ? t('firmware.uploading') : t('firmware.uploadButton') }}
          </AppButton>
        </div>
      </form>
    </AppCard>
  </div>
</template>
