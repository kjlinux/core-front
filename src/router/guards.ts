import type { RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useActiveCompanyStore } from '@/stores/active-company.store'
import { useSubscriptionStore } from '@/stores/subscription.store'
import { shouldAutoShowWhatsNew } from '@/composables/useWhatsNew'
import { PLAN_FEATURES } from '@/config/plan-features'
import type { UserRole } from '@/types/enums'
import type { PlanCode, PlanFeature } from '@/types/subscription'

export function authGuard(to: RouteLocationNormalized, _from: RouteLocationNormalized) {
  const auth = useAuthStore()

  const publicRoutes = ['login', 'forgot-password', 'reset-password', 'qr-scan-public']
  const isPublicRoute = publicRoutes.includes(to.name as string) || to.meta.requiresAuth === false

  if (!isPublicRoute && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Etat incoherent : un token est present mais pas de user (storage corrompu,
  // ou reponse partielle). On force la deconnexion pour eviter les acces NPE en aval.
  if (!isPublicRoute && auth.isAuthenticated && !auth.user) {
    auth.logout()
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Pour les routes publiques, on ne fait AUCUN check de rôle / entreprise active.
  // Un utilisateur même authentifié doit pouvoir accéder librement à /avis/:token, etc.
  if (isPublicRoute) {
    return
  }

  // Technicien sans entreprise active → forcer la sélection sauf sur la page dédiée
  // Le technicien peut avoir company_id = null (multi-entreprises), on vérifie le store actif
  if (auth.isAuthenticated && auth.user?.role === 'technicien') {
    const activeCompanyStore = useActiveCompanyStore()
    if (!activeCompanyStore.hasActiveCompany && to.name !== 'technicien-select-company') {
      return { name: 'technicien-select-company' }
    }
  }

  // Mise en avant des nouveautes : a la 1re arrivee sur le tableau de bord apres une
  // mise a jour, on ouvre la presentation des nouveautes (filtree par role). Une seule
  // fois : la page se marque comme vue (cf. useWhatsNew), ensuite seul le bandeau
  // "revoir" subsiste dans l'en-tete. Place AVANT la redirection support_it -> sante et
  // AVANT le confinement employe pour que tous les roles y aient droit a la connexion.
  if (
    auth.isAuthenticated &&
    auth.user &&
    to.name === 'dashboard' &&
    shouldAutoShowWhatsNew(auth.user)
  ) {
    return { name: 'whats-new' }
  }

  // support_it n'a pas de tableau de bord global : sa page d'accueil est la santé système.
  // On le redirige donc dès qu'il atterrit sur le dashboard (login frais, lien logo, etc.).
  // super_admin garde le dashboard global même s'il a aussi accès aux pages support.
  if (auth.isAuthenticated && auth.user?.role === 'support_it' && to.name === 'dashboard') {
    return { name: 'support-health' }
  }

  // Check roles from matched routes (most specific route with roles wins, then falls back to parent)
  const matchedWithRoles = to.matched
    .slice()
    .reverse()
    .find((r) => r.meta.roles)

  if (matchedWithRoles?.meta.roles) {
    const allowedRoles = matchedWithRoles.meta.roles as UserRole[]
    if (auth.user && !allowedRoles.includes(auth.user.role)) {
      return { name: 'dashboard' }
    }
  }

  // Plan gating : une route peut declarer meta.requiredFeature; super_admin bypasse.
  const matchedWithFeature = to.matched
    .slice()
    .reverse()
    .find((r) => (r.meta as { requiredFeature?: PlanFeature })?.requiredFeature)
  if (matchedWithFeature && auth.user?.role !== 'super_admin') {
    const required = (matchedWithFeature.meta as { requiredFeature?: PlanFeature }).requiredFeature as PlanFeature
    const subs = useSubscriptionStore()
    const plan = (subs.state?.subscription as PlanCode) ?? 'freemium'
    const allowed = PLAN_FEATURES[plan] ?? []
    if (!allowed.includes(required)) {
      // Seuls admin_enterprise, manager et super_admin peuvent gerer l'abonnement
      // (cf. abonnement.routes.ts). Les autres roles vont au dashboard pour eviter
      // une boucle role-guard <-> plan-guard.
      const canManage = auth.user?.role === 'admin_enterprise' || auth.user?.role === 'manager'
      return canManage
        ? { name: 'abonnement-plans', query: { feature: required } }
        : { name: 'dashboard' }
    }
  }

  // Employe: can only access /mon-espace, /parametres/profile et la page nouveautes
  if (auth.isAuthenticated && auth.user?.role === 'employe') {
    const allowed = ['/mon-espace', '/parametres/profile', '/nouveautes']
    const isAllowed = allowed.some((prefix) => to.path === prefix || to.path.startsWith(prefix + '/'))
    if (!isAllowed && to.name !== 'login') {
      return { path: '/mon-espace' }
    }
  }

  if (to.name === 'login' && auth.isAuthenticated) {
    if (auth.user?.role === 'employe') {
      return { path: '/mon-espace' }
    }
    return { name: 'dashboard' }
  }
}
