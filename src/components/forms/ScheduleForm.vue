<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { Schedule, Company, Department, ScheduleDay, ScheduleSegment } from '@/types'
import { normalizeSchedule, inferShiftKind, shiftKindLabel } from '@/utils/schedule'
import FormSection from './FormSection.vue'
import FormRow from './FormRow.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'

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
const isPrefilling = ref(false)

const weekDays = [
  { label: 'Lundi', value: 1 },
  { label: 'Mardi', value: 2 },
  { label: 'Mercredi', value: 3 },
  { label: 'Jeudi', value: 4 },
  { label: 'Vendredi', value: 5 },
  { label: 'Samedi', value: 6 },
  { label: 'Dimanche', value: 7 },
]

function emptyDays(): ScheduleDay[] {
  return [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({ weekday, worked: false, segments: [] }))
}

const form = ref<Partial<Schedule>>({
  name: '',
  companyId: '',
  type: 'standard',
  defaultLateTolerance: 0,
  days: emptyDays(),
  assignedDepartments: [],
})

watch(
  () => props.initialData,
  async (data) => {
    if (data && Object.keys(data).length > 0) {
      isPrefilling.value = true
      const normalized = normalizeSchedule(data)
      form.value = {
        name: normalized.name,
        companyId: normalized.companyId,
        type: normalized.type,
        defaultLateTolerance: normalized.defaultLateTolerance,
        days: normalized.days.length
          ? (JSON.parse(JSON.stringify(normalized.days)) as ScheduleDay[])
          : emptyDays(),
        assignedDepartments: [...normalized.assignedDepartments],
      }
      await nextTick()
      isPrefilling.value = false
    }
  },
  { immediate: true },
)

// Le type d'horaire (Jour/Nuit) est déduit des segments : nuit dès qu'un segment franchit minuit
const derivedType = computed<'day' | 'night'>(() =>
  (form.value.days ?? []).some((d) => d.worked && d.segments.some((s) => s.kind === 'night'))
    ? 'night'
    : 'day',
)

watch(derivedType, (t) => (form.value.type = t), { immediate: true })

const typeLabel = (type?: string): string => (type === 'night' ? 'Nuit' : 'Jour')

const companyOptions = computed(() =>
  props.companies.map((c) => ({ label: c.name, value: c.id })),
)

const filteredDepartments = computed(() => {
  if (!form.value.companyId) return []
  return props.departments.filter((d) => d.companyId === form.value.companyId)
})

const toggleDepartment = (deptId: string) => {
  const depts = [...(form.value.assignedDepartments ?? [])]
  const idx = depts.indexOf(deptId)
  if (idx > -1) depts.splice(idx, 1)
  else depts.push(deptId)
  form.value = { ...form.value, assignedDepartments: depts }
}

watch(
  () => form.value.companyId,
  () => {
    if (!isPrefilling.value) {
      form.value = { ...form.value, assignedDepartments: [] }
    }
  },
)

const dayLabel = (weekday: number) =>
  weekDays.find((d) => d.value === weekday)?.label ?? String(weekday)

const toggleDayWorked = (day: ScheduleDay) => {
  day.worked = !day.worked
  if (day.worked && day.segments.length === 0) {
    addSegment(day)
  }
}

const addSegment = (day: ScheduleDay) => {
  day.segments.push({
    kind: 'morning',
    startTime: '',
    endTime: '',
    expectedPunches: [{ time: '', label: '' }],
    lateTolerance: form.value.defaultLateTolerance ?? 0,
  })
}

const removeSegment = (day: ScheduleDay, index: number) => {
  day.segments.splice(index, 1)
}

// Copie de la config d'un jour vers d'autres jours
const copySource = ref<number | null>(null)
const copyTargets = ref<number[]>([])

const otherDays = (weekday: number) => weekDays.filter((d) => d.value !== weekday)

const openCopy = (day: ScheduleDay) => {
  copySource.value = day.weekday
  copyTargets.value = []
}

const cancelCopy = () => {
  copySource.value = null
  copyTargets.value = []
}

const toggleCopyTarget = (weekday: number) => {
  const i = copyTargets.value.indexOf(weekday)
  if (i > -1) copyTargets.value.splice(i, 1)
  else copyTargets.value.push(weekday)
}

const applyCopy = () => {
  const source = (form.value.days ?? []).find((d) => d.weekday === copySource.value)
  if (!source) {
    cancelCopy()
    return
  }
  for (const target of form.value.days ?? []) {
    if (copyTargets.value.includes(target.weekday)) {
      target.segments = structuredClone(source.segments)
      target.worked = true
    }
  }
  cancelCopy()
}

