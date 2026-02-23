import type { RouteRecordRaw } from 'vue-router'
import { UserRole } from '@/types/enums'

const settingsRoutes: RouteRecordRaw[] = [
  {
    path: '/parametres',
    meta: { requiresAuth: true, layout: 'dashboard' },
    children: [
      {
        path: 'profile',
        name: 'settings-profile',
        component: () => import('@/pages/parametres/ProfilePage.vue'),
        meta: { title: 'Mon profil' },
      },
      {
        path: 'entreprise',
        name: 'settings-company',
        component: () => import('@/pages/parametres/CompanySettingsPage.vue'),
        meta: { title: 'Parametres entreprise', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE] },
      },
      {
        path: 'utilisateurs',
        name: 'settings-users',
        component: () => import('@/pages/parametres/UserManagementPage.vue'),
        meta: { title: 'Gestion utilisateurs', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE] },
      },
      {
        path: 'roles',
        name: 'settings-roles',
        component: () => import('@/pages/parametres/RoleManagementPage.vue'),
        meta: { title: 'Gestion des roles', roles: [UserRole.SUPER_ADMIN] },
      },
    ],
  },
]

export default settingsRoutes
