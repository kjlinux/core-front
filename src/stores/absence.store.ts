import { ref } from 'vue'
import { defineStore } from 'pinia'
import { absenceApi } from '@/services/api/absence.api'
import type { AbsenceRequest, AbsenceRequestFilters, CreateAbsencePayload, ReviewAbsencePayload } from '@/types/absence'
import type { PaginatedResponse } from '@/types/common'

export const useAbsenceStore = defineStore('absence', () => {
  const requests = ref<AbsenceRequest[]>([])
  const myRequests = ref<AbsenceRequest[]>([])
  const currentRequest = ref<AbsenceRequest | null>(null)
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const pagination = ref({ currentPage: 1, perPage: 15, total: 0, totalPages: 1 })
  const filters = ref<AbsenceRequestFilters>({ page: 1, perPage: 15 })

  async function fetchRequests(newFilters?: Partial<AbsenceRequestFilters>) {
    if (newFilters) filters.value = { ...filters.value, ...newFilters, page: newFilters.page ?? 1 }
    isLoading.value = true
    try {
      const response: PaginatedResponse<AbsenceRequest> = await absenceApi.getAll(filters.value)
      requests.value = response.data
      if (response.meta) {
        pagination.value = {
          currentPage: response.meta.currentPage,
          perPage: response.meta.perPage,
          total: response.meta.total,
          totalPages: response.meta.totalPages,
        }
      }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchMyRequests(employeeId: string) {
    isLoading.value = true
    try {
      myRequests.value = await absenceApi.getMyRequests(employeeId)
    } finally {
      isLoading.value = false
    }
  }

  async function submitRequest(data: CreateAbsencePayload): Promise<AbsenceRequest> {
    isSubmitting.value = true
    try {
      const created = await absenceApi.create(data)
      myRequests.value.unshift(created)
      return created
    } finally {
      isSubmitting.value = false
    }
  }

  async function reviewRequest(id: string, data: ReviewAbsencePayload) {
    isSubmitting.value = true
    try {
      const updated = await absenceApi.review(id, data)
      const idx = requests.value.findIndex((r) => r.id === id)
      if (idx !== -1) requests.value[idx] = updated
      if (currentRequest.value?.id === id) currentRequest.value = updated
      return updated
    } finally {
      isSubmitting.value = false
    }
  }

  async function deleteRequest(id: string) {
    await absenceApi.delete(id)
    requests.value = requests.value.filter((r) => r.id !== id)
    myRequests.value = myRequests.value.filter((r) => r.id !== id)
  }

  function $reset() {
    requests.value = []
    myRequests.value = []
    currentRequest.value = null
    isLoading.value = false
    isSubmitting.value = false
    pagination.value = { currentPage: 1, perPage: 15, total: 0, totalPages: 1 }
    filters.value = { page: 1, perPage: 15 }
  }

  return {
    requests,
    myRequests,
    currentRequest,
    isLoading,
    isSubmitting,
    pagination,
    filters,
    fetchRequests,
    fetchMyRequests,
    submitRequest,
    reviewRequest,
    deleteRequest,
    $reset,
  }
})
