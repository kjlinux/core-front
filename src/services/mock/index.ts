import MockAdapter from 'axios-mock-adapter'
import apiClient from '@/services/api/client'
import { setupAuthHandlers } from './handlers/auth.handler'
import { setupCompanyHandlers } from './handlers/company.handler'
import { setupEmployeeHandlers } from './handlers/employee.handler'
import { setupCardHandlers } from './handlers/card.handler'
import { setupAttendanceHandlers } from './handlers/attendance.handler'
import { setupFeelbackHandlers } from './handlers/feelback.handler'
import { setupMarketplaceHandlers } from './handlers/marketplace.handler'
import { setupDashboardHandlers } from './handlers/dashboard.handler'
import { setupBiometricHandlers } from './handlers/biometric.handler'
import { setupScheduleHandlers } from './handlers/schedule.handler'
import { setupRfidDeviceHandlers } from './handlers/rfid-device.handler'
import { setupSalesReportHandlers } from './handlers/sales-report.handler'

export function setupMock() {
  const mock = new MockAdapter(apiClient, { delayResponse: 300 })

  setupAuthHandlers(mock)
  setupCompanyHandlers(mock)
  setupEmployeeHandlers(mock)
  setupCardHandlers(mock)
  setupAttendanceHandlers(mock)
  setupFeelbackHandlers(mock)
  setupMarketplaceHandlers(mock)
  setupDashboardHandlers(mock)
  setupBiometricHandlers(mock)
  setupScheduleHandlers(mock)
  setupRfidDeviceHandlers(mock)
  setupSalesReportHandlers(mock)

  return mock
}
