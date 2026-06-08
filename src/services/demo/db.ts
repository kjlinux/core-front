/**
 * Base de données en mémoire du mode démo.
 *
 * Le jeu de données est conservé en mémoire (singleton du module) et persisté
 * dans le localStorage pour survivre à un rechargement de page. Le bouton
 * « réinitialiser » de la bannière démo régénère un jeu propre.
 */
import { buildSeedDb, type DemoDb } from './seed'

const DB_STORAGE_KEY = 'demo_db'

let db: DemoDb | null = null

function load(): DemoDb {
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw) as DemoDb
    }
  } catch {
    /* localStorage indisponible ou JSON invalide -> reseed */
  }
  const fresh = buildSeedDb()
  persist(fresh)
  return fresh
}

function persist(value: DemoDb): void {
  try {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(value))
  } catch {
    /* quota dépassé / storage indisponible : on garde au moins la version mémoire */
  }
}

/** Récupère (et hydrate si besoin) la base démo. */
export function getDb(): DemoDb {
  if (!db) {
    db = load()
  }
  return db
}

/** Sauvegarde l'état courant après une mutation. */
export function saveDb(): void {
  if (db) persist(db)
}

/** Régénère un jeu de données neuf. */
export function resetDb(): void {
  db = buildSeedDb()
  persist(db)
}

/** Efface complètement la base démo du storage. */
export function clearDb(): void {
  db = null
  try {
    localStorage.removeItem(DB_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
