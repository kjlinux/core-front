import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import type { UserRole } from '@/types/enums'
import {
  APP_VERSION,
  hasWhatsNewForRole,
  itemsForRole,
} from '@/config/whats-new'

/**
 * Suivi par utilisateur de la presentation des nouveautes.
 *
 * Deux etats persistes dans le localStorage, scopes par (utilisateur, version) :
 *  - "seen"   : l'utilisateur a deja vu (ou passe) la presentation de cette version.
 *  - "optout" : l'utilisateur ne veut plus du bandeau "revoir" pour cette version.
 *
 * Comportement attendu :
 *  - 1re connexion apres la mise a jour  -> on ouvre la presentation (auto).
 *  - apres l'avoir vue/passee            -> plus d'ouverture auto ; un bandeau discret
 *                                           propose de la revoir.
 *  - "Non merci, c'est bon"              -> plus de bandeau du tout pour cette version.
 *
 * Le scope par version fait qu'une prochaine release (changement d'APP_VERSION)
 * reproposera naturellement la presentation. Le scope par utilisateur evite qu'un
 * collegue partageant le navigateur herite de l'etat d'un autre.
 */

const PREFIX = 'tanga:whats_new'

function storageKey(kind: 'seen' | 'optout', userId: string): string {
  return `${PREFIX}:${kind}:${userId}:${APP_VERSION}`
}

function readFlag(key: string): boolean {
  try {
    return window.localStorage?.getItem(key) === '1'
  } catch {
    return false
  }
}

function writeFlag(key: string, value: boolean): void {
  try {
    if (value) window.localStorage?.setItem(key, '1')
    else window.localStorage?.removeItem(key)
  } catch {
    // localStorage indisponible : on degrade silencieusement (la presentation se
    // reaffichera, ce qui reste preferable a un crash).
  }
}

// Compteur reactif partage : toute ecriture l'incremente pour forcer le recalcul des
// computed (le localStorage n'etant pas reactif par nature).
const revision = ref(0)

/**
 * Helper PUR (sans reactivite Vue) destine au guard de routage.
 * Vrai si l'on doit ouvrir automatiquement la presentation pour cet utilisateur.
 */
export function shouldAutoShowWhatsNew(user: { id: string; role: UserRole }): boolean {
  if (!hasWhatsNewForRole(user.role)) return false
  return !readFlag(storageKey('seen', user.id)) && !readFlag(storageKey('optout', user.id))
}

export function useWhatsNew() {
  const auth = useAuthStore()

  const userId = computed(() => auth.user?.id ?? null)
  const role = computed(() => auth.user?.role ?? null)

  const items = computed(() => itemsForRole(role.value))
  const hasContent = computed(() => items.value.length > 0)

  const hasSeen = computed(() => {
    void revision.value
    return userId.value ? readFlag(storageKey('seen', userId.value)) : false
  })

  const isOptedOut = computed(() => {
    void revision.value
    return userId.value ? readFlag(storageKey('optout', userId.value)) : false
  })

  /** Faut-il ouvrir automatiquement la presentation ? (1re fois, non refusee) */
  const shouldAutoShow = computed(
    () => hasContent.value && !hasSeen.value && !isOptedOut.value,
  )

  /** Faut-il afficher le bandeau "revoir la presentation" dans l'en-tete ? */
  const showRevisitBanner = computed(
    () => hasContent.value && hasSeen.value && !isOptedOut.value,
  )

  /** Marque la presentation comme vue (appele a l'ouverture / fin / passage). */
  function markSeen(): void {
    if (!userId.value) return
    writeFlag(storageKey('seen', userId.value), true)
    revision.value++
  }

  /** L'utilisateur ne souhaite plus revoir (masque aussi le bandeau). */
  function optOut(): void {
    if (!userId.value) return
    writeFlag(storageKey('optout', userId.value), true)
    revision.value++
  }

  return {
    version: APP_VERSION,
    items,
    hasContent,
    hasSeen,
    isOptedOut,
    shouldAutoShow,
    showRevisitBanner,
    markSeen,
    optOut,
  }
}
