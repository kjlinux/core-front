import type { PlanCode, PlanFeature } from '@/types/subscription'

/**
 * Source de verite single-source pour le feature gating frontend.
 * Refléte la grille tarifaire 2026 (cf. plan d'implementation §3).
 */
export const PLAN_FEATURES: Record<PlanCode, PlanFeature[]> = {
  freemium: ['dashboard', 'export_raw'],
  garantie: [
    'dashboard',
    'export_raw',
    'firmware_updates',
    'platform_updates',
    'payroll',
    'hr_reports',
    'dedicated_support',
    'sav_included',
  ],
  premium: [
    'dashboard',
    'export_raw',
    'firmware_updates',
    'platform_updates',
    'payroll',
    'hr_reports',
    'dedicated_support',
    'sav_included',
    'advanced_analytics',
    'field_visits',
  ],
}

export const PLAN_LABELS: Record<PlanCode, string> = {
  freemium: 'Freemium',
  garantie: 'Abonnement Garantie',
  premium: 'Abonnement Premium',
}

export const PLAN_PRICES_XOF: Record<PlanCode, number> = {
  freemium: 0,
  garantie: 15000,
  premium: 30000,
}

export const FEATURE_LABELS: Record<PlanFeature, string> = {
  dashboard: 'Dashboard de présences',
  export_raw: 'Export des données brutes',
  firmware_updates: 'Mises à jour firmware OTA',
  platform_updates: 'Mises à jour plateforme',
  payroll: 'Gestion de la paie',
  hr_reports: 'Rapports RH automatisés',
  dedicated_support: 'Support client dédié',
  sav_included: 'SAV inclus',
  advanced_analytics: 'Analytics avancés',
  field_visits: 'Visites terrain mensuelles',
}

/**
 * Plans minimum requis pour chaque feature (utilise par les guards de route).
 */
export const FEATURE_MIN_PLANS: Record<PlanFeature, PlanCode[]> = {
  dashboard: ['freemium', 'garantie', 'premium'],
  export_raw: ['freemium', 'garantie', 'premium'],
  firmware_updates: ['garantie', 'premium'],
  platform_updates: ['garantie', 'premium'],
  payroll: ['garantie', 'premium'],
  hr_reports: ['garantie', 'premium'],
  dedicated_support: ['garantie', 'premium'],
  sav_included: ['garantie', 'premium'],
  advanced_analytics: ['premium'],
  field_visits: ['premium'],
}
