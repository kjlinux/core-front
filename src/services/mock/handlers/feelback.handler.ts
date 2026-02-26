import type MockAdapter from 'axios-mock-adapter'

export function setupFeelbackHandlers(mock: MockAdapter) {
  mock.onGet('/feelback/stats').reply(200, {
    data: { totalResponses: 1234, bon: 856, neutre: 245, mauvais: 133, satisfactionRate: 69.4, trend: 3.2 },
    success: true,
  })

  mock.onGet('/feelback/entries').reply(200, {
    data: [
      { id: 'fe-1', timestamp: '2026-02-24T08:15:00.000Z', level: 'bon', siteName: 'Agence Centrale', deviceId: 'DEV-001', siteId: 'site-1' },
      { id: 'fe-2', timestamp: '2026-02-24T09:32:00.000Z', level: 'mauvais', siteName: 'Agence Nord', deviceId: 'DEV-002', siteId: 'site-2' },
      { id: 'fe-3', timestamp: '2026-02-24T10:45:00.000Z', level: 'neutre', siteName: 'Agence Sud', deviceId: 'DEV-003', siteId: 'site-3' },
      { id: 'fe-4', timestamp: '2026-02-24T11:20:00.000Z', level: 'bon', siteName: 'Agence Est', deviceId: 'DEV-001', siteId: 'site-1' },
      { id: 'fe-5', timestamp: '2026-02-24T13:05:00.000Z', level: 'bon', siteName: 'Agence Centrale', deviceId: 'DEV-004', siteId: 'site-1' },
    ],
    success: true,
  })
  mock.onGet('/feelback/devices').reply(200, { data: [], success: true })
  mock.onGet(/\/feelback\/devices\/[^/]+/).reply(200, { data: {}, success: true })
  mock.onPost('/feelback/devices').reply(201, { data: {}, success: true })
  mock.onPut(/\/feelback\/devices\/[^/]+/).reply(200, { data: {}, success: true })
  mock.onDelete(/\/feelback\/devices\/[^/]+/).reply(200, { success: true })
  mock.onGet('/feelback/alerts').reply(200, { data: [], success: true })
  mock.onPatch(/\/feelback\/alerts\/[^/]+\/read/).reply(200, { data: {}, success: true })
  mock.onPost(/\/feelback\/devices\/[^/]+\/restart/).reply(200, { success: true })
  mock.onPut('/feelback/alerts/settings').reply(200, { data: {}, success: true })
  mock.onGet(/\/feelback\/stats\/agency\/[^/]+/).reply(200, {
    data: { totalResponses: 320, bon: 230, neutre: 55, mauvais: 35, satisfactionRate: 71.9 },
    success: true,
  })
  mock.onGet('/feelback/comparison').reply(200, { data: [], success: true })
  mock.onGet('/feelback/reports').reply(200, { data: [], success: true })
  mock.onGet('/feelback/settings').reply(200, { data: { threshold: 60, emailNotifications: true, recipients: [] }, success: true })
  mock.onPut('/feelback/settings').reply(200, { data: {}, success: true })
  mock.onGet('/feelback/analytics').reply(200, { data: {}, success: true })
}
