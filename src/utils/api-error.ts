import { isAxiosError } from 'axios'

/**
 * Longueur max du message affiché dans un toast. Au-delà on tronque : le
 * conteneur de toast n'a pas de max-height, un bloc d'erreurs trop long
 * envahirait l'écran.
 */
const MAX_LEN = 220

/**
 * Extrait le vrai message d'erreur renvoyé par l'API à partir d'une erreur
 * axios, au lieu du message générique d'axios ("Request failed with status
 * code XXX").
 *
 * Le backend Laravel renvoie { success:false, message, errors? }. Pour les 422
 * de validation, les vrais messages (FR) sont dans `errors` ({ champ: string[] }),
 * le `message` de tête étant générique ("The given data was invalid.").
 *
 * Priorité : errors (422 aplati) → message → error → fallback → error.message.
 */
export function extractApiErrorMessage(error: unknown, fallback?: string): string {
  if (isAxiosError(error) && error.response) {
    const data = error.response.data
    // Garde : réponses blob/arraybuffer/non-JSON (ex. report-export.ts
    // responseType:'blob'). On ne peut pas lire le Blob en synchrone.
    if (data && typeof data === 'object' && !(data instanceof Blob)) {
      const d = data as { message?: unknown; error?: unknown; errors?: Record<string, unknown> }
      // 422 : aplatir les erreurs de validation (prioritaire sur le message générique)
      if (d.errors && typeof d.errors === 'object') {
        const msgs = Object.values(d.errors)
          .flat()
          .filter((m): m is string => typeof m === 'string' && m.length > 0)
        if (msgs.length) {
          const joined = msgs.join(' | ')
          return joined.length > MAX_LEN ? `${joined.slice(0, MAX_LEN - 1)}…` : joined
        }
      }
      if (typeof d.message === 'string' && d.message) return d.message
      if (typeof d.error === 'string' && d.error) return d.error
    }
  }
  // Réseau / timeout / non-axios : conserver le message existant
  const msg = (error as { message?: unknown })?.message
  return fallback ?? (typeof msg === 'string' ? msg : undefined) ?? 'Une erreur est survenue'
}
