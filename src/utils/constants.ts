export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'

export const USE_MOCK: boolean = import.meta.env.VITE_USE_MOCK === 'true'

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin_enterprise: 'Admin Entreprise',
  manager: 'Manager',
}

export const CARD_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  blocked: 'Bloquee',
  lost: 'Perdue',
}

export const CARD_STATUS_COLORS: Record<string, string> = {
  active: 'green',
  inactive: 'gray',
  blocked: 'red',
  lost: 'orange',
}

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  present: 'Present',
  absent: 'Absent',
  late: 'En retard',
  left_early: 'Parti tot',
}

export const SATISFACTION_LABELS: Record<string, string> = {
  bon: 'Bon',
  neutre: 'Neutre',
  mauvais: 'Mauvais',
}

export const SATISFACTION_COLORS: Record<string, string> = {
  bon: '#22c55e',
  neutre: '#f59e0b',
  mauvais: '#ef4444',
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmee',
  processing: 'En traitement',
  shipped: 'Expediee',
  delivered: 'Livree',
  cancelled: 'Annulee',
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  mobile_money: 'Mobile Money',
  bank_card: 'Carte bancaire',
  manual: 'Paiement manuel',
}

export const CURRENCY = 'XOF'

export const PER_PAGE_OPTIONS = [10, 25, 50, 100] as const

export const DEFAULT_PER_PAGE = 10
