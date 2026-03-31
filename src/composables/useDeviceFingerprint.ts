/**
 * Génère et persiste un identifiant unique et stable pour ce navigateur/appareil.
 * Stocké en localStorage — stable jusqu'à effacement du navigateur.
 * Combine plusieurs signaux pour maximiser la stabilité.
 */
export function useDeviceFingerprint() {
  const STORAGE_KEY = 'device_fingerprint'

  function getOrCreate(): string {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (existing) return existing

    // Génère un fingerprint à partir de signaux stables du navigateur
    const signals = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency ?? '',
      navigator.platform ?? '',
    ].join('|')

    // Hash simple (djb2) pour produire une chaîne compacte
    let hash = 5381
    for (let i = 0; i < signals.length; i++) {
      hash = ((hash << 5) + hash) ^ signals.charCodeAt(i)
      hash = hash >>> 0 // forcer unsigned 32-bit
    }

    // Ajouter un suffixe aléatoire pour éviter les collisions entre appareils identiques
    const random = Math.random().toString(36).slice(2, 10)
    const fingerprint = hash.toString(16).padStart(8, '0') + '-' + random

    localStorage.setItem(STORAGE_KEY, fingerprint)
    return fingerprint
  }

  function getDeviceInfo(): string {
    const ua = navigator.userAgent
    let os = 'Inconnu'
    let browser = 'Inconnu'

    if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS'
    else if (/Android/.test(ua)) os = 'Android'
    else if (/Windows/.test(ua)) os = 'Windows'
    else if (/Mac/.test(ua)) os = 'macOS'
    else if (/Linux/.test(ua)) os = 'Linux'

    if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) browser = 'Chrome'
    else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari'
    else if (/Firefox\//.test(ua)) browser = 'Firefox'
    else if (/Edg\//.test(ua)) browser = 'Edge'

    return `${os} / ${browser}`
  }

  return { getOrCreate, getDeviceInfo }
}
