import type MockAdapter from 'axios-mock-adapter'
import { mockCompanies } from '../data/companies.mock'

// Flatten all sites and departments from mock companies for flat-list endpoints
const allSites = mockCompanies.flatMap((c) =>
  (c.sites ?? []).map((s) => ({ ...s, company: { id: c.id, name: c.name } })),
)
const allDepartments = mockCompanies.flatMap((c) =>
  (c.sites ?? []).flatMap((s) =>
    (s.departments ?? []).map((d) => ({
      ...d,
      site: { id: s.id, name: s.name },
      company: { id: c.id, name: c.name },
    })),
  ),
)

let sites = [...allSites]
let departments = [...allDepartments]

export function setupCompanyHandlers(mock: MockAdapter) {
  // --- Sites flat-list endpoints ---

  // GET all sites
  mock.onGet('/sites').reply((config) => {
    let result = sites
    const companyId = config.params?.companyId
    if (companyId) result = result.filter((s) => s.companyId === companyId)
    return [200, { data: result, meta: { total: result.length, currentPage: 1, perPage: 20, totalPages: 1 }, success: true }]
  })

  // GET site by ID (must come before /sites/:id/departments)
  mock.onGet(/\/sites\/[^/]+$/).reply((config) => {
    const id = config.url?.split('/sites/')[1]?.split('/')[0]
    const site = sites.find((s) => s.id === id)
    if (!site) return [404, { success: false, message: 'Site non trouve' }]
    return [200, { data: site, success: true }]
  })

  // POST create site
  mock.onPost('/sites').reply((config) => {
    const body = JSON.parse(config.data)
    const newSite = { ...body, id: 'site-' + Date.now(), departments: [] }
    sites.push(newSite)
    return [201, { data: newSite, success: true }]
  })

  // PUT update site
  mock.onPut(/\/sites\/[^/]+$/).reply((config) => {
    const id = config.url?.split('/sites/')[1]?.split('/')[0]
    const body = JSON.parse(config.data)
    const index = sites.findIndex((s) => s.id === id)
    if (index === -1) return [404, { success: false, message: 'Site non trouve' }]
    sites[index] = { ...sites[index], ...body }
    return [200, { data: sites[index], success: true }]
  })

  // DELETE site
  mock.onDelete(/\/sites\/[^/]+$/).reply((config) => {
    const id = config.url?.split('/sites/')[1]?.split('/')[0]
    sites = sites.filter((s) => s.id !== id)
    return [200, { success: true }]
  })

  // --- Departments flat-list endpoints ---

  // GET all departments
  mock.onGet('/departments').reply((config) => {
    let result = departments
    const siteId = config.params?.siteId
    const companyId = config.params?.companyId
    if (siteId) result = result.filter((d) => d.siteId === siteId)
    if (companyId) result = result.filter((d) => d.companyId === companyId)
    return [200, { data: result, meta: { total: result.length, currentPage: 1, perPage: 20, totalPages: 1 }, success: true }]
  })

  // GET department by ID
  mock.onGet(/\/departments\/[^/]+$/).reply((config) => {
    const id = config.url?.split('/departments/')[1]
    const dept = departments.find((d) => d.id === id)
    if (!dept) return [404, { success: false, message: 'Departement non trouve' }]
    return [200, { data: dept, success: true }]
  })

  // POST create department
  mock.onPost('/departments').reply((config) => {
    const body = JSON.parse(config.data)
    const newDept = { ...body, id: 'dept-' + Date.now() }
    departments.push(newDept)
    return [201, { data: newDept, success: true }]
  })

  // PUT update department
  mock.onPut(/\/departments\/[^/]+$/).reply((config) => {
    const id = config.url?.split('/departments/')[1]
    const body = JSON.parse(config.data)
    const index = departments.findIndex((d) => d.id === id)
    if (index === -1) return [404, { success: false, message: 'Departement non trouve' }]
    departments[index] = { ...departments[index], ...body }
    return [200, { data: departments[index], success: true }]
  })

  // DELETE department
  mock.onDelete(/\/departments\/[^/]+$/).reply((config) => {
    const id = config.url?.split('/departments/')[1]
    departments = departments.filter((d) => d.id !== id)
    return [200, { success: true }]
  })

  // --- Company endpoints ---

  mock.onGet('/companies').reply(200, { data: mockCompanies, success: true })

  mock.onGet(/\/companies\/[^/]+$/).reply((config) => {
    const id = config.url?.split('/').pop()
    const company = mockCompanies.find((c) => c.id === id)
    if (company) return [200, { data: company, success: true }]
    return [404, { message: 'Entreprise non trouvee' }]
  })

  mock.onPost('/companies').reply((config) => {
    const data = JSON.parse(config.data)
    const newCompany = {
      ...data,
      id: 'c' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sites: [],
      employeeCount: 0,
    }
    return [201, { data: newCompany, success: true }]
  })

  mock.onPut(/\/companies\/[^/]+$/).reply((config) => {
    const id = config.url?.split('/').pop()
    const company = mockCompanies.find((c) => c.id === id)
    if (company) {
      return [200, { data: { ...company, ...JSON.parse(config.data), updatedAt: new Date().toISOString() }, success: true }]
    }
    return [404, { message: 'Entreprise non trouvee' }]
  })

  mock.onPatch(/\/companies\/[^/]+\/toggle-active/).reply((config) => {
    const parts = config.url?.split('/')
    const id = parts?.[2]
    const company = mockCompanies.find((c) => c.id === id)
    if (company) return [200, { data: { ...company, isActive: !company.isActive }, success: true }]
    return [404, { message: 'Entreprise non trouvee' }]
  })

  mock.onGet(/\/companies\/[^/]+\/sites/).reply((config) => {
    const id = config.url?.split('/')[2]
    const company = mockCompanies.find((c) => c.id === id)
    return [200, { data: company?.sites ?? [], success: true }]
  })

  mock.onGet(/\/sites\/[^/]+\/departments/).reply((config) => {
    const siteId = config.url?.split('/')[2]
    for (const company of mockCompanies) {
      const site = company.sites?.find((s) => s.id === siteId)
      if (site) return [200, { data: site.departments ?? [], success: true }]
    }
    return [200, { data: [], success: true }]
  })
}
