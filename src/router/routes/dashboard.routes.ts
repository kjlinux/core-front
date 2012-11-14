import type { RouteRecordRaw } from 'vue-router'

const dashboardRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/pages/dashboard/GlobalDashboardPage.vue'),
    meta: { requiresAuth: true, layout: 'dashboard', title: 'Tableau de bord' },
  },
]

export default dashboardRoutes
