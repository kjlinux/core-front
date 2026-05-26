import type { RouteRecordRaw } from 'vue-router'
import { UserRole } from '@/types/enums'

export const abonnementRoutes: RouteRecordRaw[] = [
  {
    path: '/abonnement',
    meta: {
      requiresAuth: true,
      layout: 'dashboard',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE],
    },
    children: [
      {
        path: '',
        name: 'abonnement',
        component: () => import('@/pages/abonnement/AbonnementPage.vue'),
        meta: { title: 'Mon abonnement' },
      },
      {
        path: 'plans',
        name: 'abonnement-plans',
        component: () => import('@/pages/abonnement/PlanSelectionPage.vue'),
        meta: { title: 'Choisir un abonnement' },
      },
      {
        path: 'history',
        name: 'abonnement-history',
        component: () => import('@/pages/abonnement/SubscriptionHistoryPage.vue'),
        meta: { title: 'Historique des paiements' },
      },
    ],
  },
]
