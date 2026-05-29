// Seuil par défaut (minutes) aligné sur devices.offline_threshold_minutes côté backend.
export const DEFAULT_OFFLINE_THRESHOLD_MINUTES = 5

/**
 * Détermine si un capteur est réellement en ligne à partir de son dernier signal,
 * plutôt que de faire confiance à un booléen is_online potentiellement figé.
 * Retourne false si aucun signal n'est connu ou s'il dépasse le seuil.
 */
export function deriveDeviceOnline(
  lastSeen: string | null | undefined,
  thresholdMinutes: number = DEFAULT_OFFLINE_THRESHOLD_MINUTES,
): boolean {
  if (!lastSeen) return false
  const last = new Date(lastSeen).getTime()
  if (Number.isNaN(last)) return false
  const ageMs = Date.now() - last
  return ageMs <= thresholdMinutes * 60_000
}
