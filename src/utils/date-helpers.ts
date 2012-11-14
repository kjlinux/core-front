import dayjs from 'dayjs'

/**
 * Checks if a given date falls on a work day.
 * @param date - ISO date string
 * @param workDays - Array of day numbers (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export function isWorkDay(date: string, workDays: number[]): boolean {
  const dayOfWeek = dayjs(date).day()
  return workDays.includes(dayOfWeek)
}

/**
 * Counts the number of work days within a date range (inclusive).
 * @param start - ISO date string for range start
 * @param end - ISO date string for range end
 * @param workDays - Array of day numbers (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export function getWorkDaysInRange(start: string, end: string, workDays: number[]): number {
  let count = 0
  let current = dayjs(start)
  const endDate = dayjs(end)

  while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
    if (workDays.includes(current.day())) {
      count++
    }
    current = current.add(1, 'day')
  }

  return count
}

/**
 * Checks if a given date is a holiday.
 * @param date - ISO date string
 * @param holidays - Array of holiday objects with a date property (ISO string)
 */
export function isHoliday(date: string, holidays: { date: string }[]): boolean {
  const target = dayjs(date).format('YYYY-MM-DD')
  return holidays.some((h) => dayjs(h.date).format('YYYY-MM-DD') === target)
}
