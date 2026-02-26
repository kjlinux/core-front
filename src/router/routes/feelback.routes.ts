import type { RouteRecordRaw } from 'vue-router'
import { UserRole } from '@/types/enums'

const feelbackRoutes: RouteRecordRaw[] = [
  {
    path: '/feelback',
    meta: { requiresAuth: true, layout: 'dashboard', module: 'feelback' },
    children: [
      {
        path: '',
        name: 'feelback-dashboard',
        component: () => import('@/pages/feelback/FeelbackDashboardPage.vue'),
        meta: { title: 'Tableau de bord Feelback' },
      },
      {
        path: 'analytics',
        name: 'feelback-analytics',
        component: () => import('@/pages/feelback/SatisfactionAnalyticsPage.vue'),
        meta: { title: 'Analyse de satisfaction' },
      },
      {
        path: 'data',
        name: 'feelback-data',
        component: () => import('@/pages/feelback/FeelbackRawDataPage.vue'),
        meta: { title: 'Donnees brutes' },
      },
      {
        path: 'devices',
        name: 'feelback-devices',
        component: () => import('@/pages/feelback/DeviceManagementPage.vue'),
        meta: { title: 'Terminaux Feelback', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE] },
      },
      {
        path: 'alerts',
        name: 'feelback-alerts',
        component: () => import('@/pages/feelback/AlertManagementPage.vue'),
        meta: { title: 'Alertes Feelback', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE] },
      },
      {
        path: 'comparison',
        name: 'feelback-comparison',
        component: () => import('@/pages/feelback/SiteComparisonPage.vue'),
        meta: { title: 'Comparaison par site' },
      },
      {
        path: 'reports',
        name: 'feelback-reports',
        component: () => import('@/pages/feelback/FeelbackReportsPage.vue'),
        meta: { title: 'Rapports Feelback' },
      },
      {
        path: 'settings',
        name: 'feelback-settings',
        component: () => import('@/pages/feelback/FeelbackSettingsPage.vue'),
        meta: { title: 'Configuration Feelback', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE] },
      },
    ],
  },
]

export default feelbackRoutes
