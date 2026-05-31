<script setup lang="ts">
import { computed, inject, onMounted, ref, watch, type Component, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  groupId: string
  label: string
  icon: Component
  collapsed: boolean
  active: boolean
  badgeCount?: number
  // Route du premier enfant : pour les rôles à menu court (groupes forcés dépliés),
  // cliquer l'en-tête navigue vers cette page au lieu d'être inerte.
  headerTo?: string
}>()

const router = useRouter()

const openGroupId = inject<Ref<string | null>>('sidebarOpenGroupId')
// Pour les rôles à menu court, tous les groupes sont forcés dépliés (cf. TheSidebar).
const expandAll = inject<Ref<boolean>>('sidebarExpandAllGroups', ref(false))

const isOpen = computed(() => expandAll.value || openGroupId?.value === props.groupId)

const contentRef = ref<HTMLElement | null>(null)
const contentHeight = ref('0px')

// Groupes forcés dépliés (rôles à menu court) : pas d'animation ni de mesure de hauteur.
// Le contenu reste libre (max-height: none) donc visible quel que soit le timing de
// chargement de l'utilisateur. L'accordéon animé (contentHeight) ne sert qu'aux autres rôles.
const maxHeight = computed(() => (expandAll.value ? 'none' : contentHeight.value))

onMounted(() => {
  if (!expandAll.value && isOpen.value) {
    contentHeight.value = 'auto'
  }
})

watch(isOpen, (open) => {
  if (expandAll.value) return
  if (open && contentRef.value) {
    contentHeight.value = contentRef.value.scrollHeight + 'px'
  } else {
    contentHeight.value = '0px'
  }
})

function onTransitionEnd() {
  if (isOpen.value && contentRef.value) {
    contentHeight.value = 'auto'
  }
}

function toggle() {
  // Groupes forcés dépliés (menu court) : pas de repli manuel. Le clic sur l'en-tête
  // navigue vers le premier enfant pour ne pas paraître inerte (ex. Paramètres -> Profil).
  if (expandAll.value) {
    if (props.headerTo) router.push(props.headerTo)
    return
  }
  if (!props.collapsed && openGroupId) {
    if (isOpen.value && contentRef.value) {
      contentHeight.value = contentRef.value.scrollHeight + 'px'
      void contentRef.value.offsetHeight
      contentHeight.value = '0px'
      openGroupId.value = null
    } else {
      openGroupId.value = props.groupId
    }
  }
}
</script>

<template>
  <div>
    <button
      type="button"
      :class="[
        'relative flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors',
        active
          ? 'bg-sidebar-hover text-white'
          : 'text-gray-300 hover:bg-sidebar-hover hover:text-white',
      ]"
      @click="toggle"
    >
      <component :is="icon" class="h-5 w-5 shrink-0" />
      <span v-if="!collapsed" class="flex-1 truncate text-left">{{ label }}</span>
      <!-- Agregat "attention" des enfants : nombre (deplie) ou point (replie). -->
      <span
        v-if="!collapsed && badgeCount && badgeCount > 0"
        class="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-danger-500 px-1.5 text-[10px] font-bold text-white"
      >{{ badgeCount > 99 ? '99+' : badgeCount }}</span>
      <span
        v-if="collapsed && badgeCount && badgeCount > 0"
        class="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger-500"
      />
      <ChevronDownIcon
        v-if="!collapsed && !expandAll"
        :class="['h-4 w-4 shrink-0 transition-transform duration-300', isOpen ? 'rotate-180' : '']"
      />
    </button>
    <div
      v-if="!collapsed"
      ref="contentRef"
      class="overflow-hidden transition-[max-height] duration-300 ease-in-out"
      :style="{ maxHeight }"
      @transitionend="onTransitionEnd"
    >
      <div class="pb-1">
        <slot />
      </div>
    </div>
  </div>
</template>
