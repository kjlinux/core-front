import type { Component } from 'vue'
import {
  LifebuoyIcon,
  ClipboardDocumentCheckIcon,
  QrCodeIcon,
  ClipboardDocumentListIcon,
  DocumentChartBarIcon,
  CreditCardIcon,
  CpuChipIcon,
  ClockIcon,
  CheckBadgeIcon,
  MoonIcon,
  SparklesIcon,
  BanknotesIcon,
  BoltIcon,
  ServerStackIcon,
  BugAntIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/vue/24/outline'
import { UserRole } from '@/types/enums'

/**
 * Version applicative affichee partout (en-tete, bas du menu, page nouveautes).
 * Source unique de verite : ne PAS redefinir la version ailleurs.
 *
 * Pourquoi 3.0.0 et pas 2.9.8 -> 7.0.0 ? Ce cycle (26 -> 31 mai 2026) introduit un
 * nouveau role (Support IT) et plusieurs nouveaux modules (Fiches d'installation,
 * Rapports planifies, Demandes d'absence, Pointage QR, passerelle LigdiCash, refonte
 * des horaires). C'est une release MAJEURE : le bon increment semantique est 3.0.0.
 */
export const APP_VERSION = '3.0.0'
export const WHATS_NEW_VERSION = APP_VERSION
export const WHATS_NEW_PERIOD = 'Mai 2026'

export type AccentKey = 'indigo' | 'violet' | 'emerald' | 'sky' | 'amber' | 'rose' | 'cyan'
export type WhatsNewCategory = 'feature' | 'improvement' | 'fix'

interface ItemOverride {
  title?: string
  description?: string
  tag?: string
}

export interface WhatsNewItem {
  id: string
  category: WhatsNewCategory
  icon: Component
  accent: AccentKey
  /** Petit libelle au-dessus du titre (ex: "Nouveau module"). */
  tag?: string
  title: string
  description: string
  /** Roles autorises a voir cet element (cf. UserRole). */
  roles: UserRole[]
  /** Variantes de copie selon le role (employe vs manager, etc.). */
  variants?: Partial<Record<UserRole, ItemOverride>>
}

/** Libelles FR lisibles de chaque role (sert aux badges d'audience cote super_admin). */
export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super admin',
  [UserRole.ADMIN_ENTERPRISE]: 'Admin entreprise',
  [UserRole.MANAGER]: 'Manager',
  [UserRole.TECHNICIEN]: 'Technicien',
  [UserRole.EMPLOYE]: 'Employé',
  [UserRole.SUPPORT_IT]: 'Support IT',
}

// Groupes de roles, alignes sur src/config/menu.ts pour rester coherents.
const ALL: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN_ENTERPRISE,
  UserRole.MANAGER,
  UserRole.TECHNICIEN,
  UserRole.EMPLOYE,
  UserRole.SUPPORT_IT,
]
const CLIENTS: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE, UserRole.MANAGER]
const CLIENTS_TECH: UserRole[] = [...CLIENTS, UserRole.TECHNICIEN]
const ADMIN_SUPER: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE]
const SUPPORT: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.SUPPORT_IT]
const SETUP_SUPPORT: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.TECHNICIEN, UserRole.SUPPORT_IT]

/** Les 5 profils hors super_admin : sert a decrire l'audience d'une nouveaute. */
const NON_SUPER_ROLES: UserRole[] = [
  UserRole.ADMIN_ENTERPRISE,
  UserRole.MANAGER,
  UserRole.TECHNICIEN,
  UserRole.EMPLOYE,
  UserRole.SUPPORT_IT,
]

/**
 * Changelog du 26 au 31 mai 2026, taggue par role. Chaque utilisateur ne voit que ce
 * qui le concerne : un employe ne verra jamais le module Support IT ou le firmware.
 * Le super_admin, lui, voit TOUT (cf. itemsForRole) avec le public cible de chaque
 * nouveaute (cf. itemAudience).
 */
