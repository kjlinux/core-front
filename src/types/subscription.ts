export type PlanCode = 'freemium' | 'garantie' | 'premium'

export type PlanFeature =
  | 'dashboard'
  | 'export_raw'
  | 'firmware_updates'
  | 'platform_updates'
  | 'payroll'
  | 'hr_reports'
  | 'dedicated_support'
  | 'sav_included'
  | 'advanced_analytics'
  | 'field_visits'

export interface SubscriptionPlanDef {
  id: number
  code: PlanCode
  name: string
  monthly_price_xof: number
  features: PlanFeature[]
  requires_warranty: boolean
  is_active: boolean
  sort_order: number
}

export interface SubscriptionState {
  company_id: string
  subscription: PlanCode
  starts_at: string | null
  expires_at: string | null
  next_period_paid: boolean
  next_expires_at: string | null
  is_active: boolean
  warranty_ends_at: string | null
  is_warranty_active: boolean
  // Fonctionnalites effectivement disponibles (resolues cote backend, tiennent compte
  // de l'expiration). Source de verite du gating ; fallback sur PLAN_FEATURES si absent.
  features?: PlanFeature[]
}

export interface SubscriptionPayment {
  id: string
  company_id: string
  from_plan: PlanCode
  to_plan: PlanCode
  amount_xof: number
  is_prorata: boolean
  period_start: string | null
  period_end: string | null
  payment_method: string | null
  payment_status: 'pending' | 'paid' | 'failed'
  gateway_token: string | null
  triggered_by_superadmin: boolean
  created_at: string
  updated_at: string
}

export interface InitiatePaymentResult {
  payment_url: string | null
  token: string | null
  payment_id: string | null
  scheduled_at?: string | null
}

/** Devis autoritatif calculé côté backend pour un changement de plan. */
export interface ProrataQuote {
  amount_xof: number
  days_remaining: number
  is_prorata: boolean
}

export type SubscriptionEventType =
  | 'subscribed'
  | 'upgraded'
  | 'downgraded'
  | 'renewed'
  | 'prepaid'
  | 'rolled_over'
  | 'expired'
  | 'admin_changed'

export interface SubscriptionEvent {
  id: number
  company_id: string
  event: SubscriptionEventType
  from_plan: PlanCode | null
  to_plan: PlanCode | null
  actor_user_id: number | null
  payment_id: string | null
  notes: string | null
  created_at: string
}
