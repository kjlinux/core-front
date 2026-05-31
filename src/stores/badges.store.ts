import { ref } from 'vue'
import { defineStore } from 'pinia'
import { menuBadgeApi, type MenuBadgeMap } from '@/services/api/menu-badge.api'

/**
 * Compteurs "attention" affiches en pastille a cote des items du menu.
 * Alimente par GET /menu-badges, rafraichi par sondage (cf. DashboardLayout) et
 * a chaque changement de route (cf. TheSidebar).
 */
export const useBadgesStore = defineStore('badges', () => {
  const counts = ref<MenuBadgeMap>({})
  const isLoading = ref(false)

  let timer: ReturnType<typeof setInterval> | null = null

  function count(key?: string): number {
    if (!key) return 0
    return counts.value[key] ?? 0
  }

  async function fetch() {
    isLoading.value = true
    try {
      counts.value = await menuBadgeApi.getAll()
    } catch {
      // Silencieux : le backend peut etre indisponible, on garde les derniers compteurs.
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Marque une section comme consultee : disparition immediate (optimiste) de la
   * pastille, puis persistance cote serveur. Le badge ne reviendra que si de
   * nouveaux elements arrivent (cf. MenuBadgeService). En cas d'echec reseau, le
   * prochain fetch restaurera le compteur reel.
   */
  async function markSeen(key: string) {
    if (!key) return
    counts.value[key] = 0
    try {
      await menuBadgeApi.markSeen(key)
    } catch {
      // Silencieux : le prochain fetch reconciliera l'etat.
    }
  }

  function stopPolling() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function startPolling(intervalMs = 60000) {
    stopPolling()
    void fetch()
    timer = setInterval(() => {
      void fetch()
    }, intervalMs)
  }

  function $reset() {
    stopPolling()
    counts.value = {}
  }

  return { counts, isLoading, count, fetch, markSeen, startPolling, stopPolling, $reset }
})
