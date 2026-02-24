import { ref } from 'vue'
import { defineStore } from 'pinia'
import { employeeApi } from '@/services/api/employee.api'
import type { Employee } from '@/types'
import type { EmployeeFilters } from '@/services/api/employee.api'

export const useEmployeeStore = defineStore('employee', () => {
  const employees = ref<Employee[]>([])
  const currentEmployee = ref<Employee | null>(null)
  const isLoading = ref(false)
  const filters = ref<EmployeeFilters>({
    page: 1,
    perPage: 10,
  })
  const pagination = ref({
    currentPage: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
  })

  async function fetchEmployees(newFilters?: Partial<EmployeeFilters>) {
    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters }
    }
    isLoading.value = true
    try {
      employees.value = await employeeApi.getAll(filters.value)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchEmployee(id: string) {
    isLoading.value = true
    try {
      currentEmployee.value = await employeeApi.getById(id)
    } finally {
      isLoading.value = false
    }
  }

  async function createEmployee(data: Partial<Employee>) {
    isLoading.value = true
    try {
      const created = await employeeApi.create(data)
      employees.value.push(created)
      return created
    } finally {
      isLoading.value = false
    }
  }

  async function updateEmployee(id: string, data: Partial<Employee>) {
    isLoading.value = true
    try {
      const updated = await employeeApi.update(id, data)
      const index = employees.value.findIndex((e) => e.id === id)
      if (index !== -1) {
        employees.value[index] = updated
      }
      if (currentEmployee.value?.id === id) {
        currentEmployee.value = updated
      }
      return updated
    } finally {
      isLoading.value = false
    }
  }

  async function deleteEmployee(id: string) {
    isLoading.value = true
    try {
      await employeeApi.delete(id)
      employees.value = employees.value.filter((e) => e.id !== id)
      if (currentEmployee.value?.id === id) {
        currentEmployee.value = null
      }
    } finally {
      isLoading.value = false
    }
  }

  return { employees, currentEmployee, isLoading, filters, pagination, fetchEmployees, fetchEmployee, createEmployee, updateEmployee, deleteEmployee }
})
