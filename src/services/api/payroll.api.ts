import apiClient from './client'
import type { PayrollConfig, PayrollGenerateParams, Payslip, LatenessRule } from '@/types/payroll'

export const payrollApi = {
  // --- Configuration ---
  getConfig(companyId: string): Promise<PayrollConfig> {
    return apiClient.get(`/payroll/config/${companyId}`).then((r) => r.data)
  },

  saveConfig(companyId: string, data: Partial<PayrollConfig>): Promise<PayrollConfig> {
    return apiClient.put(`/payroll/config/${companyId}`, {
      default_payment_mode: data.defaultPaymentMode,
      standard_daily_hours: data.standardDailyHours,
      working_days_per_month: data.workingDaysPerMonth,
      payment_day: data.paymentDay,
      lateness_deduction_enabled: data.latenessDeductionEnabled,
      overtime_enabled: data.overtimeEnabled,
      overtime_rate: data.overtimeRate,
    }).then((r) => r.data)
  },

  // --- Regles de penalite retard ---
  saveLatenessRules(companyId: string, rules: Omit<LatenessRule, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>[]): Promise<LatenessRule[]> {
    return apiClient.put(`/payroll/config/${companyId}/lateness-rules`, {
      rules: rules.map((r) => ({
        tolerance_minutes: r.toleranceMinutes,
        minutes_threshold: r.minutesThreshold,
        penalty_value: r.penaltyValue,
        penalty_type: r.penaltyType,
        apply_per: r.applyPer,
      })),
    }).then((r) => r.data)
  },

  // --- Generation des fiches de paie ---
  generatePayslips(params: PayrollGenerateParams): Promise<Payslip[]> {
    return apiClient.post('/payroll/generate', {
      company_id: params.companyId,
      site_id: params.siteId,
      department_id: params.departmentId,
      period_start: params.periodStart,
      period_end: params.periodEnd,
    }).then((r) => r.data)
  },

  // --- Consultation des fiches existantes ---
  getPayslips(params: {
    companyId?: string
    siteId?: string
    departmentId?: string
    employeeId?: string
    period?: string
    status?: string
  }): Promise<Payslip[]> {
    return apiClient.get('/payroll/payslips', {
      params: {
        company_id: params.companyId,
        site_id: params.siteId,
        department_id: params.departmentId,
        employee_id: params.employeeId,
        period: params.period,
        status: params.status,
      },
    }).then((r) => r.data)
  },

  getPayslip(id: string): Promise<Payslip> {
    return apiClient.get(`/payroll/payslips/${id}`).then((r) => r.data)
  },

  validatePayslip(id: string): Promise<Payslip> {
    return apiClient.patch(`/payroll/payslips/${id}/validate`).then((r) => r.data)
  },

  // --- Portail employe ---
  getMyPayslips(employeeId: string): Promise<Payslip[]> {
    return apiClient.get(`/payroll/employees/${employeeId}/payslips`).then((r) => r.data)
  },
}
