import type { RouteRecordRaw } from 'vue-router'
import { UserRole } from '@/types/enums'

export const crmRoutes: RouteRecordRaw[] = [
  {
    path: '/crm',
    meta: {
      requiresAuth: true,
      layout: 'dashboard',
      // Usage interne TANGA GROUP (chargés de compte + super_admin), pas les clients.
      roles: [UserRole.SUPER_ADMIN, UserRole.TECHNICIEN],
    },
    children: [
      {
        path: 'followups',
        name: 'crm-followups',
        component: () => import('@/pages/crm/followups/FollowupsListPage.vue'),
        meta: { title: 'Routine clients' },
      },
      {
        path: 'followups/dashboard',
        name: 'crm-followups-dashboard',
        component: () => import('@/pages/crm/followups/FollowupDashboardPage.vue'),
        meta: { title: 'Routine clients - Tableau de bord' },
      },
      {
        path: 'followups/:id',
        name: 'crm-followup-detail',
        component: () => import('@/pages/crm/followups/FollowupDetailPage.vue'),
        meta: { title: 'Appel de suivi' },
      },
    ],
  },
]
