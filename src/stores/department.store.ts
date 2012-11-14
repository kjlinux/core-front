import { ref } from 'vue'
import { defineStore } from 'pinia'
import { departmentApi } from '@/services/api/department.api'
import type { Department, PaginatedResponse } from '@/types'

export const useDepartmentStore = defineStore('department', () => {
  const departments = ref<Department[]>([])
  const currentDepartment = ref<Department | null>(null)
  const isLoading = ref(false)
  const pagination = ref({
    currentPage: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
  })

  async function fetchDepartments(params?: Record<string, unknown>) {
    isLoading.value = true
    try {
      const response: PaginatedResponse<Department> = await departmentApi.getAll(params)
      departments.value = response.data
      pagination.value = response.meta
    } finally {
      isLoading.value = false
    }
  }

  async function fetchDepartment(id: string) {
    isLoading.value = true
    try {
      const response = await departmentApi.getById(id)
      currentDepartment.value = response.data
      return response.data
    } finally {
      isLoading.value = false
    }
  }

  async function createDepartment(data: Partial<Department>) {
    isLoading.value = true
    try {
      const response = await departmentApi.create(data)
      departments.value.push(response.data)
      return response.data
    } finally {
      isLoading.value = false
    }
  }

  async function updateDepartment(id: string, data: Partial<Department>) {
    isLoading.value = true
    try {
      const response = await departmentApi.update(id, data)
      const index = departments.value.findIndex((d) => d.id === id)
      if (index !== -1) {
        departments.value[index] = response.data
      }
      if (currentDepartment.value?.id === id) {
        currentDepartment.value = response.data
      }
      return response.data
    } finally {
      isLoading.value = false
    }
  }

  async function deleteDepartment(id: string) {
    isLoading.value = true
    try {
      await departmentApi.delete(id)
      departments.value = departments.value.filter((d) => d.id !== id)
      if (currentDepartment.value?.id === id) {
        currentDepartment.value = null
      }
    } finally {
      isLoading.value = false
    }
  }

  return { departments, currentDepartment, isLoading, pagination, fetchDepartments, fetchDepartment, createDepartment, updateDepartment, deleteDepartment }
})
