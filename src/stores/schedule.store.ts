import { ref } from 'vue'
import { defineStore } from 'pinia'
import { scheduleApi } from '@/services/api/schedule.api'
import type { Schedule, Holiday } from '@/types'

export const useScheduleStore = defineStore('schedule', () => {
  const schedules = ref<Schedule[]>([])
  const holidays = ref<Holiday[]>([])
  const currentSchedule = ref<Schedule | null>(null)
  const isLoading = ref(false)

  async function fetchScheduleById(id: string) {
    isLoading.value = true
    try {
      const response = await scheduleApi.getById(id)
      currentSchedule.value = response.data
      return response.data
    } finally {
      isLoading.value = false
    }
  }

  async function fetchSchedules() {
    isLoading.value = true
    try {
      const response = await scheduleApi.getAll()
      schedules.value = response.data
    } finally {
      isLoading.value = false
    }
  }

  async function createSchedule(data: Partial<Schedule>) {
    isLoading.value = true
    try {
      const response = await scheduleApi.create(data)
      const created = response.data
      schedules.value.push(created)
      return created
    } finally {
      isLoading.value = false
    }
  }

  async function updateSchedule(id: string, data: Partial<Schedule>) {
    isLoading.value = true
    try {
      const response = await scheduleApi.update(id, data)
      const updated = response.data
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

  async function fetchHolidays() {
    isLoading.value = true
    try {
      const response = await scheduleApi.getHolidays()
      holidays.value = response.data
    } finally {
      isLoading.value = false
    }
  }

  async function createHoliday(data: Partial<Holiday>) {
    isLoading.value = true
    try {
      const response = await scheduleApi.createHoliday(data)
      const created = response.data
      holidays.value.push(created)
      return created
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

  return { schedules, holidays, currentSchedule, isLoading, fetchScheduleById, fetchSchedules, createSchedule, updateSchedule, deleteSchedule, fetchHolidays, createHoliday, deleteHoliday }
})
