import type { UserRole } from '@/types/enums'

export type Action = 'view' | 'create' | 'edit' | 'delete' | 'export'

export type Module =
  | 'dashboard'
  | 'pointage-rfid'
  | 'biometrique'
  | 'feelback'
  | 'marketplace'
  | 'settings'

const allRoles: UserRole[] = ['super_admin', 'admin_enterprise', 'manager']
const adminRoles: UserRole[] = ['super_admin', 'admin_enterprise']
const superOnly: UserRole[] = ['super_admin']
const none: UserRole[] = []

const permissionMatrix: Record<Module, Record<Action, UserRole[]>> = {
  dashboard: {
    view: allRoles,
    create: none,
    edit: none,
    delete: none,
    export: adminRoles,
  },
  'pointage-rfid': {
    view: allRoles,
    create: adminRoles,
    edit: adminRoles,
    delete: superOnly,
    export: adminRoles,
  },
  biometrique: {
    view: allRoles,
    create: adminRoles,
    edit: adminRoles,
    delete: superOnly,
    export: adminRoles,
  },
  feelback: {
    view: allRoles,
    create: adminRoles,
    edit: adminRoles,
    delete: superOnly,
    export: adminRoles,
  },
  marketplace: {
    view: allRoles,
    create: superOnly,
    edit: superOnly,
    delete: superOnly,
    export: adminRoles,
  },
  settings: {
    view: adminRoles,
    create: superOnly,
    edit: adminRoles,
    delete: superOnly,
    export: none,
  },
}

export function hasPermission(role: UserRole, module: Module, action: Action): boolean {
  const allowedRoles = permissionMatrix[module]?.[action]
  if (!allowedRoles) return false
  return allowedRoles.includes(role)
}
