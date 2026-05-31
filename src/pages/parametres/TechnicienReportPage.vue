<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTechnicienReport } from '@/composables/useTechnicienReport'
import { useAuthStore } from '@/stores/auth.store'
import { useActiveCompanyStore } from '@/stores/active-company.store'
import { useCompanyStore } from '@/stores/company.store'
import { companyApi } from '@/services/api/company.api'
import { extractApiErrorMessage } from '@/utils/api-error'
import { useToast } from '@/composables/useToast'
import { UserRole } from '@/types/enums'
import type { Company } from '@/types'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSelect from '@/components/ui/AppSelect.vue'

const { t } = useI18n()
const auth = useAuthStore()
const activeCompanyStore = useActiveCompanyStore()
const companyStore = useCompanyStore()
const toast = useToast()
const { isLoading, reportData, buildReport, signAndGeneratePdf } = useTechnicienReport()

const isSuperAdmin = computed(() => auth.user?.role === UserRole.SUPER_ADMIN)
const selectedCompanyId = ref<string>(activeCompanyStore.activeCompanyId ?? '')
const isSelectingCompany = ref(false)

// --- Garantie materielle ---
const warrantyCompany = ref<Company | null>(null)
const warrantyLoading = ref(false)

const targetCompanyId = computed(() =>
  isSuperAdmin.value ? selectedCompanyId.value : (activeCompanyStore.activeCompanyId ?? ''),
)

async function loadWarranty() {
  if (!targetCompanyId.value) {
    warrantyCompany.value = null
    return
  }
  try {
    warrantyCompany.value = await companyApi.getById(targetCompanyId.value)
  } catch {
    warrantyCompany.value = null
  }
}

async function activateWarranty() {
  if (!targetCompanyId.value) return
  warrantyLoading.value = true
  try {
    warrantyCompany.value = await companyApi.activateWarranty(targetCompanyId.value)
    toast.success(t('common.success'), 'Garantie activée (12 mois, renouvellement automatique)')
  } catch (e) {
    toast.error(t('common.error'), extractApiErrorMessage(e))
  } finally {
    warrantyLoading.value = false
  }
}

async function stopWarranty() {
  if (!targetCompanyId.value) return
  warrantyLoading.value = true
  try {
    warrantyCompany.value = await companyApi.stopWarranty(targetCompanyId.value)
    toast.success(t('common.success'), 'Garantie arrêtée')
  } catch (e) {
    toast.error(t('common.error'), extractApiErrorMessage(e))
  } finally {
    warrantyLoading.value = false
  }
}

const companyOptions = computed(() =>
  companyStore.companies.map((c) => ({ label: c.name, value: c.id })),
)

const canGenerate = computed(() => {
  if (isSuperAdmin.value) return !!selectedCompanyId.value
  return activeCompanyStore.hasActiveCompany
})

async function selectAndGenerate() {
  if (isSuperAdmin.value && selectedCompanyId.value) {
    isSelectingCompany.value = true
    try {
      const company = companyStore.companies.find((c) => c.id === selectedCompanyId.value)
      await activeCompanyStore.selectCompany(selectedCompanyId.value, company?.name)
    } finally {
      isSelectingCompany.value = false
    }
  }
  await Promise.all([buildReport(), loadWarranty()])
}

const statusVariant: Record<string, 'success' | 'warning' | 'danger'> = {
  ok: 'success',
  warning: 'warning',
  error: 'danger',
}

const statusLabel = computed<Record<string, string>>(() => ({
  ok: t('parametres.statusOk'),
  warning: t('parametres.statusIncomplete'),
  error: t('parametres.statusProblem'),
}))

