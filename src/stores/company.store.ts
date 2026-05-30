import { ref } from 'vue'
import { defineStore } from 'pinia'
import { companyApi, type CompanyFilters } from '@/services/api/company.api'
import type { Company } from '@/types'

export const useCompanyStore = defineStore('company', () => {
  const companies = ref<Company[]>([])
  const currentCompany = ref<Company | null>(null)
  const isLoading = ref(false)
  const filters = ref<CompanyFilters>({
    page: 1,
    perPage: 15,
  })
  const pagination = ref({
    currentPage: 1,
    perPage: 15,
    total: 0,
    totalPages: 0,
  })

  async function fetchCompanies(newFilters?: Partial<CompanyFilters>) {
    if (newFilters) {
      filters.value = { page: 1, perPage: filters.value.perPage, ...newFilters }
    }
    isLoading.value = true
    try {
      const response = await companyApi.getAll(filters.value)
      companies.value = response.data
      pagination.value = response.meta
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCompany(id: string) {
    isLoading.value = true
    try {
      currentCompany.value = await companyApi.getById(id)
    } finally {
      isLoading.value = false
    }
  }

  async function createCompany(data: Partial<Company>) {
    isLoading.value = true
    try {
      const created = await companyApi.create(data)
      companies.value.push(created)
      return created
    } finally {
      isLoading.value = false
    }
  }

  async function updateCompany(id: string, data: Partial<Company>) {
    isLoading.value = true
    try {
      const updated = await companyApi.update(id, data)
      const index = companies.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        companies.value[index] = updated
      }
      if (currentCompany.value?.id === id) {
        currentCompany.value = updated
      }
      return updated
    } finally {
      isLoading.value = false
    }
  }

  async function toggleActive(id: string) {
    isLoading.value = true
    try {
      const updated = await companyApi.toggleActive(id)
      const index = companies.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        companies.value[index] = updated
      }
      if (currentCompany.value?.id === id) {
        currentCompany.value = updated
      }
      return updated
    } finally {
      isLoading.value = false
    }
  }

  return { companies, currentCompany, isLoading, filters, pagination, fetchCompanies, fetchCompany, createCompany, updateCompany, toggleActive }
})
