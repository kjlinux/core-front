import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useSubscriptionStore } from '@/stores/subscription.store'
import { PLAN_FEATURES } from '@/config/plan-features'
import type { PlanCode, PlanFeature } from '@/types/subscription'

/**
 * Acces unifie au plan d'abonnement de la compagnie active.
 * Le super_admin bypasse toujours le gating.
 */
export function usePlan() {
  const auth = useAuthStore()
  const subs = useSubscriptionStore()

  const isSuperAdmin = computed(() => auth.user?.role === 'super_admin')
  const planCode = computed<PlanCode>(() => (subs.state?.subscription as PlanCode) ?? 'freemium')
  const isExpired = computed(() => !!subs.state && !subs.state.is_active && planCode.value !== 'freemium')

  function hasFeature(feature: PlanFeature): boolean {
    if (isSuperAdmin.value) return true
    const allowed = PLAN_FEATURES[planCode.value] ?? []
    return allowed.includes(feature)
  }

  return {
    isSuperAdmin,
    planCode,
    isExpired,
    hasFeature,
    state: computed(() => subs.state),
  }
}
