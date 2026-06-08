import type { RouteRecordRaw } from 'vue-router'

/**
 * Page publique de démonstration. Accessible sans authentification : elle laisse
 * un prospect choisir un profil (admin entreprise, manager, employé) et lance
 * l'application en mode démo avec des données factices.
 */
const demoRoutes: RouteRecordRaw[] = [
  {
    path: '/demo',
    name: 'demo',
    component: () => import('@/pages/DemoLandingPage.vue'),
    meta: { requiresAuth: false, layout: 'none', title: 'Demonstration' },
  },
]

export default demoRoutes
