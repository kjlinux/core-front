<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { usePermissions } from '@/composables/usePermissions'
import { usePlan } from '@/composables/usePlan'
import { useBadgesStore } from '@/stores/badges.store'
import TheSidebarGroup from './TheSidebarGroup.vue'
import TheSidebarItem from './TheSidebarItem.vue'
import { buildMenu, isGroup, type MenuItem, type MenuGroup } from '@/config/menu'
import { APP_VERSION } from '@/config/whats-new'

const { t } = useI18n()
const ui = useUiStore()
const auth = useAuthStore()
const { isShortMenuRole } = usePermissions()
const { hasFeature } = usePlan()
const badges = useBadgesStore()
const route = useRoute()
const router = useRouter()

// Clic sur la version : rejoue la presentation des nouveautes.
function openWhatsNew() {
  router.push({ name: 'whats-new' })
}

// Compteur d'un item : 0 si l'item est verrouille par le plan (on ne badge pas une
// action inaccessible). L'agregat d'un groupe est la somme de ses enfants.
function itemBadge(item: MenuItem): number {
  if (item.feature && !hasFeature(item.feature)) return 0
  return badges.count(item.badge)
}

function groupBadge(group: MenuGroup): number {
  return group.children.reduce((sum, child) => sum + itemBadge(child), 0)
}

// Cles de badge des items (feuilles) correspondant a la route courante : sert a
// marquer ces sections comme "vues" quand l'utilisateur ouvre la page.
function badgeKeysForCurrentPath(): string[] {
  const keys: string[] = []
  const collect = (item: MenuItem) => {
    if (!item.badge || !isItemActive(item)) return
    if (item.feature && !hasFeature(item.feature)) return
    keys.push(item.badge)
  }
  for (const section of sections.value) {
    for (const entry of section.entries) {
      if (isGroup(entry)) {
        entry.children.forEach(collect)
      } else {
        collect(entry)
      }
    }
  }
  return keys
}

const sections = computed(() => buildMenu(auth.user?.role))

// La sidebar peut être repliée par tous les rôles (bouton dans TheHeader).
const collapsed = computed(() => ui.sidebarCollapsed)

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

// Rôles à menu court (Support IT, Employe) : leurs groupes restent tous ouverts (pas
// d'accordéon). Le repli de la sidebar la fait disparaître entièrement, donc inutile de
// dépendre de l'état replié ici (le contenu est juste masqué par la largeur nulle).
const expandAllGroups = computed(() => isShortMenuRole.value)
provide('sidebarExpandAllGroups', expandAllGroups)

watch(
  () => route.path,
  async () => {
    const active = getActiveGroupId()
    if (active) openGroupId.value = active
    // Consulter une page marque sa section comme "vue" : le badge disparait et ne
    // revient que si de nouveaux elements arrivent (cf. badges.store / MenuBadgeService).
    await Promise.all(badgeKeysForCurrentPath().map((key) => badges.markSeen(key)))
    // Rafraichit les compteurs apres une action sur la page (peu couteux : cache serveur 45s).
    void badges.fetch()
  },
  { immediate: true },
)

const sidebarClasses = computed(() => [
  'fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden bg-sidebar text-white transition-all duration-300 lg:relative',
  // Repli = disparition complète sur desktop (largeur nulle). Le drawer mobile garde sa pleine largeur.
  'w-64',
  collapsed.value ? 'lg:w-0' : 'lg:w-64',
  ui.sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
])
</script>

<template>
  <aside :class="sidebarClasses">
    <!-- Logo (largeur figée : clippé proprement quand l'aside se replie à 0) -->
    <div class="flex h-16 w-64 shrink-0 items-center justify-center border-b border-white/10 px-4">
      <span class="whitespace-nowrap text-lg font-bold tracking-wide">TANGAFLOW</span>
    </div>

    <!-- Navigation (largeur figée, cf. logo) -->
    <nav class="w-64 flex-1 overflow-y-auto py-4">
      <template v-for="section in sections" :key="section.id">
        <p
          class="whitespace-nowrap px-4 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-gray-400"
        >
          {{ sectionTitle(section.titleKey, section.title) }}
        </p>
        <template v-for="entry in section.entries" :key="entry.id">
          <TheSidebarGroup
            v-if="isGroup(entry)"
            :group-id="entry.id"
            :label="entryLabel(entry)"
            :icon="entry.icon"
            :collapsed="false"
            :active="isGroupActive(entry)"
            :badge-count="groupBadge(entry)"
            :header-to="entry.children[0]?.to"
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
              :feature="child.feature"
              :badge-count="itemBadge(child)"
            />
          </TheSidebarGroup>
          <TheSidebarItem
            v-else
            :label="entryLabel(entry)"
            :to="entry.to"
            :icon="entry.icon"
            :collapsed="false"
            :active="isItemActive(entry)"
            :feature="entry.feature"
            :badge-count="itemBadge(entry)"
          />
        </template>
      </template>
    </nav>

    <!-- Version applicative (bas du menu) : clic = revoir les nouveautés -->
    <div class="w-64 shrink-0 border-t border-white/10 px-3 py-3">
      <button
        type="button"
        class="group flex w-full items-center justify-center rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
        title="Voir les nouveautés de cette version"
        @click="openWhatsNew"
      >
        <span class="text-xs font-medium tabular-nums text-gray-400 group-hover:text-gray-200">
          version {{ APP_VERSION }}
        </span>
      </button>
    </div>
  </aside>
</template>
