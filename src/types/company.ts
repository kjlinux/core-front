export interface Company {
  id: string
  name: string
  logo?: string
  email: string
  phone: string
  address: string
  matriculePrefix?: string
  isActive: boolean
  subscription: 'freemium' | 'garantie' | 'premium'
  subscriptionStartsAt?: string | null
  subscriptionExpiresAt?: string | null
  subscriptionNextPeriodPaid?: boolean
  subscriptionNextExpiresAt?: string | null
  warrantyStartsAt?: string | null
  warrantyEndsAt?: string | null
  warrantyAutoRenew?: boolean
  isWarrantyActive?: boolean
  sites: Site[]
  admin?: CompanyAdmin | null
  employeeCount: number
  createdAt: string
  updatedAt: string
}

export interface CompanyAdmin {
  id: string
  name: string
  email: string
  phone?: string | null
}

export interface Site {
  id: string
  companyId: string
  name: string
  address: string
  latitude: number
  longitude: number
  geofenceRadius: number
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
