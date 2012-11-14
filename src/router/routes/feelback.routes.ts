import type { RouteRecordRaw } from 'vue-router'

const feelbackRoutes: RouteRecordRaw[] = [
  {
    path: '/feelback',
    meta: { requiresAuth: true, layout: 'dashboard', module: 'feelback' },
    children: [
      { path: '', name: 'feelback-dashboard', component: () => import('@/pages/feelback/dashboard/FeelbackDashboardPage.vue'), meta: { title: 'Feelback' } },
      { path: 'devices', name: 'feelback-devices', component: () => import('@/pages/feelback/devices/FeelbackDeviceListPage.vue'), meta: { title: 'Appareils Feelback' } },
      { path: 'devices/register', name: 'feelback-device-register', component: () => import('@/pages/feelback/devices/FeelbackDeviceRegisterPage.vue'), meta: { title: 'Enregistrer appareil' } },
      { path: 'devices/:id', name: 'feelback-device-detail', component: () => import('@/pages/feelback/devices/FeelbackDeviceDetailPage.vue'), meta: { title: 'Detail appareil' } },
      { path: 'data', name: 'feelback-data', component: () => import('@/pages/feelback/data/FeelbackDataPage.vue'), meta: { title: 'Donnees' } },
      { path: 'data/by-agency', name: 'feelback-by-agency', component: () => import('@/pages/feelback/data/FeelbackByAgencyPage.vue'), meta: { title: 'Par agence' } },
      { path: 'data/comparison', name: 'feelback-comparison', component: () => import('@/pages/feelback/data/FeelbackComparisonPage.vue'), meta: { title: 'Comparaison' } },
      { path: 'alerts', name: 'feelback-alerts', component: () => import('@/pages/feelback/alerts/AlertListPage.vue'), meta: { title: 'Alertes' } },
      { path: 'alerts/settings', name: 'feelback-alert-settings', component: () => import('@/pages/feelback/alerts/AlertSettingsPage.vue'), meta: { title: 'Parametres alertes' } },
    ],
  },
]

export default feelbackRoutes
