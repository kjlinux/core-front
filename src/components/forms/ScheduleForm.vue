<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Schedule } from '@/types'
import FormSection from './FormSection.vue'
import FormRow from './FormRow.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'

const props = defineProps<{
  modelValue?: Partial<Schedule>
  initialData?: Partial<Schedule>
  loading: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Partial<Schedule>]
  submit: [data: Partial<Schedule>]
}>()

const errors = ref<Record<string, string>>({})

const internalData = ref<Partial<Schedule>>(props.modelValue ?? props.initialData ?? {})

const localValue = computed({
  get: () => internalData.value,
  set: (value) => {
    internalData.value = value
    emit('update:modelValue', value)
  },
})

const updateField = (field: keyof Schedule, value: any) => {
  localValue.value = { ...localValue.value, [field]: value }
}

const typeOptions = [
  { label: 'Standard', value: 'standard' },
  { label: 'Personnalisé', value: 'custom' }
]

const weekDays = [
  { label: 'Dimanche', value: 0 },
  { label: 'Lundi', value: 1 },
  { label: 'Mardi', value: 2 },
  { label: 'Mercredi', value: 3 },
  { label: 'Jeudi', value: 4 },
  { label: 'Vendredi', value: 5 },
  { label: 'Samedi', value: 6 }
]

const workDays = computed({
  get: () => localValue.value.workDays || [],
  set: (value) => updateField('workDays', value)
})

const toggleDay = (day: number) => {
  const days = [...workDays.value]
  const index = days.indexOf(day)

  if (index > -1) {
    days.splice(index, 1)
  } else {
    days.push(day)
  }

  workDays.value = days
}

const validate = (): boolean => {
  errors.value = {}

  if (!localValue.value.name?.trim()) {
    errors.value.name = 'Le nom est requis'
  }

  if (!localValue.value.type) {
    errors.value.type = 'Le type est requis'
  }

  if (!localValue.value.startTime?.trim()) {
    errors.value.startTime = "L'heure de début est requise"
  }

  if (!localValue.value.endTime?.trim()) {
    errors.value.endTime = "L'heure de fin est requise"
  }

  if (localValue.value.startTime && localValue.value.endTime) {
    if (localValue.value.startTime >= localValue.value.endTime) {
      errors.value.endTime = "L'heure de fin doit être après l'heure de début"
    }
  }

  if (!workDays.value.length) {
    errors.value.workDays = 'Sélectionner au moins un jour de travail'
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = () => {
  if (validate()) {
    emit('submit', internalData.value)
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <FormSection title="Horaire de travail">
      <FormRow label="Nom" :required="true" :error="errors.name">
        <AppInput
          :model-value="localValue.name || ''"
          @update:model-value="updateField('name', $event)"
          placeholder="Horaire standard, Horaire d'été, etc."
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Type" :required="true" :error="errors.type">
        <AppSelect
          :model-value="localValue.type || 'standard'"
          @update:model-value="updateField('type', $event)"
          :options="typeOptions"
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Heure de début" :required="true" :error="errors.startTime">
        <AppInput
          :model-value="localValue.startTime || ''"
          @update:model-value="updateField('startTime', $event)"
          type="time"
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Heure de fin" :required="true" :error="errors.endTime">
        <AppInput
          :model-value="localValue.endTime || ''"
          @update:model-value="updateField('endTime', $event)"
          type="time"
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Début de pause" :error="errors.breakStart">
        <AppInput
          :model-value="localValue.breakStart || ''"
          @update:model-value="updateField('breakStart', $event)"
          type="time"
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Fin de pause" :error="errors.breakEnd">
        <AppInput
          :model-value="localValue.breakEnd || ''"
          @update:model-value="updateField('breakEnd', $event)"
          type="time"
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Jours de travail" :required="true" :error="errors.workDays">
        <div class="space-y-2">
          <AppCheckbox
            v-for="day in weekDays"
            :key="day.value"
            :model-value="workDays.includes(day.value)"
            @update:model-value="toggleDay(day.value)"
            :label="day.label"
            :disabled="loading"
          />
        </div>
      </FormRow>

      <FormRow
        label="Tolérance retard (minutes)"
        :error="errors.lateTolerance"
        help="Nombre de minutes de tolérance avant qu'un retard soit comptabilisé"
      >
        <AppInput
          :model-value="localValue.lateTolerance?.toString() || '0'"
          @update:model-value="updateField('lateTolerance', parseInt(String($event)) || 0)"
          type="number"
          min="0"
          placeholder="0"
          :disabled="loading"
        />
      </FormRow>
    </FormSection>

    <div class="flex justify-end">
      <AppButton type="submit" :loading="loading">
        Enregistrer
      </AppButton>
    </div>
  </form>
</template>
