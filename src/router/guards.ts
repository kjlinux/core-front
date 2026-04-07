import type { RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useActiveCompanyStore } from '@/stores/active-company.store'
import type { UserRole } from '@/types/enums'

export function authGuard(to: RouteLocationNormalized, _from: RouteLocationNormalized) {
  const auth = useAuthStore()

  const publicRoutes = ['login', 'forgot-password', 'qr-scan-public']
  if (!publicRoutes.includes(to.name as string) && to.meta.requiresAuth !== false && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
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
