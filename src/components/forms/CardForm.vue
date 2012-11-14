<script setup lang="ts">
import { computed, ref } from 'vue'
import type { RfidCard, Employee } from '@/types'
import FormSection from './FormSection.vue'
import FormRow from './FormRow.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{
  modelValue: Partial<RfidCard>
  employees: Employee[]
  loading: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Partial<RfidCard>]
  submit: []
}>()

const errors = ref<Record<string, string>>({})

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const updateField = (field: keyof RfidCard, value: any) => {
  localValue.value = { ...localValue.value, [field]: value }
}

const employeeOptions = computed(() =>
  props.employees.map((e) => ({
    label: `${e.firstName} ${e.lastName} (${e.employeeNumber})`,
    value: e.id
  }))
)

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Bloquée', value: 'blocked' }
]

const isEditing = computed(() => !!localValue.value.id)

const validate = (): boolean => {
  errors.value = {}

  if (!localValue.value.uid?.trim()) {
    errors.value.uid = 'Le UID est requis'
  }

  if (!localValue.value.employeeId) {
    errors.value.employeeId = "L'employé est requis"
  }

  if (!localValue.value.status) {
    errors.value.status = 'Le statut est requis'
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = () => {
  if (validate()) {
    emit('submit')
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <FormSection title="Carte RFID">
      <FormRow
        label="UID de la carte"
        :required="true"
        :error="errors.uid"
        :help="isEditing ? 'Le UID ne peut pas être modifié' : 'Identifiant unique de la carte RFID'"
      >
        <AppInput
          :model-value="localValue.uid || ''"
          @update:model-value="updateField('uid', $event)"
          placeholder="XXXXXXXX"
          :disabled="loading || isEditing"
          :readonly="isEditing"
        />
      </FormRow>

      <FormRow label="Employé" :required="true" :error="errors.employeeId">
        <AppSelect
          :model-value="localValue.employeeId"
          @update:model-value="updateField('employeeId', $event)"
          :options="employeeOptions"
          placeholder="Sélectionner un employé"
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Statut" :required="true" :error="errors.status">
        <AppSelect
          :model-value="localValue.status || 'active'"
          @update:model-value="updateField('status', $event)"
          :options="statusOptions"
          placeholder="Sélectionner un statut"
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
