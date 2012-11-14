import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authApi } from '@/services/api/auth.api'
import type { User, LoginPayload } from '@/types'
import type { UserRole } from '@/types/enums'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  const userRole = computed(() => user.value?.role ?? null)
  const userCompanyId = computed(() => user.value?.companyId ?? null)
  const fullName = computed(() => user.value ? `${user.value.firstName} ${user.value.lastName}` : '')

  async function login(payload: LoginPayload) {
    isLoading.value = true
    try {
      const response = await authApi.login(payload)
      accessToken.value = response.accessToken
      user.value = response.user
      localStorage.setItem('access_token', response.accessToken)
      localStorage.setItem('refresh_token', response.refreshToken)
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    user.value = null
    accessToken.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  function loadFromStorage() {
    const token = localStorage.getItem('access_token')
    if (token) {
      accessToken.value = token
      // In real app, decode JWT or call getCurrentUser
      // For mock, we store user in localStorage too
      const storedUser = localStorage.getItem('auth_user')
      if (storedUser) {
        user.value = JSON.parse(storedUser)
      }
    }
  }

  function hasRole(role: UserRole): boolean {
    return user.value?.role === role
  }

  // On login success, also persist user
  function persistUser() {
    if (user.value) {
      localStorage.setItem('auth_user', JSON.stringify(user.value))
    }
  }

  return { user, accessToken, isLoading, isAuthenticated, userRole, userCompanyId, fullName, login, logout, loadFromStorage, hasRole, persistUser }
})
