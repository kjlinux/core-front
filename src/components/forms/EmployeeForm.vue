<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Employee, Company, Site, Department } from '@/types'
import FormSection from './FormSection.vue'
import FormRow from './FormRow.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'

const props = defineProps<{
  modelValue: Partial<Employee>
  companies: Company[]
  sites: Site[]
  departments: Department[]
  loading: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Partial<Employee>]
  submit: []
}>()

const errors = ref<Record<string, string>>({})

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const updateField = (field: keyof Employee, value: any) => {
  localValue.value = { ...localValue.value, [field]: value }
}

const companyOptions = computed(() =>
  props.companies.map((c) => ({ label: c.name, value: c.id }))
)

const siteOptions = computed(() =>
  props.sites.map((s) => ({ label: s.name, value: s.id }))
)

const departmentOptions = computed(() =>
  props.departments.map((d) => ({ label: d.name, value: d.id }))
)

const validate = (): boolean => {
  errors.value = {}

  if (!localValue.value.firstName?.trim()) {
    errors.value.firstName = 'Le prénom est requis'
  }

  if (!localValue.value.lastName?.trim()) {
    errors.value.lastName = 'Le nom est requis'
  }

  if (!localValue.value.email?.trim()) {
    errors.value.email = "L'email est requis"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(localValue.value.email)) {
    errors.value.email = "L'email n'est pas valide"
  }

  if (!localValue.value.employeeNumber?.trim()) {
    errors.value.employeeNumber = 'Le matricule est requis'
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
    <FormSection title="Informations personnelles">
      <FormRow label="Prénom" :required="true" :error="errors.firstName">
        <AppInput
          :model-value="localValue.firstName || ''"
          @update:model-value="updateField('firstName', $event)"
          placeholder="Prénom"
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Nom" :required="true" :error="errors.lastName">
        <AppInput
          :model-value="localValue.lastName || ''"
          @update:model-value="updateField('lastName', $event)"
          placeholder="Nom"
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Email" :required="true" :error="errors.email">
        <AppInput
          :model-value="localValue.email || ''"
          @update:model-value="updateField('email', $event)"
          type="email"
          placeholder="employe@entreprise.com"
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

      <FormRow label="Matricule" :required="true" :error="errors.employeeNumber">
        <AppInput
          :model-value="localValue.employeeNumber || ''"
          @update:model-value="updateField('employeeNumber', $event)"
          placeholder="EMP001"
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Poste" :error="errors.position">
        <AppInput
          :model-value="localValue.position || ''"
          @update:model-value="updateField('position', $event)"
          placeholder="Développeur, Manager, etc."
          :disabled="loading"
        />
      </FormRow>
    </FormSection>

    <FormSection title="Affectation">
      <FormRow label="Entreprise" :required="true" :error="errors.companyId">
        <AppSelect
          :model-value="localValue.companyId"
          @update:model-value="updateField('companyId', $event)"
          :options="companyOptions"
          placeholder="Sélectionner une entreprise"
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Site" :error="errors.siteId">
        <AppSelect
          :model-value="localValue.siteId"
          @update:model-value="updateField('siteId', $event)"
          :options="siteOptions"
          placeholder="Sélectionner un site"
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Département" :error="errors.departmentId">
        <AppSelect
          :model-value="localValue.departmentId"
          @update:model-value="updateField('departmentId', $event)"
          :options="departmentOptions"
          placeholder="Sélectionner un département"
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Date d'embauche" :error="errors.hireDate">
        <AppInput
          :model-value="localValue.hireDate || ''"
          @update:model-value="updateField('hireDate', $event)"
          type="date"
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Actif">
        <AppCheckbox
          :model-value="localValue.isActive ?? true"
          @update:model-value="updateField('isActive', $event)"
          label="L'employé est actif"
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