export const WHATS_NEW_ITEMS: WhatsNewItem[] = [
  // --- Nouvelles fonctionnalites -------------------------------------------------
  {
    id: 'support-it',
    category: 'feature',
    icon: LifebuoyIcon,
    accent: 'sky',
    tag: 'Nouveau module',
    title: 'Le centre Support IT',
    description:
      "Un espace complet pour suivre les tickets, surveiller la santé de chaque entreprise, garder un œil sur les terminaux en temps réel et même piloter la console MQTT. Tout le support, réuni au même endroit.",
    roles: SUPPORT,
  },
  {
    id: 'installation-sheets',
    category: 'feature',
    icon: ClipboardDocumentCheckIcon,
    accent: 'emerald',
    tag: 'Nouveau',
    title: "Fiches d'installation",
    description:
      "Documentez chaque mise en service : matériel posé, signature du client sur place et génération du PDF. Un historique propre pour la garantie et la maintenance.",
    roles: SETUP_SUPPORT,
    variants: {
      [UserRole.TECHNICIEN]: {
        title: "Vos fiches d'installation",
        description:
          "Sur le terrain, enregistrez le matériel posé, faites signer le client directement à l'écran et générez le PDF en un instant. Fini les fiches papier.",
      },
    },
  },
  {
    id: 'qr-attendance',
    category: 'feature',
    icon: QrCodeIcon,
    accent: 'violet',
    tag: 'Nouveau',
    title: 'Pointage par QR Code',
    description:
      "Une nouvelle façon de pointer, en plus du RFID et du biométrique : un simple scan de QR code et c'est fait. Parfait là où il n'y a pas de terminal.",
    roles: [...CLIENTS_TECH, UserRole.EMPLOYE],
    variants: {
      [UserRole.EMPLOYE]: {
        title: 'Pointez avec un QR Code',
        description:
          "Plus besoin d'avoir votre badge sous la main : scannez le QR code et votre présence est enregistrée en une seconde.",
      },
    },
  },
  {
    id: 'absence-requests',
    category: 'feature',
    icon: ClipboardDocumentListIcon,
    accent: 'indigo',
    tag: 'Nouveau',
    title: "Demandes d'absence",
    description:
      "Vos équipes déposent leurs demandes d'absence en ligne, vous les validez ou refusez en un clic, et la paie en tient compte automatiquement.",
    roles: [...CLIENTS, UserRole.EMPLOYE],
    variants: {
      [UserRole.EMPLOYE]: {
        title: 'Demandez vos absences en ligne',
        description:
          'Posez vos congés ou absences en quelques secondes, suivez la réponse en direct, sans paperasse ni allers-retours.',
      },
    },
  },
  {
    id: 'scheduled-reports',
    category: 'feature',
    icon: DocumentChartBarIcon,
    accent: 'cyan',
    tag: 'Nouveau',
    title: 'Rapports planifiés',
    description:
      "Programmez l'envoi automatique de vos rapports (présence, ventes, feelback) au rythme que vous voulez. Ils arrivent tout seuls, vous gardez le focus sur l'essentiel.",
    roles: CLIENTS,
  },
  {
    id: 'ligdicash',
    category: 'feature',
    icon: CreditCardIcon,
    accent: 'amber',
    tag: 'Nouveau',
    title: 'Paiement LigdiCash',
    description:
      "Un nouveau moyen de paiement vient s'ajouter pour régler vos abonnements et vos commandes encore plus facilement.",
    roles: CLIENTS,
  },
  {
    id: 'firmware-v2',
    category: 'feature',
    icon: CpuChipIcon,
    accent: 'rose',
    tag: 'Matériel',
    title: 'Firmware RFID Presense V3',
    description:
      "Nos lecteurs RFID passent à la V3 : écran OLED, synchronisation de l'heure, mises à jour à distance (OTA) et connexion plus fiable.",
    roles: SETUP_SUPPORT,
  },

  // --- Ameliorations -------------------------------------------------------------
  {
    id: 'schedule-redesign',
    category: 'improvement',
    icon: ClockIcon,
    accent: 'emerald',
    title: 'Horaires repensés',
    description:
      "La création d'horaires a été entièrement revue, avec une page d'aide claire et des exemples pour configurer vos équipes sans prise de tête.",
    roles: CLIENTS_TECH,
  },
  {
    id: 'attendance-accuracy',
    category: 'improvement',
    icon: CheckBadgeIcon,
    accent: 'sky',
    title: 'Présence calculée plus juste',
    description:
      "Les taux de présence et d'absence se basent désormais sur les jours réellement attendus, pour des chiffres fidèles à la réalité du terrain.",
    roles: CLIENTS,
  },
  {
    id: 'dark-mode',
    category: 'improvement',
    icon: MoonIcon,
    accent: 'indigo',
    title: 'Mode sombre partout',
    description:
      "Travaillez le soir sans fatiguer vos yeux : le mode sombre s'applique à toute l'application. Activez-le depuis l'en-tête, en haut à droite.",
    roles: ALL,
  },
  {
    id: 'ui-polish',
    category: 'improvement',
    icon: SparklesIcon,
    accent: 'violet',
    title: 'Interface plus agréable',
    description:
      'Une palette de commandes pour aller partout en un raccourci, des panneaux latéraux, des notifications soignées et des chargements plus doux.',
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE, UserRole.MANAGER, UserRole.TECHNICIEN, UserRole.SUPPORT_IT],
  },
  {
    id: 'payroll-control',
    category: 'improvement',
    icon: BanknotesIcon,
    accent: 'amber',
    title: 'Paie plus fine',
    description:
      'De nouvelles règles pour les retards et le nombre de jours travaillés par semaine, pour une paie qui colle vraiment à vos politiques.',
    roles: ADMIN_SUPER,
  },
  {
    id: 'faster-tables',
    category: 'improvement',
    icon: BoltIcon,
    accent: 'cyan',
    title: 'Listes plus rapides',
    description:
      'Les grandes listes se chargent désormais page par page côté serveur : plus rapide, plus fluide, même avec beaucoup de données.',
    roles: ALL,
  },
  {
    id: 'richer-reports',
    category: 'improvement',
    icon: DocumentChartBarIcon,
    accent: 'emerald',
    title: 'Rapports enrichis',
    description:
      'De nouveaux rapports (techniciens, ventes, présence détaillée, feelback) et de meilleurs exports CSV et PDF.',
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE, UserRole.MANAGER, UserRole.TECHNICIEN],
  },
  {
    id: 'proactive-monitoring',
    category: 'improvement',
    icon: ServerStackIcon,
    accent: 'sky',
    title: 'Supervision proactive',
    description:
      'Détection automatique des terminaux hors ligne et des mises à jour bloquées, pour réagir avant même que le souci ne se voie.',
    roles: SUPPORT,
  },

  // --- Corrections ---------------------------------------------------------------
  {
    id: 'fix-stability',
    category: 'fix',
    icon: BugAntIcon,
    accent: 'emerald',
    title: 'Stabilité renforcée',
    description:
      "Nous avons corrigé une série de petits soucis et fiabilisé l'ensemble pour une expérience plus sereine au quotidien.",
    roles: ALL,
  },
  {
    id: 'fix-clear-errors',
    category: 'fix',
    icon: ChatBubbleLeftRightIcon,
    accent: 'sky',
    title: 'Messages plus clairs',
    description:
      "Quand quelque chose se passe mal, les messages sont désormais plus explicites pour vous aider à comprendre tout de suite.",
    roles: ALL,
  },
  {
    id: 'fix-hardware',
    category: 'fix',
    icon: CpuChipIcon,
    accent: 'amber',
    title: 'Pointage plus fiable',
    description:
      "Lecture des badges, biométrie et échanges MQTT plus robustes, avec moins de doublons et d'événements manqués.",
    roles: SETUP_SUPPORT,
  },
  {
    id: 'fix-payments',
    category: 'fix',
    icon: CreditCardIcon,
    accent: 'violet',
    title: 'Paiements sécurisés',
    description:
      'La validation des paiements et des commandes a été renforcée pour éviter tout état incohérent.',
    roles: CLIENTS,
  },
]

