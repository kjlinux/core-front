<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { payrollApi } from '@/services/api/payroll.api'
import { useAuthStore } from '@/stores/auth.store'
import { useCompanyStore } from '@/stores/company.store'
import { useToast } from '@/composables/useToast'
import { formatCurrency } from '@/utils/format'
import type { LatenessRule } from '@/types/payroll'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import { PlusIcon, TrashIcon, ClockIcon } from '@heroicons/vue/24/outline'

type DraftRule = Pick<LatenessRule, 'toleranceMinutes' | 'minutesThreshold' | 'penaltyValue' | 'penaltyType' | 'applyPer'>

const auth = useAuthStore()
const companyStore = useCompanyStore()
const toast = useToast()

const isLoading = ref(true)
const isSaving = ref(false)
const selectedCompanyId = ref<string>('')
const rules = ref<DraftRule[]>([])

const isSuperAdmin = computed(() => auth.user?.role === 'super_admin')

const companyOptions = computed(() =>
  companyStore.companies.map((c) => ({ label: c.name, value: c.id }))
)

const penaltyTypeOptions = [
  { label: 'Montant fixe (FCFA)', value: 'fixed' as const },
  { label: 'Pourcentage du salaire', value: 'percentage' as const },
]

const applyPerOptions = [
  { label: 'Par occurrence', value: 'occurrence' as const },
  { label: 'Par tranche', value: 'tranche' as const },
]

// Salaire mensuel de simulation (employe temoin)
const witnessSalary = ref(150000)
const witnessLatenessMinutes = ref(45)

// Simulation : applique toutes les regles a un cas (employe temoin)
const simulationBreakdown = computed(() => {
  if (witnessLatenessMinutes.value <= 0 || rules.value.length === 0) return []
  const lines: Array<{ label: string; minutes: number; deduction: number }> = []
  for (const r of rules.value) {
    const effective = Math.max(0, witnessLatenessMinutes.value - r.toleranceMinutes)
    if (effective < r.minutesThreshold) continue
    let amount = 0
    if (r.applyPer === 'occurrence') {
      amount = r.penaltyType === 'fixed'
        ? r.penaltyValue
        : (witnessSalary.value * r.penaltyValue) / 100
    } else {
      const tranches = Math.floor(effective / r.minutesThreshold)
      amount = r.penaltyType === 'fixed'
        ? r.penaltyValue * tranches
        : (witnessSalary.value * r.penaltyValue * tranches) / 100
    }
    lines.push({
      label: `Retard >= ${r.minutesThreshold}min (tolerance ${r.toleranceMinutes}min)`,
      minutes: effective,
      deduction: Math.round(amount),
    })
  }
  return lines
})

const simulationTotal = computed(() =>
  simulationBreakdown.value.reduce((acc, l) => acc + l.deduction, 0)
)

async function load() {
  if (!selectedCompanyId.value) {
    rules.value = []
    isLoading.value = false
    return
  }
  isLoading.value = true
  try {
    const config = await payrollApi.getConfig(selectedCompanyId.value)
    rules.value = (config.latenessRules ?? []).map((r) => ({
      toleranceMinutes: r.toleranceMinutes,
      minutesThreshold: r.minutesThreshold,
      penaltyValue: r.penaltyValue,
      penaltyType: r.penaltyType,
      applyPer: r.applyPer,
    }))
  } catch (e) {
    toast.error('Impossible de charger la configuration', String((e as Error).message))
  } finally {
    isLoading.value = false
  }
}

function addRule() {
  rules.value.push({
    toleranceMinutes: 5,
    minutesThreshold: 15,
    penaltyValue: 1000,
    penaltyType: 'fixed',
    applyPer: 'occurrence',
  })
}

function removeRule(idx: number) {
  rules.value.splice(idx, 1)
}

async function save() {
  if (!selectedCompanyId.value) {
    toast.error('Selectionnez une entreprise')
    return
  }
  isSaving.value = true
  try {
    await payrollApi.saveLatenessRules(selectedCompanyId.value, rules.value)
    toast.success('Regles de retard enregistrees')
    await load()
  } catch (e) {
    toast.error('Echec sauvegarde', String((e as Error).message))
  } finally {
    isSaving.value = false
  }
}