// Renseigne le pointage attendu dérivé d'une borne (Début → Arrivée, Fin → Départ)
// sans écraser un pointage personnalisé : met à jour celui portant ce libellé s'il
// existe, sinon réutilise un emplacement vierge, sinon en ajoute un nouveau.
const setDerivedPunch = (segment: ScheduleSegment, label: string, time: string) => {
  const punches = segment.expectedPunches
  const labelled = punches.find((p) => p.label === label)
  if (labelled) {
    labelled.time = time
    return
  }
  const blank = punches.find((p) => !p.time && !p.label)
  if (blank) {
    blank.time = time
    blank.label = label
    return
  }
  punches.push({ time, label })
}

// Le type de segment (Matin/Soir/Journée/Nuit) est déduit des heures, jamais saisi à la main.
// La saisie des heures pré-remplit aussi les pointages attendus (ajustables ensuite).
const updateSegmentTime = (
  segment: ScheduleSegment,
  field: 'startTime' | 'endTime',
  value: string,
) => {
  segment[field] = value
  if (segment.startTime && segment.endTime) {
    segment.kind = inferShiftKind(segment.startTime, segment.endTime)
  }
  if (value) {
    setDerivedPunch(segment, field === 'startTime' ? 'Arrivée' : 'Départ', value)
  }
}

const addPunch = (segment: ScheduleSegment) => {
  segment.expectedPunches.push({ time: '', label: '' })
}

const removePunch = (segment: ScheduleSegment, index: number) => {
  segment.expectedPunches.splice(index, 1)
}

