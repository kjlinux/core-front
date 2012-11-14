import { ref } from 'vue'
import { defineStore } from 'pinia'
import { siteApi } from '@/services/api/site.api'
import type { Site, PaginatedResponse } from '@/types'

export const useSiteStore = defineStore('site', () => {
  const sites = ref<Site[]>([])
  const currentSite = ref<Site | null>(null)
  const isLoading = ref(false)
  const pagination = ref({
    currentPage: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
  })

  async function fetchSites(params?: Record<string, unknown>) {
    isLoading.value = true
    try {
      const response: PaginatedResponse<Site> = await siteApi.getAll(params)
      sites.value = response.data
      pagination.value = response.meta
    } finally {
      isLoading.value = false
    }
  }

  async function fetchSite(id: string) {
    isLoading.value = true
    try {
      const response = await siteApi.getById(id)
      currentSite.value = response.data
      return response.data
    } finally {
      isLoading.value = false
    }
  }

  async function createSite(data: Partial<Site>) {
    isLoading.value = true
    try {
      const response = await siteApi.create(data)
      sites.value.push(response.data)
      return response.data
    } finally {
      isLoading.value = false
    }
  }

  async function updateSite(id: string, data: Partial<Site>) {
    isLoading.value = true
    try {
      const response = await siteApi.update(id, data)
      const index = sites.value.findIndex((s) => s.id === id)
      if (index !== -1) {
        sites.value[index] = response.data
      }
      if (currentSite.value?.id === id) {
        currentSite.value = response.data
      }
      return response.data
    } finally {
      isLoading.value = false
    }
  }

  async function deleteSite(id: string) {
    isLoading.value = true
    try {
      await siteApi.delete(id)
      sites.value = sites.value.filter((s) => s.id !== id)
      if (currentSite.value?.id === id) {
        currentSite.value = null
      }
    } finally {
      isLoading.value = false
    }
  }

  return { sites, currentSite, isLoading, pagination, fetchSites, fetchSite, createSite, updateSite, deleteSite }
})
