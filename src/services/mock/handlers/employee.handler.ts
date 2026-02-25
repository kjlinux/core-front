import type MockAdapter from 'axios-mock-adapter'

export const mockEmployees = [
  // Orange BF - Siege Ouaga (s1) - Direction Generale (d1)
  { id: 'e1', companyId: 'c1', siteId: 's1', departmentId: 'd1', firstName: 'Amadou', lastName: 'Diallo', email: 'amadou.diallo@orange-bf.com', phone: '+226 70 11 22 33', position: 'Directeur General', employeeNumber: 'EMP001', isActive: true, biometricEnrolled: true, hireDate: '2020-01-15', createdAt: '2024-01-15T00:00:00Z' },
  { id: 'e2', companyId: 'c1', siteId: 's1', departmentId: 'd1', firstName: 'Mariam', lastName: 'Ouedraogo', email: 'mariam.ouedraogo@orange-bf.com', phone: '+226 70 11 22 44', position: 'Assistante Direction', employeeNumber: 'EMP002', isActive: true, biometricEnrolled: true, hireDate: '2021-03-01', createdAt: '2024-01-15T00:00:00Z' },
  // Orange BF - Siege Ouaga (s1) - Commercial (d2)
  { id: 'e3', companyId: 'c1', siteId: 's1', departmentId: 'd2', firstName: 'Fatima', lastName: 'Coulibaly', email: 'fatima.coulibaly@orange-bf.com', phone: '+226 70 22 33 44', position: 'Chef Commercial', employeeNumber: 'EMP003', isActive: true, biometricEnrolled: false, hireDate: '2020-06-01', createdAt: '2024-02-01T00:00:00Z' },
  { id: 'e4', companyId: 'c1', siteId: 's1', departmentId: 'd2', firstName: 'Seydou', lastName: 'Kone', email: 'seydou.kone@orange-bf.com', phone: '+226 70 22 33 55', position: 'Commercial Senior', employeeNumber: 'EMP004', isActive: true, biometricEnrolled: false, hireDate: '2021-09-15', createdAt: '2024-02-01T00:00:00Z' },
  { id: 'e5', companyId: 'c1', siteId: 's1', departmentId: 'd2', firstName: 'Aissata', lastName: 'Barry', email: 'aissata.barry@orange-bf.com', phone: '+226 70 22 33 66', position: 'Commercial Junior', employeeNumber: 'EMP005', isActive: false, biometricEnrolled: false, hireDate: '2022-01-10', createdAt: '2024-02-01T00:00:00Z' },
  // Orange BF - Siege Ouaga (s1) - Technique (d3)
  { id: 'e6', companyId: 'c1', siteId: 's1', departmentId: 'd3', firstName: 'Moussa', lastName: 'Sawadogo', email: 'moussa.sawadogo@orange-bf.com', phone: '+226 70 33 44 55', position: 'Responsable Technique', employeeNumber: 'EMP006', isActive: true, biometricEnrolled: true, hireDate: '2019-05-20', createdAt: '2024-03-10T00:00:00Z' },
  { id: 'e7', companyId: 'c1', siteId: 's1', departmentId: 'd3', firstName: 'Rasmane', lastName: 'Zongo', email: 'rasmane.zongo@orange-bf.com', phone: '+226 70 33 44 66', position: 'Ingenieur Reseau', employeeNumber: 'EMP007', isActive: true, biometricEnrolled: true, hireDate: '2020-11-01', createdAt: '2024-03-10T00:00:00Z' },
  // Orange BF - Agence Bobo (s2) - Direction Regionale (d4)
  { id: 'e8', companyId: 'c1', siteId: 's2', departmentId: 'd4', firstName: 'Salimata', lastName: 'Traore', email: 'salimata.traore@orange-bf.com', phone: '+226 70 44 55 66', position: 'Directrice Regionale', employeeNumber: 'EMP008', isActive: true, biometricEnrolled: true, hireDate: '2018-03-15', createdAt: '2024-01-15T00:00:00Z' },
  // Orange BF - Agence Bobo (s2) - Commercial Bobo (d5)
  { id: 'e9', companyId: 'c1', siteId: 's2', departmentId: 'd5', firstName: 'Adama', lastName: 'Kabore', email: 'adama.kabore@orange-bf.com', phone: '+226 70 44 55 77', position: 'Chef Commercial Bobo', employeeNumber: 'EMP009', isActive: true, biometricEnrolled: false, hireDate: '2020-02-01', createdAt: '2024-02-01T00:00:00Z' },
  // Orange BF - Agence Bobo (s2) - Technique Bobo (d6)
  { id: 'e10', companyId: 'c1', siteId: 's2', departmentId: 'd6', firstName: 'Issa', lastName: 'Compaore', email: 'issa.compaore@orange-bf.com', phone: '+226 70 44 55 88', position: 'Responsable Technique Bobo', employeeNumber: 'EMP010', isActive: true, biometricEnrolled: true, hireDate: '2019-08-01', createdAt: '2024-03-10T00:00:00Z' },
  // Coris Bank - Siege (s3) - Direction Generale (d7)
  { id: 'e11', companyId: 'c2', siteId: 's3', departmentId: 'd7', firstName: 'Ibrahim', lastName: 'Toure', email: 'ibrahim.toure@coris-bank.com', phone: '+226 70 55 66 77', position: 'Directeur General', employeeNumber: 'EMP011', isActive: true, biometricEnrolled: true, hireDate: '2017-01-10', createdAt: '2024-01-15T00:00:00Z' },
  // Coris Bank - Siege (s3) - Commercial (d8)
  { id: 'e12', companyId: 'c2', siteId: 's3', departmentId: 'd8', firstName: 'Aminata', lastName: 'Diallo', email: 'aminata.diallo@coris-bank.com', phone: '+226 70 55 66 88', position: 'Responsable Commercial', employeeNumber: 'EMP012', isActive: true, biometricEnrolled: false, hireDate: '2020-04-15', createdAt: '2024-02-01T00:00:00Z' },
  { id: 'e13', companyId: 'c2', siteId: 's3', departmentId: 'd8', firstName: 'Boureima', lastName: 'Yameogo', email: 'boureima.yameogo@coris-bank.com', phone: '+226 70 55 66 99', position: 'Charge Clientele', employeeNumber: 'EMP013', isActive: true, biometricEnrolled: false, hireDate: '2022-06-01', createdAt: '2024-02-01T00:00:00Z' },
  // Coris Bank - Siege (s3) - Technique (d9)
  { id: 'e14', companyId: 'c2', siteId: 's3', departmentId: 'd9', firstName: 'Wendlassida', lastName: 'Ouoba', email: 'wendlassida.ouoba@coris-bank.com', phone: '+226 70 66 77 88', position: 'Responsable Informatique', employeeNumber: 'EMP014', isActive: true, biometricEnrolled: true, hireDate: '2019-10-01', createdAt: '2024-03-10T00:00:00Z' },
]

