import { createRouter, createWebHistory } from 'vue-router'
import { authGuard } from './guards'
import authRoutes from './routes/auth.routes'
import dashboardRoutes from './routes/dashboard.routes'
import analyticsRoutes from './routes/analytics.routes'
import pointageRfidRoutes from './routes/pointage-rfid.routes'
import organisationRoutes from './routes/organisation.routes'
import pointageQrcodeRoutes from './routes/pointage-qrcode.routes'
import biometriqueRoutes from './routes/biometrique.routes'
import firmwareRoutes from './routes/firmware.routes'
import feelbackRoutes from './routes/feelback.routes'
import marketplaceRoutes from './routes/marketplace.routes'
import settingsRoutes from './routes/settings.routes'
import paieRoutes from './routes/paie.routes'
import publicRoutes from './routes/public.routes'
import demoRoutes from './routes/demo.routes'
import supportItRoutes from './routes/support-it.routes'
import whatsNewRoutes from './routes/whats-new.routes'
import { abonnementRoutes } from './routes/abonnement.routes'
import { crmRoutes } from './routes/crm.routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...publicRoutes,
    ...demoRoutes,
    ...authRoutes,
    ...dashboardRoutes,
    ...analyticsRoutes,
    ...organisationRoutes,
    ...pointageRfidRoutes,
    ...pointageQrcodeRoutes,
    ...biometriqueRoutes,
    ...firmwareRoutes,
    ...feelbackRoutes,
    ...marketplaceRoutes,
    ...settingsRoutes,
    ...paieRoutes,
    ...supportItRoutes,
    ...whatsNewRoutes,
    ...abonnementRoutes,
    ...crmRoutes,
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
