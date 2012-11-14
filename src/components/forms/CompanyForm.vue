<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Company } from '@/types'
import FormSection from './FormSection.vue'
import FormRow from './FormRow.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{
  modelValue: Partial<Company>
  loading: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Partial<Company>]
  submit: []
}>()

const errors = ref<Record<string, string>>({})

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const updateField = (field: keyof Company, value: any) => {
  localValue.value = { ...localValue.value, [field]: value }
}

const validate = (): boolean => {
  errors.value = {}

  if (!localValue.value.name?.trim()) {
    errors.value.name = 'Le nom est requis'
  }

  if (!localValue.value.email?.trim()) {
    errors.value.email = "L'email est requis"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(localValue.value.email)) {
    errors.value.email = "L'email n'est pas valide"
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
    <FormSection title="Informations entreprise">
      <FormRow label="Nom" :required="true" :error="errors.name">
        <AppInput
          :model-value="localValue.name || ''"
          @update:model-value="updateField('name', $event)"
          placeholder="Nom de l'entreprise"
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Email" :required="true" :error="errors.email">
        <AppInput
          :model-value="localValue.email || ''"
          @update:model-value="updateField('email', $event)"
          type="email"
          placeholder="contact@entreprise.com"
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Téléphone" :error="errors.phone">
        <AppInput
          :model-value="localValue.phone || ''"
          @update:model-value="updateField('phone', $event)"
          type="tel"
          placeholder="+212 XXX XXX XXX"
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Adresse" :error="errors.address">
        <AppInput
          :model-value="localValue.address || ''"
          @update:model-value="updateField('address', $event)"
          placeholder="Adresse complète"
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Logo" help="Fonctionnalité d'upload à venir">
        <AppInput
          type="file"
          accept="image/*"
          :disabled="true"
          placeholder="Sélectionner un logo"
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
