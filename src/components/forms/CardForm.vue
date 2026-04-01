<script setup lang="ts">
import { computed, ref } from 'vue'
import type { RfidCard, Company } from '@/types'
import type { RfidDevice } from '@/types'
import FormSection from './FormSection.vue'
import FormRow from './FormRow.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{
  modelValue: Partial<RfidCard>
  companies: Company[]
  devices?: RfidDevice[]
  scanStatus?: 'idle' | 'waiting' | 'received'
  loading: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Partial<RfidCard>]
  'scan-request': [deviceId: string]
  'toggle-device-online': [deviceId: string]
  submit: []
}>()

const errors = ref<Record<string, string>>({})
const selectedDeviceId = ref('')

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const updateField = (field: keyof RfidCard, value: any) => {
  localValue.value = { ...localValue.value, [field]: value }
}

const companyOptions = computed(() =>
  props.companies.map((c) => ({ label: c.name, value: c.id }))
)

const deviceOptions = computed(() => [
  { label: 'Selectionner un capteur', value: '' },
  ...(props.devices || []).map((d) => ({
    label: `${d.name} (${d.serialNumber})${d.isOnline ? '' : ' — Hors ligne'}`,
    value: d.id,
  })),
])

const selectedDevice = computed(() =>
  props.devices?.find((d) => d.id === selectedDeviceId.value) ?? null
)

const selectedDeviceIsOnline = computed(() => selectedDevice.value?.isOnline ?? false)

function handleForceOnline() {
  if (selectedDeviceId.value) {
    emit('toggle-device-online', selectedDeviceId.value)
  }
}

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Bloquée', value: 'blocked' }
]

const isEditing = computed(() => !!localValue.value.id)
const isWaiting = computed(() => props.scanStatus === 'waiting')
const isReceived = computed(() => props.scanStatus === 'received')

const validate = (): boolean => {
  errors.value = {}

  if (!localValue.value.uid?.trim()) {
    errors.value.uid = 'Le UID est requis'
  }

  if (!localValue.value.companyId) {
    errors.value.companyId = "L'entreprise est requise"
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = () => {
  if (validate()) {
    emit('submit')
  }
}

const handleScan = () => {
  if (!selectedDeviceId.value) return
  emit('scan-request', selectedDeviceId.value)
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <FormSection title="Carte RFID">

      <template v-if="!isEditing">
        <FormRow
          label="Capteur de scan"
          :help="'Selectionnez le capteur qui va lire la carte'"
        >
          <div class="flex gap-2">
            <AppSelect
              v-model="selectedDeviceId"
              :options="deviceOptions"
              :disabled="loading || isWaiting"
              class="flex-1"
            />
            <template v-if="selectedDeviceId && !selectedDeviceIsOnline">
              <AppButton
                type="button"
                variant="secondary"
                :disabled="loading"
                @click="handleForceOnline"
              >
                Mettre en ligne
              </AppButton>
            </template>
            <template v-else>
              <AppButton
                type="button"
                variant="secondary"
                :loading="isWaiting"
                :disabled="!selectedDeviceId || !selectedDeviceIsOnline || loading || isWaiting"
                @click="handleScan"
              >
                {{ isWaiting ? 'En attente...' : 'Scanner' }}
              </AppButton>
            </template>
          </div>
          <p v-if="selectedDeviceId && !selectedDeviceIsOnline && !isWaiting" class="mt-2 text-sm text-amber-600">
            Ce capteur est hors ligne. Mettez-le en ligne pour pouvoir scanner.
          </p>
          <p v-if="isWaiting" class="mt-2 text-sm text-blue-600 flex items-center gap-2">
            <span class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></span>
            Approchez la carte du capteur...
          </p>
          <p v-if="isReceived" class="mt-2 text-sm text-green-600">
            UID recupere avec succes
          </p>
        </FormRow>
      </template>

      <FormRow
        label="UID de la carte"
        :required="true"
        :error="errors.uid"
        :help="isEditing ? 'Le UID ne peut pas être modifié' : 'Identifiant unique lu par le capteur'"
      >
        <AppInput
          :model-value="localValue.uid || ''"
          @update:model-value="updateField('uid', $event)"
          placeholder="Scan via le capteur ou saisie manuelle"
          :disabled="loading || isEditing || isWaiting"
          :readonly="isEditing"
        />
      </FormRow>

      <FormRow label="Entreprise" :required="true" :error="errors.companyId">
        <AppSelect
          :model-value="localValue.companyId"
          @update:model-value="updateField('companyId', $event)"
          :options="companyOptions"
          placeholder="Selectionner une entreprise"
          :disabled="loading"
        />
      </FormRow>
    </FormSection>

    <div class="flex justify-end">
      <AppButton type="submit" :loading="loading" :disabled="isWaiting">
        Enregistrer
      </AppButton>
    </div>
  </form>
</template>
