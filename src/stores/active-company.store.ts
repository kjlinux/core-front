import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import apiClient from '@/services/api/client'

function getStoredValue(key: string): string | null {
  const val = localStorage.getItem(key)
  if (!val || val === 'undefined' || val === 'null') {
    localStorage.removeItem(key)
    return null
  }
  return val
}

export const useActiveCompanyStore = defineStore('activeCompany', () => {
  const activeCompanyId = ref<string | null>(getStoredValue('active_company_id'))
  const activeCompanyName = ref<string | null>(getStoredValue('active_company_name'))
  const isLoading = ref(false)

  const hasActiveCompany = computed(() => !!activeCompanyId.value)

  async function selectCompany(companyId: string, companyName?: string): Promise<void> {
    isLoading.value = true
    try {
      // Try to notify the backend, but don't block on failure
      try {
        const res = await apiClient.post('/auth/select-company', { companyId })
        const id = res.data.companyId ?? res.data.company_id ?? companyId
        const name = res.data.companyName ?? res.data.company_name ?? res.data.name ?? companyName ?? ''
        activeCompanyId.value = id
        activeCompanyName.value = name
        localStorage.setItem('active_company_id', id)
        localStorage.setItem('active_company_name', name)
      } catch {
        // Backend not available — store locally using provided name
        activeCompanyId.value = companyId
        activeCompanyName.value = companyName ?? ''
        localStorage.setItem('active_company_id', companyId)
        localStorage.setItem('active_company_name', companyName ?? '')
      }
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
