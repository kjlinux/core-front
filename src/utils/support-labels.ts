/**
 * Libellés et variantes de badge FR pour le module Support IT.
 * Centralisé ici pour éviter la duplication entre les pages et garantir que les
 * statuts (alertes, santé, capteurs, plaintes) ne s'affichent jamais en anglais.
 */
import type { AlertSeverity, AlertStatus, HealthStatus } from '@/types'
import type { TicketPriority, TicketStatus } from '@/services/api/support-ticket.api'

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

// --- Alertes ----------------------------------------------------------------

export const alertStatusLabel: Record<AlertStatus, string> = {
  open: 'Ouverte',
  acknowledged: 'Reconnue',
  resolved: 'Résolue',
}

export const alertStatusVariant: Record<AlertStatus, BadgeVariant> = {
  open: 'danger',
  acknowledged: 'warning',
  resolved: 'success',
}

export const alertSeverityLabel: Record<AlertSeverity, string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Haute',
  critical: 'Critique',
}

export const alertSeverityVariant: Record<AlertSeverity, BadgeVariant> = {
  low: 'info',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
}

// --- Santé système ----------------------------------------------------------

export const healthStatusLabel: Record<HealthStatus, string> = {
  ok: 'Opérationnel',
  degraded: 'Dégradé',
  fail: 'Hors service',
}

export const healthStatusVariant: Record<HealthStatus, BadgeVariant> = {
  ok: 'success',
  degraded: 'warning',
  fail: 'danger',
}

// --- Capteurs ---------------------------------------------------------------

export const deviceKindLabel: Record<string, string> = {
  rfid: 'RFID',
  biometric: 'Biométrique',
  feelback: 'Feelback',
  qr: 'QR',
}

// --- Plaintes / tickets -----------------------------------------------------

export const ticketStatusLabel: Record<TicketStatus, string> = {
  open: 'Ouverte',
  in_progress: 'En cours',
  resolved: 'Résolue',
}

export const ticketStatusVariant: Record<TicketStatus, BadgeVariant> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
}

export const ticketPriorityLabel: Record<TicketPriority, string> = {
  low: 'Basse',
  medium: 'Normale',
  high: 'Urgente',
}

export const ticketPriorityVariant: Record<TicketPriority, BadgeVariant> = {
  low: 'neutral',
  medium: 'warning',
  high: 'danger',
}

// --- Helpers de secours (valeur inconnue -> affichage brut/neutre) ----------

export function labelOf(map: Record<string, string>, key: string | null | undefined): string {
  if (!key) return '-'
  return map[key] ?? key
}

export function variantOf(map: Record<string, BadgeVariant>, key: string | null | undefined): BadgeVariant {
  if (!key) return 'neutral'
  return map[key] ?? 'neutral'
}