const validate = (): boolean => {
  errors.value = {}
  if (!form.value.companyId) errors.value.companyId = "L'entreprise est requise"
  if (!form.value.name?.trim()) errors.value.name = 'Le nom est requis'

  const workedDays = (form.value.days ?? []).filter((d) => d.worked)
  if (workedDays.length === 0) {
    errors.value.days = 'Sélectionner au moins un jour de travail'
  }
  for (const day of workedDays) {
    if (day.segments.length === 0) {
      errors.value.days = `${dayLabel(day.weekday)}: ajouter au moins un segment`
      break
    }
    for (const seg of day.segments) {
      if (!seg.startTime || !seg.endTime) {
        errors.value.days = `${dayLabel(day.weekday)}: heures de segment requises`
        break
      }
      if (seg.expectedPunches.some((p) => !p.time)) {
        errors.value.days = `${dayLabel(day.weekday)}: heure de pointage requise`
        break
      }
    }
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
          placeholder="Sélectionner une entreprise"
          :disabled="loading"
        />
      </FormRow>

      <FormRow label="Nom" :required="true" :error="errors.name">
        <AppInput
          v-model="form.name"
          placeholder="Horaire Jour, Horaire Nuit, Mi-temps matin..."
          :disabled="loading"
        />
      </FormRow>

      <FormRow
        label="Type (auto)"
        help="Déduit des segments : « Nuit » dès qu'un segment franchit minuit, sinon « Jour »"
      >
        <div class="rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600">
          {{ typeLabel(form.type) }}
        </div>
      </FormRow>

      <FormRow
        label="Tolérance retard par défaut (minutes)"
        help="Appliquée à chaque nouveau pointage (modifiable par segment)"
      >
        <AppInput
          :model-value="form.defaultLateTolerance?.toString() ?? '0'"
          @update:model-value="form.defaultLateTolerance = parseInt(String($event)) || 0"
          type="number"
          min="0"
          :disabled="loading"
        />
      </FormRow>
    </FormSection>

    <FormSection title="Jours et segments de travail">
      <p v-if="errors.days" class="mb-3 text-sm text-red-600">{{ errors.days }}</p>

      <div
        v-for="day in form.days"
        :key="day.weekday"
        class="mb-4 rounded-lg border border-gray-200 p-4"
      >
        <div class="flex items-center justify-between">
          <AppCheckbox
            :model-value="day.worked"
            @update:model-value="toggleDayWorked(day)"
            :label="dayLabel(day.weekday)"
            :disabled="loading"
          />
          <div v-if="day.worked" class="flex items-center gap-2">
            <AppButton
              type="button"
              variant="ghost"
              size="sm"
              @click="openCopy(day)"
              :disabled="loading || day.segments.length === 0"
            >
              Copier vers…
            </AppButton>
            <AppButton
              type="button"
              variant="ghost"
              size="sm"
              @click="addSegment(day)"
              :disabled="loading"
            >
              <PlusIcon class="w-4 h-4 mr-1" /> Segment
            </AppButton>
          </div>
        </div>

        <div
          v-if="copySource === day.weekday"
          class="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3"
        >
          <p class="mb-2 text-xs font-medium text-gray-600">
            Copier les segments de {{ dayLabel(day.weekday) }} vers :
          </p>
          <div class="flex flex-wrap gap-3">
            <AppCheckbox
              v-for="target in otherDays(day.weekday)"
              :key="target.value"
              :model-value="copyTargets.includes(target.value)"
              @update:model-value="toggleCopyTarget(target.value)"
              :label="target.label"
              :disabled="loading"
            />
          </div>
          <div class="mt-3 flex gap-2">
            <AppButton
              type="button"
              size="sm"
              @click="applyCopy"
              :disabled="loading || copyTargets.length === 0"
            >
              Appliquer
            </AppButton>
            <AppButton
              type="button"
              variant="ghost"
              size="sm"
              @click="cancelCopy"
              :disabled="loading"
            >
              Annuler
            </AppButton>
          </div>
          <p class="mt-2 text-xs text-gray-400">
            Écrase les segments existants des jours sélectionnés.
          </p>
        </div>

        <div v-if="day.worked" class="mt-3 space-y-4">
          <div
            v-for="(segment, sIdx) in day.segments"
            :key="sIdx"
            class="rounded-md bg-gray-50 p-3"
          >
            <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div>
                <label class="mb-1 block text-xs text-gray-500">Type (auto)</label>
                <div
                  class="rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600"
                  title="Déduit automatiquement des heures de début et de fin"
                >
                  {{ shiftKindLabel(segment.kind) }}
                </div>
              </div>
              <div>
                <label class="mb-1 block text-xs text-gray-500">Début</label>
                <AppInput
                  :model-value="segment.startTime"
                  @update:model-value="updateSegmentTime(segment, 'startTime', String($event))"
                  type="time"
                  :disabled="loading"
                />
              </div>
              <div>
                <label class="mb-1 block text-xs text-gray-500">Fin</label>
                <AppInput
                  :model-value="segment.endTime"
                  @update:model-value="updateSegmentTime(segment, 'endTime', String($event))"
                  type="time"
                  :disabled="loading"
                />
              </div>
              <div>
                <label class="mb-1 block text-xs text-gray-500">Tolérance (min)</label>
                <AppInput
                  :model-value="segment.lateTolerance?.toString() ?? '0'"
                  @update:model-value="segment.lateTolerance = parseInt(String($event)) || 0"
                  type="number"
                  min="0"
                  :disabled="loading"
                />
              </div>
            </div>

            <div class="mt-3">
              <div class="mb-1 flex items-center justify-between">
                <label class="text-xs text-gray-500">Pointages attendus</label>
                <AppButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  @click="addPunch(segment)"
                  :disabled="loading"
                >
                  <PlusIcon class="w-4 h-4 mr-1" /> Heure
                </AppButton>
              </div>
              <div
                v-for="(punch, pIdx) in segment.expectedPunches"
                :key="pIdx"
                class="mb-2 flex items-center gap-2"
              >
                <AppInput v-model="punch.time" type="time" :disabled="loading" />
                <AppInput
                  v-model="punch.label"
                  placeholder="Libellé (optionnel)"
                  :disabled="loading"
                />
                <AppButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="text-red-600"
                  @click="removePunch(segment, pIdx)"
                  :disabled="loading || segment.expectedPunches.length <= 1"
                >
                  <TrashIcon class="w-4 h-4" />
                </AppButton>
              </div>
            </div>

            <div class="mt-2 flex justify-end">
              <AppButton
                type="button"
                variant="ghost"
                size="sm"
                class="text-red-600"
                @click="removeSegment(day, sIdx)"
                :disabled="loading"
              >
                <TrashIcon class="w-4 h-4 mr-1" /> Supprimer le segment
              </AppButton>
            </div>
          </div>
        </div>
      </div>
    </FormSection>

    <FormSection title="Départements concernés (affectation par défaut)">
      <FormRow
        label="Départements"
        help="Les employés de ces départements utilisent cet horaire sauf affectation individuelle"
      >
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
      <AppButton type="submit" :loading="loading">Enregistrer</AppButton>
    </div>
  </form>
</template>
