import type { User } from '@/types'
import type { UserRole } from '@/types/enums'

export interface MockUser extends User {
  password: string
}

export const mockUsers: MockUser[] = [
  {
    id: 'u1',
    email: 'admin@tanga.com',
    password: 'admin123',
    firstName: 'Amadou',
    lastName: 'Diallo',
    role: 'super_admin' as UserRole,
    companyId: null,
    isActive: true,
    createdAt: '2024-01-15T08:00:00Z',
  },
  {
    id: 'u2',
    email: 'admin@orange-bf.com',
    password: 'admin123',
    firstName: 'Fatou',
    lastName: 'Ouedraogo',
    role: 'admin_enterprise' as UserRole,
    companyId: 'c1',
    isActive: true,
    createdAt: '2024-02-10T09:00:00Z',
  },
  {
    id: 'u3',
    email: 'manager@orange-bf.com',
    password: 'admin123',
    firstName: 'Ibrahim',
    lastName: 'Sawadogo',
    role: 'manager' as UserRole,
    companyId: 'c1',
    isActive: true,
    createdAt: '2024-03-05T10:00:00Z',
  },
  {
    id: 'u4',
    email: 'admin@coris.com',
    password: 'admin123',
    firstName: 'Aissata',
    lastName: 'Traore',
    role: 'admin_enterprise' as UserRole,
    companyId: 'c2',
    isActive: true,
    createdAt: '2024-03-20T08:30:00Z',
  },
  {
    id: 'u5',
    email: 'manager@coris.com',
    password: 'admin123',
    firstName: 'Moussa',
    lastName: 'Kabore',
    role: 'manager' as UserRole,
    companyId: 'c2',
    isActive: true,
    createdAt: '2024-04-01T09:15:00Z',
  },
]
