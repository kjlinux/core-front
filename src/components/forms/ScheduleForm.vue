<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Schedule, Company, Department } from '@/types'
import FormSection from './FormSection.vue'
import FormRow from './FormRow.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'

const props = defineProps<{
  initialData?: Partial<Schedule>
  companies: Company[]
  departments: Department[]
  loading: boolean
}>()

const emit = defineEmits<{
  submit: [data: Partial<Schedule>]
  cancel: []
}>()

const errors = ref<Record<string, string>>({})

const form = ref<Partial<Schedule>>({
  name: '',
  companyId: '',
  type: 'standard',
  startTime: '',
  endTime: '',
  breakStart: '',
  breakEnd: '',
  workDays: [],
  lateTolerance: 0,
  assignedDepartments: [],
})

// Pré-remplissage quand initialData arrive (chargement async en édition)
watch(
  () => props.initialData,
  (data) => {
    if (data && Object.keys(data).length > 0) {
      form.value = {
        name: data.name ?? '',
        companyId: data.companyId ?? '',
        type: data.type ?? 'standard',
        startTime: data.startTime ?? '',
        endTime: data.endTime ?? '',
        breakStart: data.breakStart ?? '',
        breakEnd: data.breakEnd ?? '',
        workDays: data.workDays ? [...data.workDays] : [],
        lateTolerance: data.lateTolerance ?? 0,
        assignedDepartments: data.assignedDepartments ? [...data.assignedDepartments] : [],
      }
    }
  },
  { immediate: true },
)

const companyOptions = computed(() =>
  props.companies.map((c) => ({ label: c.name, value: c.id }))
)

const filteredDepartments = computed(() => {
  if (!form.value.companyId) return []
  return props.departments.filter(d => d.companyId === form.value.companyId)
})

const typeOptions = [
  { label: 'Standard', value: 'standard' },
  { label: 'Personnalisé', value: 'custom' },
]

const weekDays = [
  { label: 'Lundi', value: 1 },
  { label: 'Mardi', value: 2 },
  { label: 'Mercredi', value: 3 },
  { label: 'Jeudi', value: 4 },
  { label: 'Vendredi', value: 5 },
  { label: 'Samedi', value: 6 },
  { label: 'Dimanche', value: 7 },
]

const toggleDay = (day: number) => {
  const days = [...(form.value.workDays ?? [])]
  const idx = days.indexOf(day)
  if (idx > -1) {
    days.splice(idx, 1)
  } else {
    days.push(day)
  }
  form.value = { ...form.value, workDays: days }
}

const toggleDepartment = (deptId: string) => {
  const depts = [...(form.value.assignedDepartments ?? [])]
  const idx = depts.indexOf(deptId)
  if (idx > -1) {
    depts.splice(idx, 1)
  } else {
    depts.push(deptId)
  }
  form.value = { ...form.value, assignedDepartments: depts }
}

// Reset departments when company changes
watch(() => form.value.companyId, () => {
  form.value = { ...form.value, assignedDepartments: [] }
})

const validate = (): boolean => {
  errors.value = {}

  if (!form.value.companyId) {
    errors.value.companyId = "L'entreprise est requise"
  }
  if (!form.value.name?.trim()) {
    errors.value.name = 'Le nom est requis'
  }
  if (!form.value.type) {
    errors.value.type = 'Le type est requis'
  }
  if (!form.value.startTime?.trim()) {
    errors.value.startTime = "L'heure de début est requise"
  }
  if (!form.value.endTime?.trim()) {
    errors.value.endTime = "L'heure de fin est requise"
  }
  if (form.value.startTime && form.value.endTime && form.value.startTime >= form.value.endTime) {
    errors.value.endTime = "L'heure de fin doit être après l'heure de début"
  }
  if (!form.value.workDays?.length) {
    errors.value.workDays = 'Sélectionner au moins un jour de travail'
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = () => {
  if (validate()) {
    emit('submit', { ...form.value })
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <FormSection title="Horaire de travail">
      <FormRow label="Entreprise" :required="true" :error="errors.companyId">
        <AppSelect
          v-model="form.companyId"
          :options="companyOptions"
          placeholder="Selectionner une entreprise"
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Nom" :required="true" :error="errors.name">
        <AppInput
          v-model="form.name"
          placeholder="Horaire standard, Horaire d'été, etc."
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Type" :required="true" :error="errors.type">
        <AppSelect
          v-model="form.type"
          :options="typeOptions"
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Heure de début" :required="true" :error="errors.startTime">
        <AppInput
          v-model="form.startTime"
          type="time"
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Heure de fin" :required="true" :error="errors.endTime">
        <AppInput
          v-model="form.endTime"
          type="time"
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Début de pause" :error="errors.breakStart">
        <AppInput
          v-model="form.breakStart"
          type="time"
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Fin de pause" :error="errors.breakEnd">
        <AppInput
          v-model="form.breakEnd"
          type="time"
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Jours de travail" :required="true" :error="errors.workDays">
        <div class="flex flex-wrap gap-3">
          <AppCheckbox
            v-for="day in weekDays"
            :key="day.value"
            :model-value="(form.workDays ?? []).includes(day.value)"
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
          :model-value="form.lateTolerance?.toString() ?? '0'"
          @update:model-value="form.lateTolerance = parseInt(String($event)) || 0"
          type="number"
          min="0"
          placeholder="0"
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Départements concernés" :error="errors.assignedDepartments">
        <div v-if="!form.companyId" class="text-sm text-gray-400 italic">
          Sélectionner d'abord une entreprise
        </div>
        <div v-else-if="filteredDepartments.length === 0" class="text-sm text-gray-400 italic">
          Aucun département pour cette entreprise
        </div>
        <div v-else class="flex flex-wrap gap-3">
          <AppCheckbox
            v-for="dept in filteredDepartments"
            :key="dept.id"
            :model-value="(form.assignedDepartments ?? []).includes(dept.id)"
            @update:model-value="toggleDepartment(dept.id)"
            :label="dept.name"
            :disabled="loading"
          />
        </div>
      </FormRow>
    </FormSection>

    <div class="flex justify-end gap-3">
      <AppButton type="button" variant="ghost" :disabled="loading" @click="emit('cancel')">
        Annuler
      </AppButton>
      <AppButton type="submit" :loading="loading">
        Enregistrer
      </AppButton>
    </div>
  </form>
</template>
