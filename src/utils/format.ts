import dayjs from 'dayjs'
import { CURRENCY } from '@/utils/constants'

export function formatDate(date: string, format: string = 'DD/MM/YYYY'): string {
  return dayjs(date).format(format)
}

export function formatDateTime(date: string): string {
  return dayjs(date).format('DD/MM/YYYY HH:mm')
}

export function formatTime(time: string): string {
  return dayjs(`1970-01-01T${time}`).format('HH:mm')
}

export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string = CURRENCY,
): string {
  const n = typeof amount === 'number' ? amount : Number(amount ?? 0)
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0)
}

/**
 * Normalise un texte avant de l'injecter dans un PDF (jsPDF).
 *
 * `Intl.NumberFormat` (locale fr) sépare les milliers avec une espace fine
 * insécable (U+202F) ou insécable (U+00A0). Les polices standard de jsPDF
 * (helvetica) ne connaissent pas ces glyphes : leur largeur est mal mesurée,
 * donc les montants alignés à droite débordent de leur colonne et un caractère
 * parasite s'affiche à la place de l'espace. On remplace toutes ces variantes
 * par une espace ASCII ordinaire, mesurable et rendue correctement.
 *
 * À n'appliquer qu'au texte destiné au PDF : dans le navigateur, l'espace
 * insécable fine est la bonne typographie française et doit être conservée.
 */
// Code points des espaces non-ASCII produites par Intl que jsPDF mesure mal
// (insecable U+00A0, fine insecable U+202F, et autres espaces typographiques).
const PDF_UNSAFE_SPACES = [0x00a0, 0x202f, 0x2007, 0x2008, 0x2009, 0x2060].map((c) =>
  String.fromCharCode(c),
)

export function sanitizePdfText(value: string | number | null | undefined): string {
  let out = String(value ?? '')
  for (const space of PDF_UNSAFE_SPACES) {
    out = out.split(space).join(' ')
  }
  return out
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours === 0) return `${remainingMinutes}min`
  if (remainingMinutes === 0) return `${hours}h`
  return `${hours}h ${remainingMinutes}min`
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}
