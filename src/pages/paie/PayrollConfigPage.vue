<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { usePayrollStore } from '@/stores/payroll.store'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import type { LatenessRule } from '@/types/payroll'

const authStore = useAuthStore()
const payrollStore = usePayrollStore()
const toast = useToast()

const companyId = computed(() => authStore.user?.companyId ?? '')

const form = ref({
  defaultPaymentMode: 'monthly' as string,
  standardDailyHours: 8,
  workingDaysPerMonth: 26,
  paymentDay: 28,
  latenessDeductionEnabled: true,
  overtimeEnabled: false,
  overtimeRate: 1.25,
})

const latenessRules = ref<Omit<LatenessRule, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>[]>([])

const paymentModeOptions = [
  { label: 'Mensuel', value: 'monthly' },
  { label: 'Horaire', value: 'hourly' },
  { label: 'Journalier', value: 'daily' },
  { label: 'Hebdomadaire', value: 'weekly' },
  { label: 'Forfait', value: 'forfait' },
]

const penaltyTypeOptions = [
  { label: 'Montant fixe (FCFA)', value: 'fixed' },
  { label: 'Pourcentage (%)', value: 'percentage' },
]

const applyPerOptions = [
  { label: 'Par occurrence', value: 'occurrence' },
  { label: 'Par tranche', value: 'tranche' },
]

function addRule() {
  latenessRules.value.push({
    toleranceMinutes: 5,
    minutesThreshold: 15,
    penaltyValue: 1000,
    penaltyType: 'fixed',
    applyPer: 'occurrence',
  })
}

function removeRule(index: number) {
  latenessRules.value.splice(index, 1)
}

async function saveConfig() {
  try {
    await payrollStore.saveConfig(companyId.value, {
      defaultPaymentMode: form.value.defaultPaymentMode as any,
      standardDailyHours: form.value.standardDailyHours,
      workingDaysPerMonth: form.value.workingDaysPerMonth,
      paymentDay: form.value.paymentDay,
      latenessDeductionEnabled: form.value.latenessDeductionEnabled,
      overtimeEnabled: form.value.overtimeEnabled,
      overtimeRate: form.value.overtimeRate,
    })
    toast.showSuccess('Configuration de paie enregistrée')
  } catch {
    toast.showError('Erreur lors de l\'enregistrement')
  }
}

async function saveRules() {
  try {
    await payrollStore.saveLatenessRules(companyId.value, latenessRules.value)
    toast.showSuccess('Règles de pénalité enregistrées')
  } catch {
    toast.showError('Erreur lors de l\'enregistrement des règles')
  }
}

