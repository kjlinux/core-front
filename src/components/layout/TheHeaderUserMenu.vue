<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { onClickOutside } from '@vueuse/core'
import { UserCircleIcon, ArrowRightOnRectangleIcon, Cog6ToothIcon } from '@heroicons/vue/24/outline'
import { ROLE_LABELS } from '@/utils/constants'

const auth = useAuthStore()
const router = useRouter()
const isOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

onClickOutside(menuRef, () => {
  isOpen.value = false
})

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div ref="menuRef" class="relative">
    <button
      type="button"
      class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
      @click="isOpen = !isOpen"
    >
      <UserCircleIcon class="h-8 w-8 text-gray-400" />
      <div v-if="auth.user" class="hidden text-left md:block">
        <p class="font-medium">{{ auth.fullName }}</p>
        <p class="text-xs text-gray-500">{{ ROLE_LABELS[auth.user.role] }}</p>
      </div>
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
    >
      <RouterLink
        to="/settings/profile"
        class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        @click="isOpen = false"
      >
        <Cog6ToothIcon class="h-4 w-4" />
        Mon profil
      </RouterLink>
      <hr class="my-1 border-gray-200" />
      <button
        type="button"
        class="flex w-full items-center gap-2 px-4 py-2 text-sm text-danger-600 hover:bg-gray-100"
        @click="handleLogout"
      >
        <ArrowRightOnRectangleIcon class="h-4 w-4" />
        Se deconnecter
      </button>
    </div>
  </div>
</template>
