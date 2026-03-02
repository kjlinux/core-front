import apiClient from './client'
import type { ApiResponse } from '@/types'

export type RfidCommand = 'RESET' | 'REBOOT' | 'WAKE_UP' | 'SLEEP' | 'STATUS'
export type BiometricCommand = RfidCommand | 'ENROLE'
export type DeviceCommand = RfidCommand | BiometricCommand
export type DeviceType = 'biometric' | 'rfid'

interface SendCommandResponse {
  topic: string
  command: string
}

export const mqttApi = {
  testConnection(): Promise<ApiResponse<{ connected: boolean }>> {
    return apiClient.post('/mqtt/test').then((r) => r.data)
  },

  sendCommand(deviceId: string, deviceType: DeviceType, command: DeviceCommand): Promise<ApiResponse<SendCommandResponse>> {
    return apiClient.post('/mqtt/send-command', {
      device_id: deviceId,
      device_type: deviceType,
      command,
    }).then((r) => r.data)
  },
}