onMounted(async () => {
  if (!companyId.value) return
  await payrollStore.fetchConfig(companyId.value)
  const config = payrollStore.config
  if (config) {
    form.value.defaultPaymentMode = config.defaultPaymentMode
    form.value.standardDailyHours = config.standardDailyHours
    form.value.workingDaysPerMonth = config.workingDaysPerMonth
    form.value.paymentDay = config.paymentDay
    form.value.latenessDeductionEnabled = config.latenessDeductionEnabled
    form.value.overtimeEnabled = config.overtimeEnabled
    form.value.overtimeRate = config.overtimeRate
    latenessRules.value = config.latenessRules.map((r) => ({
      toleranceMinutes: r.toleranceMinutes,
      minutesThreshold: r.minutesThreshold,
      penaltyValue: r.penaltyValue,
      penaltyType: r.penaltyType,
      applyPer: r.applyPer,
    }))
  }
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Configuration de la paie</h1>
      <p class="text-sm text-gray-500 mt-1">
        Définissez les paramètres de rémunération et les règles de pénalité retard
      </p>
    </div>

    <div v-if="payrollStore.isLoading" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>

    <template v-else>
      <!-- Parametres generaux -->
      <AppCard title="Paramètres généraux">
        <div class="space-y-5 max-w-lg">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Mode de rémunération par défaut
            </label>
            <AppSelect
              v-model="form.defaultPaymentMode"
              :options="paymentModeOptions"
              placeholder="Choisir un mode"
            />
            <p class="text-xs text-gray-400 mt-1">Appliqué aux nouveaux employés si non spécifié</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Heures / jour standard</label>
              <AppInput v-model.number="form.standardDailyHours" type="number" :min="1" :max="24" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Jours ouvrables / mois</label>
              <AppInput v-model.number="form.workingDaysPerMonth" type="number" :min="1" :max="31" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Jour de versement de la paie</label>
            <AppInput v-model.number="form.paymentDay" type="number" :min="1" :max="31" />
            <p class="text-xs text-gray-400 mt-1">Jour du mois (ex : 28 pour le 28 de chaque mois)</p>
          </div>

          <!-- Heures supplementaires -->
          <div class="border-t border-gray-100 pt-4">
            <div class="flex items-center justify-between mb-3">
              <div>
                <p class="text-sm font-medium text-gray-700">Heures supplémentaires</p>
                <p class="text-xs text-gray-400">Calculer et rémunérer les heures sup</p>
              </div>
              <AppToggle v-model="form.overtimeEnabled" />
            </div>
            <div v-if="form.overtimeEnabled">
              <label class="block text-sm font-medium text-gray-700 mb-1">Taux majoré</label>
              <div class="flex items-center gap-2">
                <AppInput v-model.number="form.overtimeRate" type="number" :min="1" :step="0.05" class="w-32" />
                <span class="text-sm text-gray-500">× le taux horaire normal (ex: 1.25 = +25%)</span>
              </div>
            </div>
          </div>

          <AppButton variant="primary" :loading="payrollStore.isLoading" @click="saveConfig">
            Enregistrer la configuration
          </AppButton>
        </div>
      </AppCard>

      <!-- Penalites retard -->
      <AppCard title="Règles de pénalité retard">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Activer les déductions automatiques pour retard</p>
            </div>
            <AppToggle v-model="form.latenessDeductionEnabled" />
          </div>

          <div v-if="form.latenessDeductionEnabled" class="space-y-4">
            <p class="text-xs text-gray-500">
              Chaque règle definit : au-dela de X minutes de retard cumulé, deduire Y FCFA ou Y% du salaire.
            </p>

            <!-- Tableau des regles -->
            <div v-if="latenessRules.length > 0" class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200 text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tolerance (min)</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Seuil (min)</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Penalite</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Appliquer</th>
                    <th class="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="(rule, index) in latenessRules" :key="index">
                    <td class="px-3 py-2">
                      <AppInput
                        :model-value="rule.toleranceMinutes.toString()"
                        @update:model-value="rule.toleranceMinutes = Number($event)"
                        type="number"
                        :min="0"
                        class="w-20"
                      />
                    </td>
                    <td class="px-3 py-2">
                      <AppInput
                        :model-value="rule.minutesThreshold.toString()"
                        @update:model-value="rule.minutesThreshold = Number($event)"
                        type="number"
                        :min="1"
                        class="w-20"
                      />
                    </td>
                    <td class="px-3 py-2">
                      <AppInput
                        :model-value="rule.penaltyValue.toString()"
                        @update:model-value="rule.penaltyValue = Number($event)"
                        type="number"
                        :min="0"
                        class="w-24"
                      />
                    </td>
                    <td class="px-3 py-2">
                      <AppSelect
                        :model-value="rule.penaltyType"
                        @update:model-value="rule.penaltyType = $event as any"
                        :options="penaltyTypeOptions"
                        class="w-40"
                      />
                    </td>
                    <td class="px-3 py-2">
                      <AppSelect
                        :model-value="rule.applyPer"
                        @update:model-value="rule.applyPer = $event as any"
                        :options="applyPerOptions"
                        class="w-36"
                      />
                    </td>
                    <td class="px-3 py-2">
                      <button
                        type="button"
                        class="text-red-500 hover:text-red-700 text-xs font-medium"
                        @click="removeRule(index)"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else class="text-sm text-gray-400 py-4 text-center">
              Aucune règle definie. Ajoutez une règle ci-dessous.
            </div>

            <div class="flex gap-3">
              <AppButton variant="secondary" size="sm" @click="addRule">
                + Ajouter une règle
              </AppButton>
              <AppButton
                variant="primary"
                size="sm"
                :loading="payrollStore.isLoading"
                @click="saveRules"
              >
                Enregistrer les règles
              </AppButton>
            </div>
          </div>
        </div>
      </AppCard>
    </template>
  </div>
</template>
