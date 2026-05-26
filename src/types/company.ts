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
