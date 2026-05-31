import apiClient from './client'

// Map plate { badgeKey: count } renvoyee par GET /menu-badges. Seules les cles
// pertinentes pour le role courant sont presentes ; les compteurs a 0 sont omis.
export type MenuBadgeMap = Record<string, number>

export const menuBadgeApi = {
  getAll(): Promise<MenuBadgeMap> {
    return apiClient.get('/menu-badges').then((res) => res.data)
  },
  // Marque une section comme consultee : le badge correspondant disparait cote
  // serveur jusqu'a l'arrivee de nouveaux elements.
  markSeen(key: string): Promise<void> {
    return apiClient.post('/menu-badges/seen', { key }).then(() => undefined)
  },
}
