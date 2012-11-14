import type { RouteRecordRaw } from 'vue-router'

const biometriqueRoutes: RouteRecordRaw[] = [
  {
    path: '/biometrique',
    meta: { requiresAuth: true, layout: 'dashboard', module: 'biometrique' },
    children: [
      { path: 'devices', name: 'bio-devices', component: () => import('@/pages/biometrique/devices/BiometricDeviceListPage.vue'), meta: { title: 'Appareils biometriques' } },
      { path: 'devices/:id', name: 'bio-device-detail', component: () => import('@/pages/biometrique/devices/BiometricDeviceDetailPage.vue'), meta: { title: 'Detail appareil' } },
      { path: 'enrollment', name: 'bio-enrollment-list', component: () => import('@/pages/biometrique/enrollment/EnrollmentListPage.vue'), meta: { title: 'Enrollements' } },
      { path: 'enrollment/new', name: 'bio-enrollment', component: () => import('@/pages/biometrique/enrollment/EnrollmentPage.vue'), meta: { title: 'Nouvel enrollement' } },
      { path: 'history', name: 'bio-history', component: () => import('@/pages/biometrique/history/BiometricHistoryPage.vue'), meta: { title: 'Historique biometrique' } },
      { path: 'inconsistencies', name: 'bio-inconsistencies', component: () => import('@/pages/biometrique/history/InconsistencyPage.vue'), meta: { title: 'Incoherences' } },
      { path: 'audit-log', name: 'bio-audit', component: () => import('@/pages/biometrique/security/AuditLogPage.vue'), meta: { title: "Journal d'audit" } },
    ],
  },
]

export default biometriqueRoutes
