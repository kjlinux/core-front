<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import TheSidebarGroup from './TheSidebarGroup.vue'
import TheSidebarItem from './TheSidebarItem.vue'
import { buildMenu, isGroup, type MenuItem, type MenuGroup } from '@/config/menu'

const { t } = useI18n()
const ui = useUiStore()
const auth = useAuthStore()
const route = useRoute()

const sections = computed(() => buildMenu(auth.user?.role))

function entryLabel(entry: MenuItem | MenuGroup): string {
  return entry.labelKey ? t(entry.labelKey) : (entry.label ?? '')
}

function sectionTitle(titleKey?: string, title?: string): string {
  return titleKey ? t(titleKey) : (title ?? '')
}

function isItemActive(item: MenuItem): boolean {
  return item.match ? item.match(route.path) : route.path.startsWith(item.to)
}

function isGroupActive(group: MenuGroup): boolean {
  return group.children.some((child) => isItemActive(child))
}

function getActiveGroupId(): string | null {
  for (const section of sections.value) {
    for (const entry of section.entries) {
      if (isGroup(entry) && isGroupActive(entry)) return entry.id
    }
  }
  return null
}

const openGroupId = ref<string | null>(getActiveGroupId())
provide('sidebarOpenGroupId', openGroupId)

watch(
  () => route.path,
  () => {
    const active = getActiveGroupId()
    if (active) openGroupId.value = active
  },
)

const sidebarClasses = computed(() => [
  'fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-white transition-all duration-300 lg:relative',
  ui.sidebarCollapsed ? 'w-20' : 'w-64',
  ui.sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
])
</script>

<template>
  <aside :class="sidebarClasses">
    <!-- Logo -->
    <div class="flex h-16 items-center justify-center border-b border-white/10 px-4">
      <template v-if="!ui.sidebarCollapsed">
        <span class="text-lg font-bold tracking-wide">TANGAFLOW</span>
      </template>
      <template v-else>
        <span class="text-lg font-bold">TF</span>
      </template>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-4">
      <template v-for="section in sections" :key="section.id">
        <p
          v-if="!ui.sidebarCollapsed"
          class="px-4 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-gray-400"
        >
          {{ sectionTitle(section.titleKey, section.title) }}
        </p>
        <template v-for="entry in section.entries" :key="entry.id">
          <TheSidebarGroup
            v-if="isGroup(entry)"
            :group-id="entry.id"
            :label="entryLabel(entry)"
            :icon="entry.icon"
            :collapsed="ui.sidebarCollapsed"
            :active="isGroupActive(entry)"
          >
            <TheSidebarItem
              v-for="child in entry.children"
              :key="child.id"
              :label="entryLabel(child)"
              :to="child.to"
              :icon="child.icon"
              :collapsed="false"
              :active="isItemActive(child)"
              :nested="true"
            />
          </TheSidebarGroup>
          <TheSidebarItem
            v-else
            :label="entryLabel(entry)"
            :to="entry.to"
            :icon="entry.icon"
            :collapsed="ui.sidebarCollapsed"
            :active="isItemActive(entry)"
          />
        </template>
      </template>
    </nav>
  </aside>
</template>
