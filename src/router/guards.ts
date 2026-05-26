import type { RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useActiveCompanyStore } from '@/stores/active-company.store'
import { useSubscriptionStore } from '@/stores/subscription.store'
import { PLAN_FEATURES } from '@/config/plan-features'
import type { UserRole } from '@/types/enums'
import type { PlanCode, PlanFeature } from '@/types/subscription'

export function authGuard(to: RouteLocationNormalized, _from: RouteLocationNormalized) {
  const auth = useAuthStore()

  const publicRoutes = ['login', 'forgot-password', 'qr-scan-public']
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
    .find((r) => (r.meta as any)?.requiredFeature)
  if (matchedWithFeature && auth.user?.role !== 'super_admin') {
    const required = (matchedWithFeature.meta as any).requiredFeature as PlanFeature
    const subs = useSubscriptionStore()
    const plan = (subs.state?.subscription as PlanCode) ?? 'freemium'
    const allowed = PLAN_FEATURES[plan] ?? []
    if (!allowed.includes(required)) {
      // Seuls admin_enterprise et super_admin peuvent gerer l'abonnement
      // (cf. abonnement.routes.ts). Les autres roles vont au dashboard pour eviter
      // une boucle role-guard <-> plan-guard.
      const canManage = auth.user?.role === 'admin_enterprise'
      return canManage
        ? { name: 'abonnement-plans', query: { feature: required } }
        : { name: 'dashboard' }
    }
  }

  // Employe: can only access /mon-espace and /parametres/profile
  if (auth.isAuthenticated && auth.user?.role === 'employe') {
    const allowed = ['/mon-espace', '/parametres/profile']
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
