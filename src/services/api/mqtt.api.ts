import apiClient from './client'
import type { ApiResponse } from '@/types'

export type DeviceCommand = 'REBOOT' | 'RESET' | 'STATUS' | 'RESTART'
export type DeviceType = 'biometric' | 'feelback'

interface SendCommandResponse {
  topic: string
  command: string
}

export const mqttApi = {
  sendCommand(deviceId: string, deviceType: DeviceType, command: DeviceCommand): Promise<ApiResponse<SendCommandResponse>> {
    return apiClient.post('/mqtt/send-command', {
      device_id: deviceId,
      device_type: deviceType,
      command,
    }).then((r) => r.data)
  },
}
