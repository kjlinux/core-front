<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Employee, Company, Site, Department, Schedule } from '@/types'
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
  employees: Employee[]
  schedules?: Schedule[]
  loading: boolean
  isEdit?: boolean
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

const derivePrefix = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const raw = words.length > 1
    ? words.map((w) => w[0]).join('')
    : (words[0] ?? '')
  return raw.replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase() || 'EMP'
}

const generateMatricule = (companyId: string): string => {
  const company = props.companies.find((c) => c.id === companyId)
  if (!company) return ''
  const prefix = company.matriculePrefix?.trim() || derivePrefix(company.name)
  const count = props.employees.filter((e) => e.companyId === companyId).length
  return `${prefix}${String(count + 1).padStart(3, '0')}`
}

watch(
  () => localValue.value.companyId,
  (newCompanyId) => {
    if (!props.isEdit && newCompanyId) {
      const matricule = generateMatricule(newCompanyId)
      if (matricule) {
        localValue.value = { ...localValue.value, employeeNumber: matricule }
      }
    }
  },
  { immediate: true }
)

const updateField = (field: keyof Employee, value: any) => {
  const updated = { ...localValue.value, [field]: value }
  if (field === 'companyId') {
    updated.siteId = ''
    updated.departmentId = ''
  }
  if (field === 'siteId') {
    updated.departmentId = ''
  }
  localValue.value = updated
}

const companyOptions = computed(() =>
  props.companies.map((c) => ({ label: c.name, value: c.id }))
)

const filteredSites = computed(() => {
  if (!localValue.value.companyId) return []
  return props.sites.filter(s => s.companyId === localValue.value.companyId)
})

const siteOptions = computed(() =>
  filteredSites.value.map((s) => ({ label: s.name, value: s.id }))
)

const filteredDepartments = computed(() => {
  if (!localValue.value.siteId) return []
  return props.departments.filter(d => d.siteId === localValue.value.siteId)
})

const departmentOptions = computed(() =>
  filteredDepartments.value.map((d) => ({ label: d.name, value: d.id }))
)

const scheduleOptions = computed(() => {
  const list = (props.schedules ?? []).filter(
    (s) => !localValue.value.companyId || s.companyId === localValue.value.companyId,
  )
  return [
    { label: 'Horaire du département (défaut)', value: '' },
    ...list.map((s) => ({ label: s.name, value: s.id })),
  ]
})

const paymentModeOptions = [
  { label: 'Mensuel', value: 'monthly' },
  { label: 'Horaire', value: 'hourly' },
  { label: 'Journalier', value: 'daily' },
  { label: 'Hebdomadaire', value: 'weekly' },
  { label: 'Forfait', value: 'forfait' },
]

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

  if (!localValue.value.phone?.trim()) {
    errors.value.phone = 'Le téléphone est requis'
  }

  if (!localValue.value.position?.trim()) {
    errors.value.position = 'Le poste est requis'
  }

  if (!localValue.value.hireDate) {
    errors.value.hireDate = "La date d'embauche est requise"
  }

  if (!localValue.value.companyId) {
    errors.value.companyId = "L'entreprise est requise"
  }

  if (!localValue.value.siteId) {
    errors.value.siteId = 'Le site est requis'
  }

  if (!localValue.value.departmentId) {
    errors.value.departmentId = 'Le département est requis'
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

      <FormRow label="Téléphone" :required="true" :error="errors.phone">
        <AppInput
          :model-value="localValue.phone || ''"
          @update:model-value="updateField('phone', $event)"
          type="tel"
          placeholder="+212 XXX XXX XXX"
          :disabled="loading"
        />
      </FormRow>

      <FormRow
        label="Matricule"
        :required="true"
        :error="errors.employeeNumber"
        :help="!isEdit ? 'Généré automatiquement selon le préfixe de l\'entreprise' : undefined"
      >
        <AppInput
          :model-value="localValue.employeeNumber || ''"
          @update:model-value="updateField('employeeNumber', $event)"
          placeholder="Sélectionner d'abord une entreprise"
          :disabled="loading || (!isEdit && !!localValue.companyId)"
        />
      </FormRow>

      <FormRow label="Poste" :required="true" :error="errors.position">
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

      <FormRow label="Site" :required="true" :error="errors.siteId">
        <AppSelect
          :model-value="localValue.siteId"
          @update:model-value="updateField('siteId', $event)"
          :options="siteOptions"
          placeholder="Sélectionner un site"
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Département" :required="true" :error="errors.departmentId">
        <AppSelect
          :model-value="localValue.departmentId"
          @update:model-value="updateField('departmentId', $event)"
          :options="departmentOptions"
          placeholder="Sélectionner un département"
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Horaire de travail" :optional="true" help="Laisser vide pour utiliser l'horaire du département">
        <AppSelect
          :model-value="localValue.scheduleId || ''"
          @update:model-value="updateField('scheduleId', $event || null)"
          :options="scheduleOptions"
          placeholder="Horaire du département (défaut)"
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Date d'embauche" :required="true" :error="errors.hireDate">
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

    <FormSection title="Rémunération">
      <FormRow label="Mode de rémunération" :optional="true">
        <AppSelect
          :model-value="localValue.paymentMode || ''"
          @update:model-value="updateField('paymentMode', $event || undefined)"
          :options="paymentModeOptions"
          placeholder="Sélectionner un mode"
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Salaire de base (FCFA)" :optional="true">
        <AppInput
          :model-value="localValue.baseSalary?.toString() || ''"
          @update:model-value="updateField('baseSalary', $event ? Number($event) : undefined)"
          type="number"
          placeholder="Ex : 150 000"
          :disabled="loading"
        />
      </FormRow>
    </FormSection>

  </form>
</template>
