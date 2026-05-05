import type { RouteRecordRaw } from 'vue-router'
import { UserRole } from '@/types/enums'

const supportItRoutes: RouteRecordRaw[] = [
  {
    path: '/support-it',
    meta: {
      requiresAuth: true,
      layout: 'dashboard',
      module: 'support-it',
      roles: [UserRole.SUPPORT_IT, UserRole.SUPER_ADMIN],
    },
    children: [
      {
        path: '',
        name: 'support-dashboard',
        component: () => import('@/pages/support-it/SupportDashboardPage.vue'),
        meta: {
          title: 'Support IT — Dashboard',
          roles: [UserRole.SUPPORT_IT, UserRole.SUPER_ADMIN],
        },
      },
      {
        path: 'health',
        name: 'support-health',
        component: () => import('@/pages/support-it/SystemHealthPage.vue'),
        meta: { title: 'Santé système', roles: [UserRole.SUPPORT_IT, UserRole.SUPER_ADMIN] },
      },
      {
        path: 'devices',
        name: 'support-devices',
        component: () => import('@/pages/support-it/DevicesMonitorPage.vue'),
        meta: { title: 'Capteurs', roles: [UserRole.SUPPORT_IT, UserRole.SUPER_ADMIN] },
      },
      {
        path: 'devices/:kind/:id',
        name: 'support-device-detail',
        component: () => import('@/pages/support-it/DeviceDetailPage.vue'),
        meta: { title: 'Détail capteur', roles: [UserRole.SUPPORT_IT, UserRole.SUPER_ADMIN] },
      },
      {
        path: 'witnesses',
        name: 'support-witnesses',
        component: () => import('@/pages/support-it/WitnessDevicesPage.vue'),
        meta: { title: 'Capteurs témoins', roles: [UserRole.SUPPORT_IT, UserRole.SUPER_ADMIN] },
      },
      {
        path: 'alerts',
        name: 'support-alerts',
        component: () => import('@/pages/support-it/AlertsPage.vue'),
        meta: { title: 'Alertes', roles: [UserRole.SUPPORT_IT, UserRole.SUPER_ADMIN] },
      },
    ],
  },
]

export default supportItRoutes
