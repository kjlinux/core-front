import apiClient from './client'

export interface TechnicienReportSignaturePayload {
  company_id: string
  company_name: string
  technicien_name: string
  global_score: number
  payload: {
    sections: Array<{
      title: string
      status: 'ok' | 'warning' | 'error'
      total: number
      done: number
      issues: string[]
    }>
    generatedAt: string
  }
}

export interface TechnicienReportSignature {
  id: string
  signature: string
  payloadHash: string
  signedAt: string
  verifyUrl: string
}

export const technicienReportApi = {
  sign(payload: TechnicienReportSignaturePayload): Promise<TechnicienReportSignature> {
    return apiClient.post('/technicien-reports', payload).then((r) => r.data)
  },
}
