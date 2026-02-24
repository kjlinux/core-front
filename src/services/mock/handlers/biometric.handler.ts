import type MockAdapter from 'axios-mock-adapter'

const mockDevices = [
  {
    id: 'bd1',
    serialNumber: 'BIO-001',
    companyId: 'c1',
    siteId: 's1',
    name: 'Terminal Entree Principale',
    isOnline: true,
    lastSyncAt: '2024-06-10T08:00:00Z',
    firmwareVersion: '2.3.1',
    enrolledCount: 142,
  },
  {
    id: 'bd2',
    serialNumber: 'BIO-002',
    companyId: 'c1',
    siteId: 's1',
    name: 'Terminal Sortie Principale',
    isOnline: true,
    lastSyncAt: '2024-06-10T07:55:00Z',
    firmwareVersion: '2.3.1',
    enrolledCount: 142,
  },
  {
    id: 'bd3',
    serialNumber: 'BIO-003',
    companyId: 'c1',
    siteId: 's2',
    name: 'Terminal Salle Serveur',
    isOnline: false,
    lastSyncAt: '2024-06-08T14:30:00Z',
    firmwareVersion: '2.2.9',
    enrolledCount: 18,
  },
]

const mockEnrollments = [
  {
    id: 'en1',
    employeeId: 'e1',
    employeeName: 'Kofi Mensah',
    deviceId: 'bd1',
    status: 'enrolled',
    enrolledAt: '2024-03-15T09:00:00Z',
    templateHash: 'abc123def456',
  },
  {
    id: 'en2',
    employeeId: 'e2',
    employeeName: 'Ama Owusu',
    deviceId: 'bd1',
    status: 'enrolled',
    enrolledAt: '2024-03-16T10:30:00Z',
    templateHash: 'def456ghi789',
  },
  {
    id: 'en3',
    employeeId: 'e3',
    employeeName: 'Kwame Asante',
    deviceId: 'bd2',
    status: 'pending',
    templateHash: '',
  },
  {
    id: 'en4',
    employeeId: 'e4',
    employeeName: 'Abena Boateng',
    deviceId: 'bd1',
    status: 'failed',
    templateHash: '',
  },
]

const mockAuditLog = [
  {
    id: 'al1',
    userId: 'u2',
    userName: 'Fatou Ouedraogo',
    action: 'ENROLL',
    target: 'Kofi Mensah',
    timestamp: '2024-03-15T09:00:00Z',
    details: 'Enrollment successful sur BIO-001',
  },
  {
    id: 'al2',
    userId: 'u2',
    userName: 'Fatou Ouedraogo',
    action: 'SYNC',
    target: 'BIO-001',
    timestamp: '2024-06-10T08:00:00Z',
    details: 'Synchronisation reussie - 142 empreintes',
  },
  {
    id: 'al3',
    userId: 'u3',
    userName: 'Ibrahim Sawadogo',
    action: 'DELETE_ENROLLMENT',
    target: 'Ama Owusu',
    timestamp: '2024-05-20T14:15:00Z',
    details: 'Suppression empreinte sur BIO-001',
  },
  {
    id: 'al4',
    userId: 'u2',
    userName: 'Fatou Ouedraogo',
    action: 'CREATE_DEVICE',
    target: 'BIO-003',
    timestamp: '2024-02-01T11:00:00Z',
    details: 'Ajout nouveau terminal biometrique',
  },
]

const mockInconsistencies = [
  {
    id: 'inc1',
    employeeId: 'e5',
    employeeName: 'Yaw Darko',
    issue: 'Empreinte enregistree mais employe inactif',
    deviceId: 'bd1',
    detectedAt: '2024-06-09T06:00:00Z',
  },
  {
    id: 'inc2',
    employeeId: 'e6',
    employeeName: 'Efua Acheampong',
    issue: 'Doublon empreinte detecte sur deux terminaux',
    deviceId: 'bd2',
    detectedAt: '2024-06-08T06:00:00Z',
  },
]

export function setupBiometricHandlers(mock: MockAdapter) {
  mock.onGet('/biometric/devices').reply(200, { data: mockDevices, success: true })

  mock.onGet(/\/biometric\/devices\/[^/]+/).reply((config) => {
    const id = config.url!.split('/').pop()
    const device = mockDevices.find((d) => d.id === id)
    return device
      ? [200, { data: device, success: true }]
      : [404, { message: 'Appareil non trouve', success: false }]
  })

  mock.onPost('/biometric/devices').reply((config) => {
    const data = JSON.parse(config.data)
    const device = { id: 'bd' + Date.now(), enrolledCount: 0, isOnline: false, lastSyncAt: new Date().toISOString(), ...data }
    mockDevices.push(device)
    return [201, { data: device, success: true }]
  })

  mock.onDelete(/\/biometric\/devices\/[^/]+/).reply((config) => {
    const id = config.url!.split('/').pop()
    const idx = mockDevices.findIndex((d) => d.id === id)
    if (idx !== -1) mockDevices.splice(idx, 1)
    return [200, { success: true }]
  })

  mock.onPost(/\/biometric\/devices\/[^/]+\/sync/).reply(200, { success: true })

  mock.onGet('/biometric/enrollments').reply(200, { data: mockEnrollments, success: true })

  mock.onPost('/biometric/enrollments').reply((config) => {
    const data = JSON.parse(config.data)
    const enrollment = { id: 'en' + Date.now(), status: 'pending', templateHash: '', ...data }
    mockEnrollments.push(enrollment)
    return [201, { data: enrollment, success: true }]
  })

  mock.onDelete(/\/biometric\/enrollments\/[^/]+/).reply((config) => {
    const id = config.url!.split('/').pop()
    const idx = mockEnrollments.findIndex((e) => e.id === id)
    if (idx !== -1) mockEnrollments.splice(idx, 1)
    return [200, { success: true }]
  })

  mock.onGet('/biometric/inconsistencies').reply(200, { data: mockInconsistencies, success: true })

  mock.onGet('/biometric/audit-log').reply(200, { data: mockAuditLog, success: true })
}
