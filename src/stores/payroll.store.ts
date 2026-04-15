import { ref } from 'vue'
import { defineStore } from 'pinia'
import { payrollApi } from '@/services/api/payroll.api'
import type { PayrollConfig, Payslip, LatenessRule, PayrollGenerateParams } from '@/types/payroll'

export const usePayrollStore = defineStore('payroll', () => {
  const config = ref<PayrollConfig | null>(null)
  const payslips = ref<Payslip[]>([])
  const currentPayslip = ref<Payslip | null>(null)
  const isLoading = ref(false)
  const isGenerating = ref(false)

  async function fetchConfig(companyId: string) {
    isLoading.value = true
    try {
      config.value = await payrollApi.getConfig(companyId)
    } finally {
      isLoading.value = false
    }
  }

  async function saveConfig(companyId: string, data: Partial<PayrollConfig>) {
    isLoading.value = true
    try {
      config.value = await payrollApi.saveConfig(companyId, data)
      return config.value
    } finally {
      isLoading.value = false
    }
  }

  async function saveLatenessRules(
    companyId: string,
    rules: Omit<LatenessRule, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>[],
  ) {
    isLoading.value = true
    try {
      const saved = await payrollApi.saveLatenessRules(companyId, rules)
      if (config.value) {
        config.value.latenessRules = saved
      }
      return saved
    } finally {
      isLoading.value = false
    }
  }

  async function fetchPayslips(params: {
    companyId?: string
    siteId?: string
    departmentId?: string
    employeeId?: string
    period?: string
    status?: string
  }) {
    isLoading.value = true
    try {
      payslips.value = await payrollApi.getPayslips(params)
    } finally {
      isLoading.value = false
    }
  }

  async function generatePayslips(params: PayrollGenerateParams) {
    isGenerating.value = true
    try {
      const generated = await payrollApi.generatePayslips(params)
      payslips.value = generated
      return generated
    } finally {
      isGenerating.value = false
    }
  }

  async function validatePayslip(id: string) {
    isLoading.value = true
    try {
      const updated = await payrollApi.validatePayslip(id)
      const idx = payslips.value.findIndex((p) => p.id === id)
      if (idx !== -1) payslips.value[idx] = updated
      if (currentPayslip.value?.id === id) currentPayslip.value = updated
      return updated
    } finally {
      isLoading.value = false
    }
  }

  async function fetchMyPayslips(employeeId: string) {
    isLoading.value = true
    try {
      payslips.value = await payrollApi.getMyPayslips(employeeId)
    } finally {
      isLoading.value = false
    }
  }

  return {
    config,
    payslips,
    currentPayslip,
    isLoading,
    isGenerating,
    fetchConfig,
    saveConfig,
    saveLatenessRules,
    fetchPayslips,
    generatePayslips,
    validatePayslip,
    fetchMyPayslips,
  }
})
