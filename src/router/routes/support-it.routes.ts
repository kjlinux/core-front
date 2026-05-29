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
          title: 'Support IT - Dashboard',
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
        path: 'companies',
        name: 'support-companies',
        component: () => import('@/pages/support-it/CompaniesHealthPage.vue'),
        meta: { title: 'Compagnies', roles: [UserRole.SUPPORT_IT, UserRole.SUPER_ADMIN] },
      },
      {
        path: 'companies/:id',
        name: 'support-company-detail',
        component: () => import('@/pages/support-it/CompanyDetailPage.vue'),
        meta: { title: 'Détail compagnie', roles: [UserRole.SUPPORT_IT, UserRole.SUPER_ADMIN] },
      },
      {
        path: 'witnesses',
        name: 'support-witnesses',
        component: () => import('@/pages/support-it/WitnessDevicesPage.vue'),
        meta: { title: 'Capteurs témoins', roles: [UserRole.SUPPORT_IT, UserRole.SUPER_ADMIN] },
      },
      {
        path: 'tickets',
        name: 'support-tickets',
        component: () => import('@/pages/support-it/TicketsPage.vue'),
        meta: { title: 'Plaintes clients', roles: [UserRole.SUPPORT_IT, UserRole.SUPER_ADMIN] },
      },
      {
        path: 'alerts',
        name: 'support-alerts',
        component: () => import('@/pages/support-it/AlertsPage.vue'),
        meta: { title: 'Alertes', roles: [UserRole.SUPPORT_IT, UserRole.SUPER_ADMIN] },
      },
      {
        path: 'mqtt-console',
        name: 'support-mqtt-console',
        component: () => import('@/pages/support-it/MqttConsolePage.vue'),
        meta: { title: 'Console MQTT', roles: [UserRole.SUPPORT_IT, UserRole.SUPER_ADMIN] },
      },
    ],
  },
]

export default supportItRoutes
