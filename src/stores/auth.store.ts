import { ref, computed } from 'vue'
import { defineStore, getActivePinia, type Store } from 'pinia'
import { authApi } from '@/services/api/auth.api'
import { initEcho, disconnectEcho } from '@/services/echo'
import { subscriptionApi } from '@/services/api/subscription.api'
import type { User, LoginPayload } from '@/types'
import type { UserRole } from '@/types/enums'

const APP_STORAGE_KEYS = ['access_token', 'refresh_token', 'auth_user', 'active_company_id', 'active_company_name', 'impersonation', 'impersonation_origin'] as const

/** Identité affichée dans la bannière pendant une prise de contrôle support. */
export interface ImpersonationState {
  companyName: string
  userName: string
  impersonatorName: string
}

/** Payload retourné par les endpoints /support/.../impersonate. */
interface ImpersonationResult {
  accessToken: string
  user: User
  impersonator: { id: string; name: string }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const isLoading = ref(false)
  const impersonation = ref<ImpersonationState | null>(null)

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  const isImpersonating = computed(() => impersonation.value !== null)
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

  /**
   * Prise de contrôle (support_it / super_admin) : bascule la session sur le compte
   * cible. La session support courante est sauvegardée pour pouvoir la restaurer via
   * stopImpersonation(). Pas de refresh_token pendant la prise de contrôle (session
   * courte) ; on retire aussi l'entreprise active car le compte cible scope par son
   * propre company_id.
   */
  function startImpersonation(result: ImpersonationResult, returnPath?: string) {
    const origin = {
      access_token: localStorage.getItem('access_token'),
      refresh_token: localStorage.getItem('refresh_token'),
      auth_user: localStorage.getItem('auth_user'),
      active_company_id: localStorage.getItem('active_company_id'),
      active_company_name: localStorage.getItem('active_company_name'),
      return_path: returnPath ?? null,
    }
    try { localStorage.setItem('impersonation_origin', JSON.stringify(origin)) } catch { /* ignore */ }

    accessToken.value = result.accessToken
    refreshToken.value = null
    user.value = result.user
    localStorage.setItem('access_token', result.accessToken)
    localStorage.setItem('auth_user', JSON.stringify(result.user))
    for (const key of ['refresh_token', 'active_company_id', 'active_company_name']) {
      try { localStorage.removeItem(key) } catch { /* ignore */ }
    }

    const state: ImpersonationState = {
      companyName: result.user.companyName ?? '',
      userName: `${result.user.firstName} ${result.user.lastName}`.trim() || result.user.email,
      impersonatorName: result.impersonator?.name ?? '',
    }
    impersonation.value = state
    try { localStorage.setItem('impersonation', JSON.stringify(state)) } catch { /* ignore */ }

    disconnectEcho()
    initEcho()
    hydrateSubscription()
  }

  /**
   * Quitte la prise de contrôle et restaure la session support d'origine.
   * Retourne la route à rouvrir (celle d'où la prise de contrôle a été lancée),
   * ou null si la session n'a pas pu être restaurée (logout effectué).
   */
  function stopImpersonation(): string | null {
    let restored = false
    let returnPath: string | null = null
    try {
      const raw = localStorage.getItem('impersonation_origin')
      if (raw) {
        const origin = JSON.parse(raw) as Record<string, string | null | undefined>
        const setOrRemove = (key: string, value: string | null | undefined) => {
          if (value) { localStorage.setItem(key, value) } else { localStorage.removeItem(key) }
        }
        setOrRemove('access_token', origin.access_token)
        setOrRemove('refresh_token', origin.refresh_token)
        setOrRemove('auth_user', origin.auth_user)
        setOrRemove('active_company_id', origin.active_company_id)
        setOrRemove('active_company_name', origin.active_company_name)
        accessToken.value = origin.access_token ?? null
        refreshToken.value = origin.refresh_token ?? null
        user.value = origin.auth_user ? (JSON.parse(origin.auth_user) as User) : null
        returnPath = origin.return_path ?? null
        restored = true
      }
    } catch { /* ignore, fallback ci-dessous */ }

    impersonation.value = null
    try { localStorage.removeItem('impersonation') } catch { /* ignore */ }
    try { localStorage.removeItem('impersonation_origin') } catch { /* ignore */ }

    if (!restored) {
      logout()
      return null
    }

    disconnectEcho()
    initEcho()
    hydrateSubscription()
    return returnPath
  }

  function logout() {
    disconnectEcho()
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    impersonation.value = null
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
    try {
      const storedImpersonation = localStorage.getItem('impersonation')
      if (storedImpersonation) {
        impersonation.value = JSON.parse(storedImpersonation) as ImpersonationState
      }
    } catch { /* ignore */ }
    if (accessToken.value && user.value) {
      hydrateSubscription()
    }
  }

  function hasRole(role: UserRole): boolean {
    return user.value?.role === role
  }

  async function updateProfile(data: { firstName: string; lastName: string; phone?: string }) {
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

  return { user, accessToken, refreshToken, isLoading, impersonation, isAuthenticated, isImpersonating, userRole, userCompanyId, fullName, isSupportIt, isSuperAdmin, isAdminEnterprise, login, logout, loadFromStorage, hasRole, persistUser, updateProfile, changePassword, startImpersonation, stopImpersonation }
})
