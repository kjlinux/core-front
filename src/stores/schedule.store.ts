import { ref } from 'vue'
import { defineStore } from 'pinia'
import { scheduleApi, type ScheduleFilters, type HolidayFilters } from '@/services/api/schedule.api'
import { normalizeSchedule } from '@/utils/schedule'
import type { Schedule, Holiday } from '@/types'

export const useScheduleStore = defineStore('schedule', () => {
  const schedules = ref<Schedule[]>([])
  const holidays = ref<Holiday[]>([])
  const currentSchedule = ref<Schedule | null>(null)
  const isLoading = ref(false)
  const pagination = ref({
    currentPage: 1,
    perPage: 15,
    total: 0,
    totalPages: 0,
  })
  const holidayPagination = ref({
    currentPage: 1,
    perPage: 15,
    total: 0,
    totalPages: 0,
  })

  async function fetchScheduleById(id: string) {
    isLoading.value = true
    try {
      const schedule = normalizeSchedule(await scheduleApi.getById(id))
      currentSchedule.value = schedule
      return schedule
    } finally {
      isLoading.value = false
    }
  }

  async function fetchSchedules(filters?: ScheduleFilters) {
    isLoading.value = true
    try {
      // Sans filtres (ex: dropdowns EmployeeCreate/Edit), on charge une page large
      // pour conserver l'ancien comportement « liste complète ».
      const params: ScheduleFilters = filters ?? { perPage: 200 }
      const response = await scheduleApi.getAll(params)
      schedules.value = response.data.map(normalizeSchedule)
      pagination.value = response.meta
    } finally {
      isLoading.value = false
    }
  }

  async function createSchedule(data: Partial<Schedule>) {
    isLoading.value = true
    try {
      const created = normalizeSchedule(await scheduleApi.create(data))
      schedules.value.push(created)
      return created
    } finally {
      isLoading.value = false
    }
  }

  async function updateSchedule(id: string, data: Partial<Schedule>) {
    isLoading.value = true
    try {
      const updated = normalizeSchedule(await scheduleApi.update(id, data))
      const index = schedules.value.findIndex((s) => s.id === id)
      if (index !== -1) {
        schedules.value[index] = updated
      }
      if (currentSchedule.value?.id === id) {
        currentSchedule.value = updated
      }
      return updated
    } finally {
      isLoading.value = false
    }
  }

  async function deleteSchedule(id: string) {
    isLoading.value = true
    try {
      await scheduleApi.delete(id)
      schedules.value = schedules.value.filter((s) => s.id !== id)
      if (currentSchedule.value?.id === id) {
        currentSchedule.value = null
      }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchHolidays(filters?: HolidayFilters) {
    isLoading.value = true
    try {
      const params: HolidayFilters = filters ?? { perPage: 200 }
      const response = await scheduleApi.getHolidays(params)
      holidays.value = response.data
      holidayPagination.value = response.meta
    } finally {
      isLoading.value = false
    }
  }

  async function createHoliday(data: Partial<Holiday>) {
    isLoading.value = true
    try {
      const created = await scheduleApi.createHoliday(data)
      holidays.value.push(created)
      return created
    } finally {
      isLoading.value = false
    }
  }

  async function updateHoliday(id: string, data: Partial<Holiday>) {
    isLoading.value = true
    try {
      const updated = await scheduleApi.updateHoliday(id, data)
      const index = holidays.value.findIndex((h) => h.id === id)
      if (index !== -1) {
        holidays.value[index] = updated
      }
      return updated
    } finally {
      isLoading.value = false
    }
  }

  async function deleteHoliday(id: string) {
    isLoading.value = true
    try {
      await scheduleApi.deleteHoliday(id)
      holidays.value = holidays.value.filter((h) => h.id !== id)
    } finally {
      isLoading.value = false
    }
  }

  return { schedules, holidays, currentSchedule, isLoading, pagination, holidayPagination, fetchScheduleById, fetchSchedules, createSchedule, updateSchedule, deleteSchedule, fetchHolidays, createHoliday, updateHoliday, deleteHoliday }
})
