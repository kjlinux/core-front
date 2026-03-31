<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFirmwareStore } from '@/stores/firmware.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import type { DeviceKind } from '@/types'

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
  if (!version.value.trim()) errors.value.version = 'La version est requise'
  else if (!/^\d+\.\d+\.\d+$/.test(version.value.trim())) errors.value.version = 'Format attendu : x.y.z (ex: 1.2.0)'
  if (!file.value) errors.value.file = 'Veuillez selectionner un fichier .bin'
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
    toast.success('Firmware telecharge avec succes')
    router.push({ name: 'firmware-versions' })
  } catch {
    toast.error('Erreur lors du telechargement')
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <AppButton variant="ghost" @click="router.push({ name: 'firmware-versions' })">
        &larr; Retour
      </AppButton>
      <h1 class="text-2xl font-bold text-gray-900">Telecharger un firmware</h1>
    </div>

    <AppCard class="max-w-xl">
      <form class="space-y-5" @submit.prevent="handleSubmit">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">Version <span class="text-red-500">*</span></label>
          <input
            v-model="version"
            type="text"
            placeholder="ex: 1.2.0"
            class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="errors.version ? 'border-red-500' : 'border-gray-300'"
          />
          <p v-if="errors.version" class="mt-1 text-xs text-red-600">{{ errors.version }}</p>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">Type de terminal <span class="text-red-500">*</span></label>
          <select
            v-model="deviceKind"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="rfid">RFID</option>
            <option value="biometric">Biometrique</option>
          </select>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">Description</label>
          <textarea
            v-model="description"
            rows="3"
            placeholder="Notes sur cette version (optionnel)"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">Fichier firmware (.bin) <span class="text-red-500">*</span></label>
          <div
            class="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-4 py-8 text-center hover:border-blue-400"
            @click="fileInput?.click()"
          >
            <p v-if="!file" class="text-sm text-gray-500">Cliquez pour selectionner un fichier .bin</p>
            <p v-else class="text-sm font-medium text-blue-700">{{ file.name }} ({{ (file.size / 1024).toFixed(1) }} KB)</p>
            <input ref="fileInput" type="file" accept=".bin" class="hidden" @change="handleFileChange" />
          </div>
          <p v-if="errors.file" class="mt-1 text-xs text-red-600">{{ errors.file }}</p>
        </div>

        <div class="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
          <div>
            <p class="text-sm font-medium text-gray-700">Mise a jour automatique</p>
            <p class="text-xs text-gray-500">Les terminaux compatibles seront mis a jour automatiquement</p>
          </div>
          <AppToggle v-model="isAutoUpdate" />
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <AppButton variant="ghost" type="button" @click="router.push({ name: 'firmware-versions' })">
            Annuler
          </AppButton>
          <AppButton variant="primary" type="submit" :disabled="store.isLoading">
            {{ store.isLoading ? 'Envoi en cours...' : 'Telecharger' }}
          </AppButton>
        </div>
      </form>
    </AppCard>
  </div>
</template>
