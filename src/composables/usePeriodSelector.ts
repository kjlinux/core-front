import { ref, computed, type Ref, type ComputedRef } from 'vue'
import dayjs from 'dayjs'

/**
 * Sélecteur de période réutilisable pour les pages de rapport.
 *
 * Le type de période pilote automatiquement les dates de début/fin (pattern
 * éprouvé dans QrCodeReportsPage) : choisir « Mensuel » contraint la période au
 * mois civil, « Journalier » à un seul jour, « Hebdomadaire » à la semaine ISO
 * (lundi→dimanche), « Personnalisé » laisse deux dates libres.
 *
 * `startDate` / `endDate` (format YYYY-MM-DD) sont toujours dérivés et cohérents
 * avec le mode courant — les composants n'ont qu'à les envoyer à l'API.
 */
export type PeriodMode = 'daily' | 'weekly' | 'monthly' | 'custom'

export interface PeriodSelector {
  periodMode: Ref<PeriodMode>
  day: Ref<string>
  month: Ref<string>
  weekDay: Ref<string>
  customStart: Ref<string>
  customEnd: Ref<string>
  startDate: ComputedRef<string>
  endDate: ComputedRef<string>
}

/** Semaine ISO (lundi → dimanche) contenant la date donnée, sans plugin dayjs. */
function isoWeekRange(dateStr: string): { start: string; end: string } {
  const d = dayjs(dateStr)
  if (!d.isValid()) return { start: dateStr, end: dateStr }
  const diffToMonday = (d.day() + 6) % 7 // day(): 0=Dim..6=Sam → décalage vers lundi
  const monday = d.subtract(diffToMonday, 'day')
  return { start: monday.format('YYYY-MM-DD'), end: monday.add(6, 'day').format('YYYY-MM-DD') }
}

export function usePeriodSelector(initialMode: PeriodMode = 'monthly'): PeriodSelector {
  const today = dayjs()

  const periodMode = ref<PeriodMode>(initialMode)
  const day = ref(today.format('YYYY-MM-DD'))
  const month = ref(today.format('YYYY-MM'))
  const weekDay = ref(today.format('YYYY-MM-DD'))
  const customStart = ref(today.startOf('month').format('YYYY-MM-DD'))
  const customEnd = ref(today.format('YYYY-MM-DD'))

  const startDate = computed<string>(() => {
    switch (periodMode.value) {
      case 'daily':
        return day.value
      case 'weekly':
        return isoWeekRange(weekDay.value).start
      case 'monthly':
        return dayjs(`${month.value}-01`).startOf('month').format('YYYY-MM-DD')
      case 'custom':
        return customStart.value
    }
  })

  const endDate = computed<string>(() => {
    switch (periodMode.value) {
      case 'daily':
        return day.value
      case 'weekly':
        return isoWeekRange(weekDay.value).end
      case 'monthly':
        return dayjs(`${month.value}-01`).endOf('month').format('YYYY-MM-DD')
      case 'custom':
        return customEnd.value
    }
  })

  return { periodMode, day, month, weekDay, customStart, customEnd, startDate, endDate }
}
