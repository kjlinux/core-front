/**
 * Gestion de l'état du mode démo : activation, rôle simulé, sortie.
 *
 * Le mode démo détourne l'API (cf. adapter.ts) pour servir des données factices
 * en mémoire. Il s'active depuis la page publique /demo et reste actif tant que
 * le visiteur ne quitte pas la démo.
 */
import { getDb, resetDb, clearDb } from './db'
import { APP_VERSION } from '@/config/whats-new'

const DEMO_FLAG_KEY = 'demo_mode'
const DEMO_TOKEN = 'demo-token'

export type DemoRole = 'admin_enterprise' | 'manager' | 'employe'

export const DEMO_ROLES: { role: DemoRole; label: string; home: string }[] = [
  { role: 'admin_enterprise', label: 'Admin entreprise', home: '/' },
  { role: 'manager', label: 'Manager', home: '/' },
  { role: 'employe', label: 'Employe', home: '/mon-espace' },
]

/** Le mode démo est-il actif ? */
export function isDemoMode(): boolean {
  try {
    return localStorage.getItem(DEMO_FLAG_KEY) === '1'
  } catch {
    return false
  }
}

export function homeForRole(role: DemoRole): string {
  return DEMO_ROLES.find((r) => r.role === role)?.home ?? '/'
}

/** Renvoie l'utilisateur factice correspondant au rôle demandé (copie). */
export function demoUserForRole(role: DemoRole) {
  const db = getDb()
  const user = db.users.find((u) => u.role === role) ?? db.users[0]
  return JSON.parse(JSON.stringify(user))
}

/**
 * Marque la présentation des nouveautés comme « vue » pour les utilisateurs démo,
 * afin que le prospect atterrisse directement sur le tableau de bord et non sur
 * l'écran des nouveautés (sinon déclenché à la 1re visite par le guard).
 */
function suppressWhatsNew(): void {
  try {
    for (const uid of ['user-admin', 'user-manager', 'user-employe']) {
      localStorage.setItem(`tanga:whats_new:seen:${uid}:${APP_VERSION}`, '1')
    }
  } catch {
    /* ignore */
  }
}

/** Écrit la session factice dans le localStorage (token + utilisateur). */
function writeSession(role: DemoRole): void {
  const user = demoUserForRole(role)
  localStorage.setItem('access_token', DEMO_TOKEN)
  localStorage.setItem('auth_user', JSON.stringify(user))
  suppressWhatsNew()
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('active_company_id')
  localStorage.removeItem('active_company_name')
  localStorage.removeItem('impersonation')
  localStorage.removeItem('impersonation_origin')
}

/**
 * Active le mode démo pour un rôle et renvoie la route d'accueil.
 * `fresh` régénère un jeu de données neuf (utilisé au tout premier lancement).
 */
export function enableDemo(role: DemoRole, fresh = false): string {
  if (fresh) resetDb()
  else getDb()
  localStorage.setItem(DEMO_FLAG_KEY, '1')
  writeSession(role)
  return homeForRole(role)
}

/** Change le rôle simulé sans réinitialiser les données. Renvoie la route d'accueil. */
export function switchDemoRole(role: DemoRole): string {
  writeSession(role)
  return homeForRole(role)
}

/** Réinitialise le jeu de données démo (conserve le rôle courant). */
export function resetDemoData(): void {
  resetDb()
}

/** Quitte complètement la démo et nettoie la session factice. */
export function exitDemo(): void {
  clearDb()
  try {
    localStorage.removeItem(DEMO_FLAG_KEY)
    localStorage.removeItem('access_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('active_company_id')
    localStorage.removeItem('active_company_name')
  } catch {
    /* ignore */
  }
}
