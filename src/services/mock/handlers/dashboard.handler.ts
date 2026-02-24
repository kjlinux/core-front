import type MockAdapter from 'axios-mock-adapter'

export function setupDashboardHandlers(mock: MockAdapter) {
  mock.onGet('/dashboard/stats').reply(200, {
    data: {
      activeCompanies: 12,
      connectedDevices: 48,
      totalEmployees: 1240,
      globalSatisfactionRate: 72.5,
      rfidCardsSold: 3450,
      marketplaceRevenue: 17500000,
      technicalAlerts: 3,
    },
    success: true,
  })

  mock.onGet('/dashboard/trends').reply(200, {
    data: [
      { label: 'Entreprises', value: 12, previousValue: 10, changePercent: 20 },
      { label: 'Employes', value: 1240, previousValue: 1100, changePercent: 12.7 },
      { label: 'Satisfaction', value: 72.5, previousValue: 69.3, changePercent: 4.6 },
      { label: 'Revenus', value: 17500000, previousValue: 15200000, changePercent: 15.1 },
    ],
    success: true,
  })
}