export function setupEmployeeHandlers(mock: MockAdapter) {
  mock.onGet('/employees').reply((config) => {
    let result = [...mockEmployees]
    const { companyId, siteId, departmentId, isActive, search } = config.params || {}
    if (companyId) result = result.filter((e) => e.companyId === companyId)
    if (siteId) result = result.filter((e) => e.siteId === siteId)
    if (departmentId) result = result.filter((e) => e.departmentId === departmentId)
    if (isActive !== undefined) result = result.filter((e) => e.isActive === isActive)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((e) =>
        e.firstName.toLowerCase().includes(q) ||
        e.lastName.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.employeeNumber.toLowerCase().includes(q),
      )
    }
    const page = Number(config.params?.page) || 1
    const perPage = Number(config.params?.perPage) || 10
    const total = result.length
    const paginated = result.slice((page - 1) * perPage, page * perPage)
    return [200, { data: paginated, meta: { total, currentPage: page, perPage, totalPages: Math.ceil(total / perPage) }, success: true }]
  })

  mock.onGet(/\/employees\/[^/]+$/).reply((config) => {
    const id = config.url?.split('/').pop()
    const emp = mockEmployees.find((e) => e.id === id)
    if (emp) return [200, { data: emp, success: true }]
    return [404, { message: 'Employe non trouve' }]
  })

  mock.onPost('/employees').reply((config) => {
    const data = JSON.parse(config.data)
    const newEmp = { ...data, id: 'e' + Date.now(), createdAt: new Date().toISOString() }
    mockEmployees.push(newEmp)
    return [201, { data: newEmp, success: true }]
  })

  mock.onPut(/\/employees\/[^/]+$/).reply((config) => {
    const id = config.url?.split('/').pop()
    const index = mockEmployees.findIndex((e) => e.id === id)
    if (index === -1) return [404, { message: 'Employe non trouve' }]
    mockEmployees[index] = { ...mockEmployees[index], ...JSON.parse(config.data) }
    return [200, { data: mockEmployees[index], success: true }]
  })

  mock.onDelete(/\/employees\/[^/]+/).reply((config) => {
    const id = config.url?.split('/').pop()
    const index = mockEmployees.findIndex((e) => e.id === id)
    if (index !== -1) mockEmployees.splice(index, 1)
    return [200, { success: true }]
  })

  mock.onPatch(/\/employees\/[^/]+\/toggle-active/).reply((config) => {
    const id = config.url?.split('/')[2]
    const emp = mockEmployees.find((e) => e.id === id)
    if (emp) {
      emp.isActive = !emp.isActive
      return [200, { data: emp, success: true }]
    }
    return [404, { message: 'Employe non trouve' }]
  })
}
