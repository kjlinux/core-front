import type { UserRole } from './enums'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  companyId: string | null
  avatar?: string
  isActive: boolean
  createdAt: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface JwtPayload {
  sub: string
  role: UserRole
  companyId: string | null
  exp: number
}