/**
 * Liste des elements visibles par un role donne, dans l'ordre de declaration.
 * Le super_admin supervise l'ensemble : il voit TOUTES les nouveautes, quel que soit
 * le public cible (et meme si une future entree oubliait de le lister explicitement).
 */
export function itemsForRole(role: UserRole | null | undefined): WhatsNewItem[] {
  if (!role) return []
  if (role === UserRole.SUPER_ADMIN) return WHATS_NEW_ITEMS
  return WHATS_NEW_ITEMS.filter((item) => item.roles.includes(role))
}

/** Vrai si le role a au moins un element a presenter. */
export function hasWhatsNewForRole(role: UserRole | null | undefined): boolean {
  return itemsForRole(role).length > 0
}

/**
 * Public cible d'une nouveaute, decrit du point de vue du super_admin (qui supervise
 * tous les profils). `allProfiles` est vrai si la nouveaute concerne les 5 profils
 * hors super_admin ; sinon `labels` liste les profils concernes.
 */
export function itemAudience(item: WhatsNewItem): { allProfiles: boolean; labels: string[] } {
  const targeted = NON_SUPER_ROLES.filter((r) => item.roles.includes(r))
  const allProfiles = targeted.length === NON_SUPER_ROLES.length
  return { allProfiles, labels: targeted.map((r) => ROLE_LABELS[r]) }
}

/** Applique la variante de copie propre au role, avec repli sur la copie de base. */
export function resolveItemForRole(
  item: WhatsNewItem,
  role: UserRole | null | undefined,
): { title: string; description: string; tag?: string } {
  const override = role ? item.variants?.[role] : undefined
  return {
    title: override?.title ?? item.title,
    description: override?.description ?? item.description,
    tag: override?.tag ?? item.tag,
  }
}
