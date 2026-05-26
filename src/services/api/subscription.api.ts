import apiClient from './client'
import type {
  PlanCode,
  SubscriptionPlanDef,
  SubscriptionState,
  SubscriptionPayment,
  InitiatePaymentResult,
} from '@/types/subscription'
import type { PaginatedResponse } from '@/types'

export const subscriptionApi = {
  plans(): Promise<SubscriptionPlanDef[]> {
    return apiClient.get('/subscriptions/plans').then((r) => r.data)
  },
  me(): Promise<SubscriptionState> {
    return apiClient.get('/subscriptions/me').then((r) => r.data)
  },
  history(params?: { page?: number; per_page?: number }): Promise<PaginatedResponse<SubscriptionPayment>> {
    return apiClient.get('/subscriptions/history', { params }).then((r) => r.data)
  },
  subscribe(planCode: PlanCode): Promise<InitiatePaymentResult> {
    return apiClient.post('/subscriptions/subscribe', { plan_code: planCode }).then((r) => r.data)
  },
  upgrade(planCode: PlanCode): Promise<InitiatePaymentResult> {
    return apiClient.post('/subscriptions/upgrade', { plan_code: planCode }).then((r) => r.data)
  },
  payNextPeriod(): Promise<InitiatePaymentResult> {
    return apiClient.post('/subscriptions/pay-next-period', {}).then((r) => r.data)
  },

  // Super-admin
  adminList(params?: { page?: number; per_page?: number }): Promise<PaginatedResponse<any>> {
    return apiClient.get('/admin/subscriptions', { params }).then((r) => r.data)
  },
  adminAnalytics(): Promise<any> {
    return apiClient.get('/admin/subscriptions/analytics').then((r) => r.data)
  },
  adminUpdate(companyId: string, payload: { plan_code: PlanCode; expires_at?: string | null }): Promise<any> {
    return apiClient.patch(`/admin/companies/${companyId}/subscription`, payload).then((r) => r.data)
  },
}
