import type { RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import type { UserRole } from '@/types/enums'

export function authGuard(to: RouteLocationNormalized, _from: RouteLocationNormalized) {
  const auth = useAuthStore()

  if (to.meta.requiresAuth !== false && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.roles) {
    const allowedRoles = to.meta.roles as UserRole[]
    if (auth.user && !allowedRoles.includes(auth.user.role)) {
      return { name: 'dashboard' }
    }
  }

  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
}
