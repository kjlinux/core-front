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

export function formatCurrency(amount: number, currency: string = CURRENCY): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
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
