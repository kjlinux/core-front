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

  async function selectCompany(companyId: string): Promise<void> {
    isLoading.value = true
    try {
      const res = await apiClient.post('/auth/select-company', { companyId })
      const id = res.data.companyId ?? res.data.company_id ?? companyId
      const name = res.data.companyName ?? res.data.company_name ?? res.data.name ?? ''
      activeCompanyId.value = id
      activeCompanyName.value = name
      localStorage.setItem('active_company_id', id)
      localStorage.setItem('active_company_name', name)
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
