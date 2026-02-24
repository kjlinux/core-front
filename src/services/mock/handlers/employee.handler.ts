import type MockAdapter from 'axios-mock-adapter'

const mockEmployees = [
  { id: 'e1', companyId: 'c1', siteId: 's1', departmentId: 'd1', firstName: 'Amadou', lastName: 'Diallo', email: 'amadou@orange-bf.com', phone: '+226 70 11 22 33', position: 'Directeur General', employeeNumber: 'EMP001', isActive: true, biometricEnrolled: true, createdAt: '2024-01-15T00:00:00Z' },
  { id: 'e2', companyId: 'c1', siteId: 's1', departmentId: 'd2', firstName: 'Fatima', lastName: 'Coulibaly', email: 'fatima@orange-bf.com', phone: '+226 70 22 33 44', position: 'Chef Commercial', employeeNumber: 'EMP002', isActive: true, biometricEnrolled: false, createdAt: '2024-02-01T00:00:00Z' },
  { id: 'e3', companyId: 'c2', siteId: 's3', departmentId: 'd4', firstName: 'Ibrahim', lastName: 'Traore', email: 'ibrahim@coris.com', phone: '+226 70 33 44 55', position: 'Analyste', employeeNumber: 'EMP003', isActive: true, biometricEnrolled: true, createdAt: '2024-03-10T00:00:00Z' },
]

export function setupEmployeeHandlers(mock: MockAdapter) {
  mock.onGet('/employees').reply(200, { data: mockEmployees, success: true })

  mock.onGet(/\/employees\/[^/]+$/).reply((config) => {
    const id = config.url?.split('/').pop()
    const emp = mockEmployees.find((e) => e.id === id)
    if (emp) return [200, { data: emp, success: true }]
    return [404, { message: 'Employe non trouve' }]
  })

  mock.onPost('/employees').reply((config) => {
    const data = JSON.parse(config.data)
    return [201, { data: { ...data, id: 'e' + Date.now(), createdAt: new Date().toISOString() }, success: true }]
  })

  mock.onPut(/\/employees\/[^/]+$/).reply((config) => {
    return [200, { data: JSON.parse(config.data), success: true }]
  })

  mock.onDelete(/\/employees\/[^/]+/).reply(200, { success: true })

  mock.onPatch(/\/employees\/[^/]+\/toggle-active/).reply((config) => {
    const id = config.url?.split('/')[2]
    const emp = mockEmployees.find((e) => e.id === id)
    if (emp) return [200, { data: { ...emp, isActive: !emp.isActive }, success: true }]
    return [404, { message: 'Employe non trouve' }]
  })
}
