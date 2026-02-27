import type MockAdapter from 'axios-mock-adapter'

export function setupSalesReportHandlers(mock: MockAdapter) {
  mock.onGet('/admin/reports/sales').reply(200, {
    data: {
      totalOrders: 207,
      totalRevenue: 21850000,
      averageBasket: 105556,
      pendingOrders: 18,
      revenueByMonth: [
        { month: '2025-01', revenue: 850000, orders: 12 },
        { month: '2025-02', revenue: 1200000, orders: 18 },
        { month: '2025-03', revenue: 950000, orders: 14 },
        { month: '2025-04', revenue: 1400000, orders: 20 },
        { month: '2025-05', revenue: 1800000, orders: 25 },
        { month: '2025-06', revenue: 1600000, orders: 22 },
        { month: '2025-07', revenue: 2100000, orders: 28 },
        { month: '2025-08', revenue: 1900000, orders: 26 },
        { month: '2025-09', revenue: 2300000, orders: 30 },
        { month: '2025-10', revenue: 2500000, orders: 45 },
        { month: '2025-11', revenue: 2800000, orders: 52 },
        { month: '2025-12', revenue: 3400000, orders: 61 },
      ],
      ordersByStatus: [
        { name: 'Livrees', value: 145 },
        { name: 'En cours', value: 32 },
        { name: 'Annulees', value: 12 },
        { name: 'En attente', value: 18 },
      ],
      topProducts: [
        { name: 'Carte RFID Standard', value: 520 },
        { name: 'Carte RFID Personnalisee', value: 340 },
        { name: 'Accessoires', value: 210 },
        { name: 'Pack Pro', value: 180 },
        { name: 'Pack Enterprise', value: 95 },
      ],
    },
    success: true,
  })
}
