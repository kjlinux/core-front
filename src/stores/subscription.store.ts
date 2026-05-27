import { defineStore } from 'pinia'
import { ref } from 'vue'
import { subscriptionApi } from '@/services/api/subscription.api'
import { PLAN_PRICES_XOF } from '@/config/plan-features'
import type {
  PlanCode,
  SubscriptionPlanDef,
  SubscriptionState,
  SubscriptionPayment,
  InitiatePaymentResult,
} from '@/types/subscription'

export const useSubscriptionStore = defineStore('subscription', () => {
  const state = ref<SubscriptionState | null>(null)
  const plans = ref<SubscriptionPlanDef[]>([])
  const payments = ref<SubscriptionPayment[]>([])
  const isLoading = ref(false)

  async function fetchPlans() {
    try {
      plans.value = await subscriptionApi.plans()
    } catch {
      // plans non disponibles — on garde le tableau vide
    }
  }

  async function fetchMe() {
    isLoading.value = true
    try {
      state.value = await subscriptionApi.me()
    } finally {
      isLoading.value = false
    }
  }

  async function fetchHistory() {
    const r = await subscriptionApi.history()
    payments.value = r.data
  }

  async function subscribe(planCode: PlanCode): Promise<InitiatePaymentResult> {
    const r = await subscriptionApi.subscribe(planCode)
    await fetchMe()
    return r
  }
  async function upgrade(planCode: PlanCode): Promise<InitiatePaymentResult> {
    const r = await subscriptionApi.upgrade(planCode)
    await fetchMe()
    return r
  }
  async function payNextPeriod(): Promise<InitiatePaymentResult> {
    const r = await subscriptionApi.payNextPeriod()
    await fetchMe()
    return r
  }

  /**
   * Calcule le prorata d'un upgrade : (prix_nouveau - prix_ancien) * jours_restants / 30.
   * Renvoie 0 si downgrade ou si pas d'abonnement actif (cas premiere souscription -> plein tarif).
   */
  function computeProrata(targetPlan: PlanCode): { amount: number; daysRemaining: number; isProrata: boolean } {
    if (!state.value || !state.value.expires_at || !state.value.is_active) {
      return { amount: PLAN_PRICES_XOF[targetPlan], daysRemaining: 30, isProrata: false }
    }
    const newPrice = PLAN_PRICES_XOF[targetPlan]
    const oldPrice = PLAN_PRICES_XOF[(state.value.subscription as PlanCode)] ?? 0
    if (newPrice <= oldPrice) {
      return { amount: 0, daysRemaining: 0, isProrata: false }
    }
    const expires = new Date(state.value.expires_at).getTime()
    const now = Date.now()
    const days = Math.max(1, Math.min(30, Math.ceil((expires - now) / (1000 * 60 * 60 * 24))))
    return { amount: Math.round((newPrice - oldPrice) * days / 30), daysRemaining: days, isProrata: true }
  }

  return {
    state, plans, payments, isLoading,
    fetchPlans, fetchMe, fetchHistory,
    subscribe, upgrade, payNextPeriod,
    computeProrata,
  }
})
