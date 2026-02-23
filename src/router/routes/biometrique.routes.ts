import type { RouteRecordRaw } from 'vue-router'

const biometriqueRoutes: RouteRecordRaw[] = [
  {
    path: '/biometrique',
    meta: { requiresAuth: true, layout: 'dashboard', module: 'biometrique' },
    children: [
      {
        path: '',
        name: 'bio-dashboard',
        component: () => import('@/pages/biometrique/BiometricDashboardPage.vue'),
        meta: { title: 'Tableau de bord Biometrique' },
      },
      {
        path: 'devices',
        name: 'bio-devices',
        component: () => import('@/pages/biometrique/DeviceListPage.vue'),
        meta: { title: 'Terminaux biometriques' },
      },
      {
        path: 'devices/:id',
        name: 'bio-device-detail',
        component: () => import('@/pages/biometrique/DeviceDetailPage.vue'),
        meta: { title: 'Detail terminal' },
      },
      {
        path: 'enrollment',
        name: 'bio-enrollment-list',
        component: () => import('@/pages/biometrique/EnrollmentListPage.vue'),
        meta: { title: 'Inscriptions biometriques' },
      },
      {
        path: 'enrollment/new',
        name: 'bio-enrollment-new',
        component: () => import('@/pages/biometrique/EnrollmentPage.vue'),
        meta: { title: 'Nouvelle inscription' },
      },
      {
        path: 'inconsistencies',
        name: 'bio-inconsistencies',
        component: () => import('@/pages/biometrique/InconsistenciesPage.vue'),
        meta: { title: 'Incoherences biometriques' },
      },
      {
        path: 'audit-log',
        name: 'bio-audit',
        component: () => import('@/pages/biometrique/AuditLogPage.vue'),
        meta: { title: "Journal d'audit" },
      },
    ],
  },
]

export default biometriqueRoutes
