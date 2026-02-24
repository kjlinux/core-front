import { ref } from 'vue'
import { defineStore } from 'pinia'
import { companyApi } from '@/services/api/company.api'
import type { Company } from '@/types'

export const useCompanyStore = defineStore('company', () => {
  const companies = ref<Company[]>([])
  const currentCompany = ref<Company | null>(null)
  const isLoading = ref(false)
  const pagination = ref({
    currentPage: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
  })

  async function fetchCompanies(params?: Record<string, unknown>) {
    isLoading.value = true
    try {
      companies.value = await companyApi.getAll(params)
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
    const company = companies.value.find((c) => c.id === id)
    if (company) {
      await updateCompany(id, { isActive: !company.isActive })
    }
  }

  return { companies, currentCompany, isLoading, pagination, fetchCompanies, fetchCompany, createCompany, updateCompany, toggleActive }
})
