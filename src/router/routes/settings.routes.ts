import type { RouteRecordRaw } from 'vue-router'
import { UserRole } from '@/types/enums'

const settingsRoutes: RouteRecordRaw[] = [
  {
    path: '/settings',
    meta: { requiresAuth: true, layout: 'dashboard' },
    children: [
      { path: 'profile', name: 'settings-profile', component: () => import('@/pages/settings/ProfilePage.vue'), meta: { title: 'Mon profil' } },
      { path: 'company', name: 'settings-company', component: () => import('@/pages/settings/CompanySettingsPage.vue'), meta: { title: 'Parametres entreprise', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE] } },
      { path: 'users', name: 'settings-users', component: () => import('@/pages/settings/UserManagementPage.vue'), meta: { title: 'Gestion utilisateurs', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE] } },
      { path: 'roles', name: 'settings-roles', component: () => import('@/pages/settings/RoleManagementPage.vue'), meta: { title: 'Gestion roles', roles: [UserRole.SUPER_ADMIN] } },
    ],
  },
]

export default settingsRoutes
