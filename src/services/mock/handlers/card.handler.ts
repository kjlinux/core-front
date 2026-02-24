import type MockAdapter from 'axios-mock-adapter'

const mockCards = [
  { id: 'card1', uid: 'RFID001', companyId: 'c1', employeeId: 'e1', employeeName: 'Amadou Diallo', status: 'active', assignedAt: '2024-01-20T00:00:00Z', createdAt: '2024-01-15T00:00:00Z' },
  { id: 'card2', uid: 'RFID002', companyId: 'c1', status: 'inactive', createdAt: '2024-01-16T00:00:00Z' },
  { id: 'card3', uid: 'RFID003', companyId: 'c1', employeeId: 'e2', employeeName: 'Fatima Coulibaly', status: 'active', assignedAt: '2024-02-05T00:00:00Z', createdAt: '2024-01-17T00:00:00Z' },
]

export function setupCardHandlers(mock: MockAdapter) {
  mock.onGet('/cards').reply(200, { data: mockCards, success: true })

  mock.onGet(/\/cards\/[^/]+\/history/).reply(200, { data: [], success: true })

  mock.onGet(/\/cards\/[^/]+$/).reply((config) => {
    const id = config.url?.split('/').pop()
    const card = mockCards.find((c) => c.id === id)
    if (card) return [200, { data: card, success: true }]
    return [404, { message: 'Carte non trouvee' }]
  })

  mock.onPost('/cards').reply((config) => {
    const data = JSON.parse(config.data)
    return [201, { data: { ...data, id: 'card' + Date.now(), status: 'inactive', createdAt: new Date().toISOString() }, success: true }]
  })

  mock.onPatch(/\/cards\/[^/]+\/assign/).reply((config) => {
    return [200, { data: { status: 'active', assignedAt: new Date().toISOString() }, success: true }]
  })

  mock.onPatch(/\/cards\/[^/]+\/unassign/).reply(200, { data: { status: 'inactive' }, success: true })
  mock.onPatch(/\/cards\/[^/]+\/block/).reply(200, { data: { status: 'blocked', blockedAt: new Date().toISOString() }, success: true })
  mock.onPatch(/\/cards\/[^/]+\/unblock/).reply(200, { data: { status: 'active' }, success: true })
}
