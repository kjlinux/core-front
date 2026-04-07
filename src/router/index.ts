import { createRouter, createWebHistory } from 'vue-router'
import { authGuard } from './guards'
import authRoutes from './routes/auth.routes'
import dashboardRoutes from './routes/dashboard.routes'
import pointageRfidRoutes from './routes/pointage-rfid.routes'
import pointageQrcodeRoutes from './routes/pointage-qrcode.routes'
import biometriqueRoutes from './routes/biometrique.routes'
import firmwareRoutes from './routes/firmware.routes'
import feelbackRoutes from './routes/feelback.routes'
import marketplaceRoutes from './routes/marketplace.routes'
import settingsRoutes from './routes/settings.routes'
import paieRoutes from './routes/paie.routes'
import publicRoutes from './routes/public.routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...publicRoutes,
    ...authRoutes,
    ...dashboardRoutes,
    ...pointageRfidRoutes,
    ...pointageQrcodeRoutes,
    ...biometriqueRoutes,
    ...firmwareRoutes,
    ...feelbackRoutes,
    ...marketplaceRoutes,
    ...settingsRoutes,
    ...paieRoutes,
    {
      path: '/choisir-entreprise',
      name: 'technicien-select-company',
      component: () => import('@/pages/TechnicienSelectCompanyPage.vue'),
      meta: { requiresAuth: true, layout: 'blank' },
    },
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
