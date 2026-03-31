import type { UserRole } from '@/types/enums'

export type Action = 'view' | 'create' | 'edit' | 'delete' | 'export'

export type Module =
  | 'dashboard'
  | 'pointage-rfid'
  | 'biometrique'
  | 'feelback'
  | 'marketplace'
  | 'settings'
  | 'pointage-qrcode'
  | 'firmware'

const allRoles: UserRole[] = ['super_admin', 'admin_enterprise', 'manager', 'technicien']
const adminRoles: UserRole[] = ['super_admin', 'admin_enterprise']
const setupRoles: UserRole[] = ['super_admin', 'admin_enterprise', 'technicien']
const superOnly: UserRole[] = ['super_admin']
const superAndTech: UserRole[] = ['super_admin', 'technicien']
const clientRoles: UserRole[] = ['super_admin', 'admin_enterprise', 'manager']
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
    create: setupRoles,
    edit: setupRoles,
    delete: superAndTech,
    export: adminRoles,
  },
  biometrique: {
    view: allRoles,
    create: setupRoles,
    edit: setupRoles,
    delete: superAndTech,
    export: adminRoles,
  },
  feelback: {
    view: clientRoles,
    create: adminRoles,
    edit: adminRoles,
    delete: superOnly,
    export: adminRoles,
  },
  marketplace: {
    view: clientRoles,
    create: superOnly,
    edit: superOnly,
    delete: superOnly,
    export: adminRoles,
  },
  settings: {
    view: setupRoles,
    create: superAndTech,
    edit: setupRoles,
    delete: superOnly,
    export: none,
  },
  'pointage-qrcode': {
    view: allRoles,
    create: setupRoles,
    edit: setupRoles,
    delete: superAndTech,
    export: adminRoles,
  },
  firmware: {
    view: setupRoles,
    create: superAndTech,
    edit: superAndTech,
    delete: superAndTech,
    export: none,
  },
}

export function hasPermission(role: UserRole, module: Module, action: Action): boolean {
  const allowedRoles = permissionMatrix[module]?.[action]
  if (!allowedRoles) return false
  return allowedRoles.includes(role)
}
