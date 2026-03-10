import type { RouteRecordRaw } from 'vue-router'

const publicRoutes: RouteRecordRaw[] = [
  {
    path: '/avis/:token',
    name: 'public-review',
    component: () => import('@/pages/public/PublicReviewPage.vue'),
    meta: { requiresAuth: false, layout: 'none' },
  },
]

export default publicRoutes
