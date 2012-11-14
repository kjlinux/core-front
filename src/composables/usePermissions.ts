import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { hasPermission } from '@/utils/permissions'
import { UserRole } from '@/types/enums'

export function usePermissions() {
  const auth = useAuthStore()

  function can(module: string, action: string) {
    return computed(() => {
      if (!auth.user) return false
      return hasPermission(
        auth.user.role,
        module as Parameters<typeof hasPermission>[1],
        action as Parameters<typeof hasPermission>[2],
      )
    })
  }

  const isSuperAdmin = computed(() => auth.user?.role === UserRole.SUPER_ADMIN)
  const isAdminEnterprise = computed(() => auth.user?.role === UserRole.ADMIN_ENTERPRISE)
  const isManager = computed(() => auth.user?.role === UserRole.MANAGER)

  return { can, isSuperAdmin, isAdminEnterprise, isManager }
}
