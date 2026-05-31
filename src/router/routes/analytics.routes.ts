import type { RouteRecordRaw } from 'vue-router'
import { UserRole } from '@/types/enums'

const analyticsRoutes: RouteRecordRaw[] = [
  {
    path: '/analytics',
    name: 'analytics-avances',
    component: () => import('@/pages/analytics/AdvancedAnalyticsPage.vue'),
    // Volontairement PAS de meta.requiredFeature : la page reste accessible et affiche
    // un verrou (FeatureLock) avec lien vers les abonnements pour les plans inferieurs.
    meta: {
      requiresAuth: true,
      layout: 'dashboard',
      title: 'Analytics avancés',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE, UserRole.MANAGER],
    },
  },
]

export default analyticsRoutes
