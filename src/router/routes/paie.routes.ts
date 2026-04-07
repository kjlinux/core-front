import type { RouteRecordRaw } from 'vue-router'
import { UserRole } from '@/types/enums'

const paieRoutes: RouteRecordRaw[] = [
  {
    path: '/paie',
    meta: { requiresAuth: true, layout: 'dashboard' },
    children: [
      {
        path: 'configuration',
        name: 'paie-config',
        component: () => import('@/pages/paie/PayrollConfigPage.vue'),
        meta: {
          title: 'Configuration paie',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE],
        },
      },
      {
        path: 'generer',
        name: 'paie-generate',
        component: () => import('@/pages/paie/PayrollGeneratePage.vue'),
        meta: {
          title: 'Génération fiches de paie',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE],
        },
      },
    ],
  },
  {
    path: '/mon-espace',
    meta: { requiresAuth: true, layout: 'dashboard' },
    children: [
      {
        path: '',
        name: 'employee-portal',
        component: () => import('@/pages/portail-employe/EmployeePortalPage.vue'),
        meta: {
          title: 'Mon espace',
        },
      },
    ],
  },
]

export default paieRoutes
