import type { RouteRecordRaw } from 'vue-router'
import { UserRole } from '@/types/enums'

const biometriqueRoutes: RouteRecordRaw[] = [
  {
    path: '/biometrique',
    meta: { requiresAuth: true, layout: 'dashboard', module: 'biometrique' },
    children: [
      {
        path: '',
        name: 'bio-dashboard',
        component: () => import('@/pages/biometrique/BiometricDashboardPage.vue'),
        meta: { title: 'Tableau de bord Biométrique' },
      },
      {
        path: 'devices',
        name: 'bio-devices',
        component: () => import('@/pages/biometrique/DeviceListPage.vue'),
        meta: {
          title: 'Terminaux biométriques',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE, UserRole.TECHNICIEN],
        },
      },
      {
        path: 'devices/:id',
        name: 'bio-device-detail',
        component: () => import('@/pages/biometrique/DeviceDetailPage.vue'),
        meta: {
          title: 'Détails terminal',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE, UserRole.TECHNICIEN],
        },
      },
      {
        path: 'enrollment',
        name: 'bio-enrollment-list',
        component: () => import('@/pages/biometrique/EnrollmentListPage.vue'),
        meta: {
          title: 'Inscriptions biométriques',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE, UserRole.TECHNICIEN],
        },
      },
      {
        path: 'enrollment/new',
        name: 'bio-enrollment-new',
        component: () => import('@/pages/biometrique/EnrollmentPage.vue'),
        meta: {
          title: 'Nouvelle inscription',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE, UserRole.TECHNICIEN],
        },
      },
      {
        path: 'attendance',
        name: 'bio-attendance',
        component: () => import('@/pages/biometrique/BiometricAttendancePage.vue'),
        meta: { title: 'Pointage biométrique' },
      },
      {
        path: 'reports',
        name: 'bio-reports',
        component: () => import('@/pages/biometrique/BiometricReportsPage.vue'),
        meta: { title: 'Rapports biométriques' },
      },
    ],
  },
]

export default biometriqueRoutes