onMounted(async () => {
  if (isSuperAdmin.value) {
    await companyStore.fetchCompanies({ perPage: 200 })
    // Si le super admin a deja une entreprise active, generer automatiquement
    if (activeCompanyStore.hasActiveCompany) {
      selectedCompanyId.value = activeCompanyStore.activeCompanyId ?? ''
      await Promise.all([buildReport(), loadWarranty()])
    }
  } else {
    await Promise.all([buildReport(), loadWarranty()])
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('parametres.techReportTitle') }}</h1>
        <p class="mt-1 text-sm text-gray-500">
          {{ t('parametres.techReportSubtitle') }}
        </p>
      </div>
      <div class="flex gap-3">
        <AppButton variant="ghost" :disabled="isLoading || isSelectingCompany" @click="selectAndGenerate">
          {{ t('common.refresh') }}
        </AppButton>
        <AppButton
          v-if="reportData"
          variant="primary"
          :disabled="isLoading"
          @click="signAndGeneratePdf(reportData!)"
        >
          {{ t('parametres.downloadPdf') }}
        </AppButton>
      </div>
    </div>

    <!-- Selecteur d'entreprise pour le super admin -->
    <AppCard v-if="isSuperAdmin">
      <div class="flex items-end gap-4">
        <div class="flex-1">
          <label class="mb-1 block text-sm font-medium text-gray-700">
            Entreprise à auditer
          </label>
          <AppSelect
            v-model="selectedCompanyId"
            :options="[{ label: 'Sélectionner une entreprise...', value: '' }, ...companyOptions]"
            placeholder="Sélectionner une entreprise"
          />
        </div>
        <AppButton
          variant="primary"
          :disabled="!selectedCompanyId || isLoading || isSelectingCompany"
          @click="selectAndGenerate"
        >
          Générer le rapport
        </AppButton>
      </div>
    </AppCard>

    <!-- Garantie materielle : conditionne l'acces aux plans garantie/premium de l'entreprise -->
    <AppCard v-if="targetCompanyId">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 class="font-semibold text-gray-900">Garantie matérielle</h3>
          <p class="mt-0.5 text-sm text-gray-500">
            Active la garantie pour permettre à cette entreprise de souscrire un abonnement Garantie ou Premium.
          </p>
          <div v-if="warrantyCompany" class="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <AppBadge :variant="warrantyCompany.isWarrantyActive ? 'success' : 'neutral'">
              {{ warrantyCompany.isWarrantyActive ? 'Garantie active' : 'Aucune garantie' }}
            </AppBadge>
            <span v-if="warrantyCompany.warrantyAutoRenew" class="text-gray-500">
              Renouvellement automatique
            </span>
            <span v-if="warrantyCompany.isWarrantyActive && warrantyCompany.warrantyEndsAt" class="text-gray-400">
              · Échéance : {{ new Date(warrantyCompany.warrantyEndsAt).toLocaleDateString('fr-FR') }}
            </span>
          </div>
        </div>
        <div class="flex shrink-0 gap-2">
          <AppButton
            v-if="!warrantyCompany?.isWarrantyActive"
            variant="primary"
            :loading="warrantyLoading"
            @click="activateWarranty"
          >
            Activer la garantie
          </AppButton>
          <AppButton
            v-else
            variant="outline"
            :loading="warrantyLoading"
            @click="stopWarranty"
          >
            Arrêter la garantie
          </AppButton>
        </div>
      </div>
    </AppCard>

    <div v-if="isLoading || isSelectingCompany" class="flex flex-col items-center justify-center py-20 text-gray-500">
      <div class="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-600" />
      <p class="text-sm">{{ t('parametres.collecting') }}</p>
    </div>

    <!-- Message si super admin n'a pas encore choisi d'entreprise -->
    <div
      v-else-if="isSuperAdmin && !canGenerate && !reportData"
      class="rounded-lg border border-dashed border-gray-300 p-16 text-center text-gray-400"
    >
      Sélectionnez une entreprise pour générer le rapport de mise en service
    </div>

    <template v-else-if="reportData">
      <!-- Score global -->
      <AppCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">{{ t('parametres.globalScore') }}</p>
            <p class="mt-1 text-4xl font-bold text-gray-900">{{ reportData.globalScore }}%</p>
            <p class="mt-1 text-sm text-gray-500">
              {{ reportData.sections.filter((s) => s.status === 'ok').length }} /
              {{ reportData.sections.length }} {{ t('parametres.completedSections') }}
            </p>
          </div>
          <div class="text-right text-sm text-gray-500">
            <p class="font-medium text-gray-700">{{ reportData.technicienName }}</p>
            <p>{{ reportData.companyName }}</p>
            <p class="mt-1 text-xs">{{ reportData.generatedAt }}</p>
          </div>
        </div>

        <div class="mt-4 h-2 w-full rounded-full bg-gray-200">
          <div
            class="h-2 rounded-full bg-primary transition-all duration-500"
            :style="{ width: `${reportData.globalScore}%` }"
          />
        </div>
      </AppCard>

      <!-- Sections -->
      <div class="grid gap-4 sm:grid-cols-2">
        <AppCard
          v-for="section in reportData.sections"
          :key="section.title"
        >
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-semibold text-gray-900">{{ section.title }}</h3>
              <p class="mt-0.5 text-sm text-gray-500">
                {{ section.done }} / {{ section.total }} {{ t('parametres.done') }}
              </p>
            </div>
            <AppBadge :variant="statusVariant[section.status]">
              {{ statusLabel[section.status] }}
            </AppBadge>
          </div>

          <div class="mt-3 h-1.5 w-full rounded-full bg-gray-200">
            <div
              class="h-1.5 rounded-full bg-primary transition-all duration-300"
              :style="{ width: section.total > 0 ? `${Math.round((section.done / section.total) * 100)}%` : '0%' }"
            />
          </div>

          <ul v-if="section.issues.length > 0" class="mt-3 space-y-1">
            <li
              v-for="(issue, i) in section.issues.slice(0, 5)"
              :key="i"
              class="text-xs text-gray-600"
            >
              • {{ issue }}
            </li>
            <li v-if="section.issues.length > 5" class="text-xs italic text-gray-400">
              ... et {{ section.issues.length - 5 }} autre(s) point(s)
            </li>
          </ul>
          <p v-else class="mt-3 text-xs text-gray-500">
            {{ t('parametres.allComplete') }}
          </p>
        </AppCard>
      </div>

      <p class="text-center text-xs text-gray-400">
        {{ t('parametres.autoReportNote') }}
      </p>
    </template>
  </div>
</template>
