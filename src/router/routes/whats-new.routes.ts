import type { RouteRecordRaw } from 'vue-router'

/**
 * Presentation des nouveautes de la version courante.
 * Accessible a TOUS les roles authentifies (le contenu est filtre par role dans la
 * page elle-meme). layout 'none' => plein ecran, sans sidebar ni en-tete, pour une
 * presentation immersive. L'employe etant normalement confine a /mon-espace, ce
 * chemin est explicitement autorise dans le guard de routage (cf. guards.ts).
 */
const whatsNewRoutes: RouteRecordRaw[] = [
  {
    path: '/nouveautes',
    name: 'whats-new',
    component: () => import('@/pages/whats-new/WhatsNewPage.vue'),
    meta: {
      requiresAuth: true,
      title: 'Nouveautes',
      layout: 'none',
    },
  },
]

export default whatsNewRoutes
