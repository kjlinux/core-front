export interface Company {
  id: string
  name: string
  logo?: string
  email: string
  phone: string
  address: string
  isActive: boolean
  subscription: 'basic' | 'premium' | 'enterprise'
  sites: Site[]
  employeeCount: number
  createdAt: string
  updatedAt: string
}

export interface Site {
  id: string
  companyId: string
  name: string
  address: string
  departments: Department[]
}

export interface Department {
  id: string
  siteId: string
  companyId: string
  name: string
  managerId?: string
  employeeCount: number
}
