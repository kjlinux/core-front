import { defineStore } from 'pinia'
import { ref } from 'vue'
import { subscriptionApi } from '@/services/api/subscription.api'
import { useToast } from '@/composables/useToast'
import { i18n } from '@/plugins/i18n'
import { PLAN_PRICES_XOF } from '@/config/plan-features'
import type {
  PlanCode,
  SubscriptionPlanDef,
  SubscriptionState,
  SubscriptionPayment,
  SubscriptionEvent,
  ProrataQuote,
  InitiatePaymentResult,
} from '@/types/subscription'

export const useSubscriptionStore = defineStore('subscription', () => {
  const state = ref<SubscriptionState | null>(null)
  const plans = ref<SubscriptionPlanDef[]>([])
  const payments = ref<SubscriptionPayment[]>([])
  const events = ref<SubscriptionEvent[]>([])
  const quotes = ref<Record<string, ProrataQuote>>({})
  const isLoading = ref(false)

  /**
   * Prix mensuel d'un plan, issu de la grille DB (fetchPlans). Fallback sur la
   * constante locale tant que les plans ne sont pas chargés.
   */
  function priceOf(code: PlanCode): number {
    const p = plans.value.find((pl) => pl.code === code)
    return p ? p.monthly_price_xof : PLAN_PRICES_XOF[code]
  }

  async function fetchPlans() {
    try {
      plans.value = await subscriptionApi.plans()
    } catch (e) {
      console.error('fetchPlans failed', e)
      useToast().error(i18n.global.t('common.error'), i18n.global.t('toast.abonnement.loadPlansError'))
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
    try {
      const r = await subscriptionApi.history()
      payments.value = r.data
    } catch (e) {
      console.error('fetchHistory failed', e)
      useToast().error(i18n.global.t('common.error'), i18n.global.t('toast.abonnement.loadHistoryError'))
    }
  }

  async function fetchEvents() {
    try {
      const r = await subscriptionApi.events()
      events.value = r.data
    } catch (e) {
      console.error('fetchEvents failed', e)
      useToast().error(i18n.global.t('common.error'), i18n.global.t('toast.abonnement.loadHistoryError'))
    }
  }

  /** Récupère le devis autoritatif (montant exact débité) pour un plan cible. */
  async function fetchQuote(planCode: PlanCode) {
    quotes.value = { ...quotes.value, [planCode]: await subscriptionApi.quote(planCode) }
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
      return { amount: priceOf(targetPlan), daysRemaining: 30, isProrata: false }
    }
    const newPrice = priceOf(targetPlan)
    const oldPrice = priceOf(state.value.subscription as PlanCode)
    if (newPrice <= oldPrice) {
      return { amount: 0, daysRemaining: 0, isProrata: false }
    }
    const expires = new Date(state.value.expires_at).getTime()
    const now = Date.now()
    const days = Math.max(1, Math.min(30, Math.ceil((expires - now) / (1000 * 60 * 60 * 24))))
    return { amount: Math.round((newPrice - oldPrice) * days / 30), daysRemaining: days, isProrata: true }
  }

  return {
    state, plans, payments, events, quotes, isLoading,
    fetchPlans, fetchMe, fetchHistory, fetchEvents, fetchQuote,
    subscribe, upgrade, payNextPeriod,
    computeProrata, priceOf,
  }
})
