import { ref, computed } from 'vue'
import { defineStore, getActivePinia, type Store } from 'pinia'
import { authApi } from '@/services/api/auth.api'
import { initEcho, disconnectEcho } from '@/services/echo'
import { subscriptionApi } from '@/services/api/subscription.api'
import type { User, LoginPayload } from '@/types'
import type { UserRole } from '@/types/enums'

const APP_STORAGE_KEYS = ['access_token', 'refresh_token', 'auth_user', 'active_company_id', 'active_company_name'] as const

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  const userRole = computed(() => user.value?.role ?? null)
  const userCompanyId = computed(() => user.value?.companyId ?? null)
  const fullName = computed(() => user.value ? `${user.value.firstName} ${user.value.lastName}` : '')
  const isSupportIt = computed(() => user.value?.role === 'support_it')
  const isSuperAdmin = computed(() => user.value?.role === 'super_admin')
  const isAdminEnterprise = computed(() => user.value?.role === 'admin_enterprise')

  async function login(payload: LoginPayload) {
    isLoading.value = true
    try {
      const response = await authApi.login(payload)
      accessToken.value = response.accessToken
      refreshToken.value = response.refreshToken ?? null
      user.value = response.user
      localStorage.setItem('access_token', response.accessToken)
      if (response.refreshToken) localStorage.setItem('refresh_token', response.refreshToken)
      localStorage.setItem('auth_user', JSON.stringify(response.user))
      initEcho()
      // Hydrate l'abonnement de la compagnie pour activer le feature-gating sans
      // attendre la 1re visite de /abonnement. Best-effort (ignore les erreurs).
      hydrateSubscription()
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Best-effort fetch du SubscriptionState courant. Importe dynamiquement le store
   * pour eviter une dependance cyclique au boot.
   */
  async function hydrateSubscription() {
    try {
      const state = await subscriptionApi.me()
      const mod = await import('@/stores/subscription.store')
      mod.useSubscriptionStore().state = state
    } catch { /* utilisateur sans compagnie / route 404, on ignore */ }
  }

  function logout() {
    disconnectEcho()
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    for (const key of APP_STORAGE_KEYS) {
      try { localStorage.removeItem(key) } catch { /* ignore */ }
    }
    // Reset tous les autres stores Pinia pour eviter les fuites entre utilisateurs.
    try {
      const pinia = getActivePinia()
      if (pinia) {
        const stores = (pinia as unknown as { _s: Map<string, Store> })._s
        stores?.forEach((store, id) => {
          if (id === 'auth') return
          if (typeof (store as Store & { $reset?: () => void }).$reset === 'function') {
            try { (store as Store & { $reset: () => void }).$reset() } catch { /* ignore */ }
          }
        })
      }
    } catch { /* ignore */ }
    authApi.logout().catch(() => {})
  }

  function loadFromStorage() {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return
      accessToken.value = token
      const storedRefresh = localStorage.getItem('refresh_token')
      if (storedRefresh) refreshToken.value = storedRefresh
      const storedUser = localStorage.getItem('auth_user')
      if (storedUser) {
        try {
          user.value = JSON.parse(storedUser) as User
        } catch (err) {
          console.warn('[auth] localStorage auth_user invalide, nettoyage', err)
          user.value = null
          accessToken.value = null
          for (const key of APP_STORAGE_KEYS) {
            try { localStorage.removeItem(key) } catch { /* ignore */ }
          }
        }
      }
    } catch (err) {
      console.warn('[auth] acces localStorage indisponible', err)
    }
    if (accessToken.value && user.value) {
      hydrateSubscription()
    }
  }

  function hasRole(role: UserRole): boolean {
    return user.value?.role === role
  }

  async function updateProfile(data: { firstName: string; lastName: string }) {
    user.value = await authApi.updateProfile(data)
    persistUser()
  }

  async function changePassword(data: { currentPassword: string; newPassword: string; newPasswordConfirmation: string }) {
    await authApi.changePassword(data)
  }

  // On login success, also persist user
  function persistUser() {
    if (user.value) {
      localStorage.setItem('auth_user', JSON.stringify(user.value))
    }
  }

  return { user, accessToken, refreshToken, isLoading, isAuthenticated, userRole, userCompanyId, fullName, isSupportIt, isSuperAdmin, isAdminEnterprise, login, logout, loadFromStorage, hasRole, persistUser, updateProfile, changePassword }
})
