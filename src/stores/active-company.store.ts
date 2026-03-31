import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import apiClient from '@/services/api/client'

export const useActiveCompanyStore = defineStore('activeCompany', () => {
  const activeCompanyId = ref<string | null>(localStorage.getItem('active_company_id'))
  const activeCompanyName = ref<string | null>(localStorage.getItem('active_company_name'))
  const isLoading = ref(false)

  const hasActiveCompany = computed(() => !!activeCompanyId.value)

  async function selectCompany(companyId: string): Promise<void> {
    isLoading.value = true
    try {
      const res = await apiClient.post('/auth/select-company', { companyId })
      activeCompanyId.value = res.data.companyId
      activeCompanyName.value = res.data.companyName
      localStorage.setItem('active_company_id', res.data.companyId)
      localStorage.setItem('active_company_name', res.data.companyName)
    } finally {
      isLoading.value = false
    }
  }

  function clear() {
    activeCompanyId.value = null
    activeCompanyName.value = null
    localStorage.removeItem('active_company_id')
    localStorage.removeItem('active_company_name')
  }

  return { activeCompanyId, activeCompanyName, hasActiveCompany, isLoading, selectCompany, clear }
})