watch(selectedCompanyId, load)

onMounted(async () => {
  if (isSuperAdmin.value) {
    await companyStore.fetchCompanies({ perPage: 200 })
    selectedCompanyId.value = ''
    isLoading.value = false
  } else if (auth.user?.companyId) {
    selectedCompanyId.value = auth.user.companyId
  } else {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Regles de retard</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configurez les penalites appliquees aux fiches de paie selon les seuils de retard
        </p>
      </div>
    </div>

    <!-- Selecteur entreprise (super_admin) -->
    <AppCard v-if="isSuperAdmin">
      <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Entreprise</label>
      <AppSelect
        v-model="selectedCompanyId"
        :options="[{ label: 'Selectionner une entreprise...', value: '' }, ...companyOptions]"
      />
    </AppCard>

    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Liste des regles -->
      <AppCard class="lg:col-span-2">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200">Regles configurees</h3>
          <AppButton variant="ghost" size="sm" :disabled="!selectedCompanyId" @click="addRule">
            <PlusIcon class="mr-1 h-4 w-4" /> Ajouter une regle
          </AppButton>
        </div>

        <div v-if="isLoading" class="space-y-2">
          <AppSkeleton v-for="i in 3" :key="i" height="4rem" />
        </div>

        <div
          v-else-if="!selectedCompanyId"
          class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          Selectionnez une entreprise pour configurer ses regles
        </div>

        <div
          v-else-if="rules.length === 0"
          class="rounded-lg border border-dashed border-gray-300 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"
        >
          Aucune regle definie. Ajoutez-en une pour commencer.
        </div>

        <ul v-else class="space-y-3">
          <li
            v-for="(r, i) in rules"
            :key="i"
            class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Tolerance (min)</label>
                <AppInput v-model.number="r.toleranceMinutes" type="number" min="0" />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Seuil retard (min)</label>
                <AppInput v-model.number="r.minutesThreshold" type="number" min="1" />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Penalite</label>
                <AppInput v-model.number="r.penaltyValue" type="number" min="0" />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Type</label>
                <AppSelect v-model="r.penaltyType" :options="penaltyTypeOptions" />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Application</label>
                <div class="flex items-center gap-2">
                  <AppSelect v-model="r.applyPer" :options="applyPerOptions" class="flex-1" />
                  <button
                    type="button"
                    class="rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                    aria-label="Supprimer la regle"
                    @click="removeRule(i)"
                  >
                    <TrashIcon class="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </li>
        </ul>

        <div v-if="selectedCompanyId" class="mt-4 flex justify-end">
          <AppButton variant="primary" :loading="isSaving" @click="save">
            Enregistrer les regles
          </AppButton>
        </div>
      </AppCard>

      <!-- Simulation -->
      <AppCard>
        <div class="mb-3 flex items-center gap-2">
          <ClockIcon class="h-5 w-5 text-primary-700" />
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200">Simulation employe temoin</h3>
        </div>

        <div class="space-y-3">
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Salaire mensuel (FCFA)</label>
            <AppInput v-model.number="witnessSalary" type="number" min="0" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Retard simule (minutes)</label>
            <AppInput v-model.number="witnessLatenessMinutes" type="number" min="0" />
          </div>
        </div>

        <div class="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
          <p class="text-xs uppercase text-gray-500 dark:text-gray-400">Deduction totale</p>
          <p class="mt-1 text-2xl font-bold text-red-600">
            -{{ formatCurrency(simulationTotal) }}
          </p>
          <ul v-if="simulationBreakdown.length > 0" class="mt-3 space-y-1 text-xs text-gray-600 dark:text-gray-300">
            <li v-for="(l, i) in simulationBreakdown" :key="i" class="flex justify-between gap-2">
              <span>{{ l.label }}</span>
              <span class="font-mono">-{{ formatCurrency(l.deduction) }}</span>
            </li>
          </ul>
          <p
            v-else-if="rules.length > 0"
            class="mt-2 text-xs text-gray-400"
          >
            Aucune regle ne s'applique a ce cas
          </p>
        </div>
      </AppCard>
    </div>
  </div>
</template>
