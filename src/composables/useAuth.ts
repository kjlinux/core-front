import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import type { LoginPayload, UserRole } from '@/types'

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()

  const user = computed(() => authStore.user)
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const userRole = computed(() => authStore.userRole)
  const fullName = computed(() => authStore.fullName)

  async function login(payload: LoginPayload) {
    await authStore.login(payload)
    authStore.persistUser()
    router.push('/')
  }

  function logout() {
    authStore.logout()
    router.push('/login')
  }

  function hasRole(role: UserRole): boolean {
    return authStore.hasRole(role)
  }

  return {
    user,
    isAuthenticated,
    userRole,
    fullName,
    login,
    logout,
    hasRole,
  }
}
