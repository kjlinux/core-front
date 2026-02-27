import type MockAdapter from 'axios-mock-adapter'

const mockDevices = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa901',
    serialNumber: 'RFID-SN-001',
    name: 'Lecteur Entree Principale',
    companyId: '11111111-1111-1111-1111-111111111101',
    siteId: '22222222-2222-2222-2222-222222222201',
    siteName: 'Siege Social',
    isOnline: true,
    lastPingAt: '2026-02-26T08:00:00.000Z',
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa902',
    serialNumber: 'RFID-SN-002',
    name: 'Lecteur Sortie Principale',
    companyId: '11111111-1111-1111-1111-111111111101',
    siteId: '22222222-2222-2222-2222-222222222201',
    siteName: 'Siege Social',
    isOnline: true,
    lastPingAt: '2026-02-26T07:55:00.000Z',
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa903',
    serialNumber: 'RFID-SN-003',
    name: 'Lecteur Parking',
    companyId: '11111111-1111-1111-1111-111111111101',
    siteId: '22222222-2222-2222-2222-222222222202',
    siteName: 'Agence Nord',
    isOnline: false,
    lastPingAt: '2026-02-24T14:30:00.000Z',
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa904',
    serialNumber: 'RFID-SN-004',
    name: 'Lecteur Bureau Direction',
    companyId: '11111111-1111-1111-1111-111111111102',
    siteId: '22222222-2222-2222-2222-222222222203',
    siteName: 'Agence Sud',
    isOnline: true,
    lastPingAt: '2026-02-26T07:45:00.000Z',
  },
]

export function setupRfidDeviceHandlers(mock: MockAdapter) {
  mock.onGet('/rfid/devices').reply(200, { data: mockDevices, success: true })

  mock.onGet(/\/rfid\/devices\/[^/]+/).reply((config) => {
    const id = config.url!.split('/').pop()
    const device = mockDevices.find((d) => d.id === id)
    return device
      ? [200, { data: device, success: true }]
      : [404, { message: 'Terminal non trouve', success: false }]
  })

  mock.onPost('/rfid/devices').reply((config) => {
    const data = JSON.parse(config.data)
    const device = {
      id: 'rfid-' + Date.now(),
      isOnline: false,
      lastPingAt: new Date().toISOString(),
      siteName: '',
      ...data,
    }
    mockDevices.push(device)
    return [201, { data: device, success: true }]
  })

  mock.onPut(/\/rfid\/devices\/[^/]+/).reply((config) => {
    const id = config.url!.split('/').pop()
    const data = JSON.parse(config.data)
    const device = mockDevices.find((d) => d.id === id)
    if (device) {
      Object.assign(device, data)
      return [200, { data: device, success: true }]
    }
    return [404, { message: 'Terminal non trouve', success: false }]
  })

  mock.onDelete(/\/rfid\/devices\/[^/]+/).reply((config) => {
    const id = config.url!.split('/').pop()
    const idx = mockDevices.findIndex((d) => d.id === id)
    if (idx !== -1) mockDevices.splice(idx, 1)
    return [200, { success: true }]
  })
}
