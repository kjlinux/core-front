import { createRouter, createWebHistory } from 'vue-router'
import { authGuard } from './guards'
import authRoutes from './routes/auth.routes'
import dashboardRoutes from './routes/dashboard.routes'
import pointageRfidRoutes from './routes/pointage-rfid.routes'
import biometriqueRoutes from './routes/biometrique.routes'
import feelbackRoutes from './routes/feelback.routes'
import marketplaceRoutes from './routes/marketplace.routes'
import settingsRoutes from './routes/settings.routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...authRoutes,
    ...dashboardRoutes,
    ...pointageRfidRoutes,
    ...biometriqueRoutes,
    ...feelbackRoutes,
    ...marketplaceRoutes,
    ...settingsRoutes,
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/NotFoundPage.vue'),
      meta: { layout: 'dashboard' },
    },
  ],
})

router.beforeEach(authGuard)

export default router
