export interface Employee {
  id: string
  companyId: string
  siteId: string
  departmentId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  position: string
  employeeNumber: string
  avatar?: string
  isActive: boolean
  hireDate: string
  rfidCardId?: string
  biometricEnrolled: boolean
  createdAt: string
}

export interface EmployeeFilters {
  search?: string
  companyId?: string
  siteId?: string
  departmentId?: string
  isActive?: boolean
  page: number
  perPage: number
}
