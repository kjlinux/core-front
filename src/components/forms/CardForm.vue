<script setup lang="ts">
import { computed, ref } from 'vue'
import type { RfidCard, Employee, Company } from '@/types'
import FormSection from './FormSection.vue'
import FormRow from './FormRow.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{
  modelValue: Partial<RfidCard>
  companies: Company[]
  employees?: Employee[]
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

const companyOptions = computed(() =>
  props.companies.map((c) => ({ label: c.name, value: c.id }))
)

const employeeOptions = computed(() =>
  (props.employees || []).map((e) => ({
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
      <AppButton type="submit" :loading="loading">
        Enregistrer
      </AppButton>
    </div>
  </form>
</template>
