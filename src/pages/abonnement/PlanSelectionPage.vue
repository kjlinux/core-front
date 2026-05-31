<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useSubscriptionStore } from '@/stores/subscription.store'
import { PLAN_LABELS, PLAN_FEATURES, FEATURE_LABELS } from '@/config/plan-features'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { formatCurrency } from '@/utils/format'
import { useToast } from '@/composables/useToast'
import { extractApiErrorMessage } from '@/utils/api-error'
import type { PlanCode, PlanFeature } from '@/types/subscription'

const route = useRoute()
const store = useSubscriptionStore()
const toast = useToast()
const { t, locale } = useI18n()

const highlightedFeature = computed(() => route.query.feature as PlanFeature | undefined)
const plans: PlanCode[] = ['freemium', 'garantie', 'premium']

const REQUIRES_WARRANTY: Record<PlanCode, boolean> = {
  freemium: false,
  garantie: true,
  premium: true,
}

onMounted(async () => {
  await Promise.all([store.fetchPlans(), store.fetchMe()])
  // Devis autoritatif (montant exact débité) pour les plans payants éligibles à un upgrade.
  if (store.state?.is_active) {
    await Promise.all(
      plans
        .filter((code) => code !== 'freemium' && !isCurrent(code))
        .map((code) => store.fetchQuote(code).catch(() => {})),
    )
  }
})

function isCurrent(code: PlanCode) { return store.state?.subscription === code }
function prorata(code: PlanCode) { return store.computeProrata(code) }
function quoteFor(code: PlanCode) { return store.quotes[code] ?? null }
function isBlocked(code: PlanCode): boolean {
  return REQUIRES_WARRANTY[code] && !!store.state && !store.state.is_warranty_active
}

async function selectPlan(code: PlanCode) {
  if (isCurrent(code) || isBlocked(code)) return
  try {
    const isActive = store.state?.is_active
    const r = isActive ? await store.upgrade(code) : await store.subscribe(code)
    if (r.payment_url) window.location.href = r.payment_url
    else if (r.scheduled_at) toast.success(t('toast.abonnement.changeScheduled', { date: new Date(r.scheduled_at).toLocaleDateString(locale.value === 'fr' ? 'fr-FR' : 'en-US') }))
  } catch (e) {
    toast.error(extractApiErrorMessage(e))
  }
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">Choisir un abonnement</h1>
    <div v-if="highlightedFeature" class="bg-amber-50 border border-amber-200 rounded p-4 text-sm text-amber-800">
      La fonctionnalité <strong>{{ FEATURE_LABELS[highlightedFeature] }}</strong> nécessite un abonnement supérieur.
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <AppCard
        v-for="code in plans"
        :key="code"
        :class="['flex flex-col', isCurrent(code) ? 'ring-2 ring-primary-500' : '']"
      >
        <div class="text-sm uppercase tracking-wider text-gray-500 mb-1">{{ PLAN_LABELS[code] }}</div>
        <div class="text-3xl font-bold mb-1">{{ formatCurrency(store.priceOf(code)) }}</div>
        <div class="text-sm text-gray-500 mb-4">/ mois</div>

        <ul class="space-y-1 text-sm flex-1 mb-4">
          <li v-for="(f, idx) in (PLAN_FEATURES[code] as PlanFeature[])" :key="idx" class="flex items-start gap-1.5">
            <span class="text-green-600">✓</span>
            <span :class="f === highlightedFeature ? 'font-semibold text-amber-700' : ''">{{ FEATURE_LABELS[f] }}</span>
          </li>
        </ul>

        <div v-if="!isCurrent(code) && code !== 'freemium' && store.state?.is_active" class="text-xs text-gray-500 mb-2">
          <template v-if="quoteFor(code)">
            Prorata calculé : <strong>{{ formatCurrency(quoteFor(code)!.amount_xof) }}</strong>
            ({{ quoteFor(code)!.days_remaining }} jours restants)
          </template>
          <template v-else>
            Prorata estimé : <strong>{{ formatCurrency(prorata(code).amount) }}</strong>
            ({{ prorata(code).daysRemaining }} jours restants)
          </template>
        </div>

        <div v-if="isBlocked(code)" class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mb-2">
          Ce plan nécessite une garantie matérielle active. Contactez votre technicien.
        </div>

        <AppButton
          :variant="isCurrent(code) ? 'secondary' : 'primary'"
          :disabled="isCurrent(code) || isBlocked(code)"
          @click="selectPlan(code)"
        >
          {{ isCurrent(code) ? 'Plan actuel' : (code === 'freemium' ? 'Rétrograder' : 'Choisir ce plan') }}
        </AppButton>
      </AppCard>
    </div>
  </div>
</template>
