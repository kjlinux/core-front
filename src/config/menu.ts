import type { Component } from 'vue'
import {
  HomeIcon,
  CreditCardIcon,
  FingerPrintIcon,
  FaceSmileIcon,
  ShoppingCartIcon,
  Cog6ToothIcon,
  BuildingOffice2Icon,
  MapPinIcon,
  RectangleGroupIcon,
  UsersIcon,
  ClockIcon,
  CalendarDaysIcon,
  DocumentChartBarIcon,
  DevicePhoneMobileIcon,
  HandRaisedIcon,
  ChartBarIcon,
  BellAlertIcon,
  TagIcon,
  ClipboardDocumentListIcon,
  DocumentPlusIcon,
  WrenchScrewdriverIcon,
  CubeIcon,
  UserIcon,
  ShieldCheckIcon,
  ServerStackIcon,
  QrCodeIcon,
  CpuChipIcon,
  QuestionMarkCircleIcon,
  BanknotesIcon,
  Cog8ToothIcon,
  UserCircleIcon,
} from '@heroicons/vue/24/outline'
import { UserRole } from '@/types/enums'

export interface MenuItem {
  id: string
  labelKey?: string
  label?: string
  to: string
  icon: Component
  roles: UserRole[]
  match?: (path: string) => boolean
}

export interface MenuGroup {
  id: string
  labelKey?: string
  label?: string
  icon: Component
  roles: UserRole[]
  children: MenuItem[]
}

export interface MenuSection {
  id: string
  titleKey?: string
  title?: string
  roles: UserRole[]
  entries: (MenuItem | MenuGroup)[]
}

export function isGroup(entry: MenuItem | MenuGroup): entry is MenuGroup {
  return 'children' in entry
}

const ALL: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN_ENTERPRISE,
  UserRole.MANAGER,
  UserRole.TECHNICIEN,
  UserRole.EMPLOYE,
  UserRole.SUPPORT_IT,
]
const CLIENTS: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE, UserRole.MANAGER]
const ADMIN_SUPER: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE]
const ADMIN_SUPER_TECH: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN_ENTERPRISE,
  UserRole.TECHNICIEN,
]
const SETUP: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.TECHNICIEN]
const CLIENTS_TECH: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN_ENTERPRISE,
  UserRole.MANAGER,
  UserRole.TECHNICIEN,
]

const exact = (to: string) => (p: string) => p === to

const sections: MenuSection[] = [
  {
    id: 'exploitation',
    titleKey: 'nav.sectionExploitation',
    roles: CLIENTS_TECH,
    entries: [
      {
        id: 'dashboard',
        labelKey: 'nav.dashboard',
        to: '/',
        icon: HomeIcon,
        roles: CLIENTS_TECH,
        match: exact('/'),
      },
      {
        id: 'organisation',
        labelKey: 'nav.organisation',
        icon: BuildingOffice2Icon,
        roles: CLIENTS_TECH,
        children: [
          {
            id: 'companies',
            labelKey: 'nav.companies',
            to: '/organisation/companies',
            icon: BuildingOffice2Icon,
            roles: SETUP,
          },
          {
            id: 'sites',
            labelKey: 'nav.sites',
            to: '/organisation/sites',
            icon: MapPinIcon,
            roles: CLIENTS_TECH,
          },
          {
            id: 'departments',
            labelKey: 'nav.departments',
            to: '/organisation/departments',
            icon: RectangleGroupIcon,
            roles: CLIENTS_TECH,
          },
          {
            id: 'employees',
            labelKey: 'nav.employees',
            to: '/organisation/employees',
            icon: UsersIcon,
            roles: CLIENTS_TECH,
          },
          {
            id: 'schedules',
            labelKey: 'nav.schedules',
            to: '/organisation/schedules',
            icon: ClockIcon,
            roles: CLIENTS_TECH,
            match: (p) =>
              p.startsWith('/organisation/schedules') || p.startsWith('/organisation/holidays'),
          },
          {
            id: 'rfid-absences',
            labelKey: 'nav.absenceRequests',
            to: '/organisation/absences',
            icon: ClipboardDocumentListIcon,
            roles: CLIENTS,
          },
        ],
      },
      {
        id: 'paie',
        labelKey: 'nav.paie',
        icon: BanknotesIcon,
        roles: ADMIN_SUPER,
        children: [
          {
            id: 'paie-config',
            labelKey: 'nav.paieConfiguration',
            to: '/paie/configuration',
            icon: Cog8ToothIcon,
            roles: ADMIN_SUPER,
            match: exact('/paie/configuration'),
          },
          {
            id: 'paie-generer',
            labelKey: 'nav.paieFiches',
            to: '/paie/generer',
            icon: DocumentChartBarIcon,
            roles: ADMIN_SUPER,
            match: exact('/paie/generer'),
          },
        ],
      },
      {
        id: 'pointage-rfid',
        labelKey: 'nav.pointageRfid',
        icon: CreditCardIcon,
        roles: CLIENTS_TECH,
        children: [
          {
            id: 'rfid-devices',
            labelKey: 'nav.rfidDevices',
            to: '/pointage-rfid/devices',
            icon: DevicePhoneMobileIcon,
            roles: ADMIN_SUPER_TECH,
          },
          {
            id: 'rfid-cards',
            labelKey: 'nav.rfidCards',
            to: '/pointage-rfid/cards',
            icon: CreditCardIcon,
            roles: CLIENTS_TECH,
          },
          {
            id: 'rfid-attendance',
            labelKey: 'nav.attendance',
            to: '/pointage-rfid/attendance',
            icon: CalendarDaysIcon,
            roles: CLIENTS_TECH,
          },
          {
            id: 'rfid-reports',
            labelKey: 'nav.reports',
            to: '/pointage-rfid/reports',
            icon: DocumentChartBarIcon,
            roles: CLIENTS_TECH,
          },
        ],
      },
      {
        id: 'pointage-qrcode',
        labelKey: 'nav.pointageQrcode',
        icon: QrCodeIcon,
        roles: CLIENTS_TECH,
        children: [
          {
            id: 'qr-dashboard',
            labelKey: 'nav.dashboard',
            to: '/pointage-qrcode',
            icon: ChartBarIcon,
            roles: CLIENTS_TECH,
            match: exact('/pointage-qrcode'),
          },
          {
            id: 'qr-list',
            labelKey: 'nav.qrCodes',
            to: '/pointage-qrcode/list',
            icon: QrCodeIcon,
            roles: CLIENTS_TECH,
          },
          {
            id: 'qr-generate',
            labelKey: 'nav.generate',
            to: '/pointage-qrcode/generate',
            icon: CreditCardIcon,
            roles: ADMIN_SUPER_TECH,
          },
          {
            id: 'qr-enroll',
            labelKey: 'nav.qrEnroll',
            to: '/pointage-qrcode/enroll',
            icon: DevicePhoneMobileIcon,
            roles: ADMIN_SUPER_TECH,
          },
          {
            id: 'qr-attendance',
            labelKey: 'nav.attendance',
            to: '/pointage-qrcode/attendance',
            icon: CalendarDaysIcon,
            roles: CLIENTS_TECH,
          },
          {
            id: 'qr-reports',
            labelKey: 'nav.reports',
            to: '/pointage-qrcode/reports',
            icon: DocumentChartBarIcon,
            roles: CLIENTS_TECH,
          },
        ],
      },
      {
        id: 'biometrique',
        labelKey: 'nav.biometrique',
        icon: FingerPrintIcon,
        roles: CLIENTS_TECH,
        children: [
          {
            id: 'bio-dashboard',
            labelKey: 'nav.dashboard',
            to: '/biometrique',
            icon: ChartBarIcon,
            roles: CLIENTS_TECH,
            match: exact('/biometrique'),
          },
          {
            id: 'bio-devices',
            labelKey: 'nav.biometricDevices',
            to: '/biometrique/devices',
            icon: DevicePhoneMobileIcon,
            roles: ADMIN_SUPER_TECH,
          },
          {
            id: 'bio-enrollment',
            labelKey: 'nav.enrollments',
            to: '/biometrique/enrollment',
            icon: HandRaisedIcon,
            roles: ADMIN_SUPER_TECH,
          },
          {
            id: 'bio-attendance',
            labelKey: 'nav.attendance',
            to: '/biometrique/attendance',
            icon: ClockIcon,
            roles: CLIENTS_TECH,
            match: exact('/biometrique/attendance'),
          },
          {
            id: 'bio-reports',
            labelKey: 'nav.reports',
            to: '/biometrique/reports',
            icon: DocumentChartBarIcon,
            roles: CLIENTS_TECH,
          },
        ],
      },
      {
        id: 'feelback',
        labelKey: 'nav.feelback',
        icon: FaceSmileIcon,
        roles: CLIENTS_TECH,
        children: [
          {
            id: 'feelback-dashboard',
            labelKey: 'nav.dashboard',
            to: '/feelback',
            icon: ChartBarIcon,
            roles: CLIENTS,
            match: exact('/feelback'),
          },
          {
            id: 'feelback-analytics',
            labelKey: 'nav.feelbackAnalytics',
            to: '/feelback/analytics',
            icon: DocumentChartBarIcon,
            roles: CLIENTS,
          },
          {
            id: 'feelback-data',
            labelKey: 'nav.feelbackData',
            to: '/feelback/data',
            icon: ClipboardDocumentListIcon,
            roles: CLIENTS,
          },
          {
            id: 'feelback-devices',
            labelKey: 'nav.biometricDevices',
            to: '/feelback/devices',
            icon: DevicePhoneMobileIcon,
            roles: ADMIN_SUPER_TECH,
          },
          {
            id: 'feelback-alerts',
            labelKey: 'nav.feelbackAlerts',
            to: '/feelback/alerts',
            icon: BellAlertIcon,
            roles: ADMIN_SUPER,
          },
          {
            id: 'feelback-comparison',
            labelKey: 'nav.feelbackComparison',
            to: '/feelback/comparison',
            icon: ChartBarIcon,
            roles: CLIENTS,
          },
          {
            id: 'feelback-reports',
            labelKey: 'nav.reports',
            to: '/feelback/reports',
            icon: DocumentChartBarIcon,
            roles: CLIENTS,
          },
          {
            id: 'feelback-qr-avis',
            labelKey: 'nav.feelbackQrAvis',
            to: '/feelback/qr-avis',
            icon: QrCodeIcon,
            roles: CLIENTS,
          },
        ],
      },
    ],
  },
  {
    id: 'commerce',
    titleKey: 'nav.sectionCommerce',
    roles: CLIENTS,
    entries: [
      {
        id: 'marketplace',
        labelKey: 'nav.marketplace',
        icon: ShoppingCartIcon,
        roles: CLIENTS,
        children: [
          {
            id: 'mk-catalog',
            labelKey: 'nav.catalog',
            to: '/marketplace',
            icon: TagIcon,
            roles: CLIENTS,
            match: (p) => p === '/marketplace' || p.startsWith('/marketplace/products'),
          },
          {
            id: 'mk-cart',
            labelKey: 'nav.cart',
            to: '/marketplace/cart',
            icon: ShoppingCartIcon,
            roles: CLIENTS,
            match: exact('/marketplace/cart'),
          },
          {
            id: 'mk-orders',
            labelKey: 'nav.orders',
            to: '/marketplace/orders',
            icon: ClipboardDocumentListIcon,
            roles: CLIENTS,
          },
        ],
      },
      {
        id: 'marketplace-admin',
        labelKey: 'nav.adminBoutique',
        icon: WrenchScrewdriverIcon,
        roles: [UserRole.SUPER_ADMIN],
        children: [
          {
            id: 'mk-admin-products',
            labelKey: 'nav.adminProducts',
            to: '/marketplace/admin/products',
            icon: CubeIcon,
            roles: [UserRole.SUPER_ADMIN],
          },
          {
            id: 'mk-admin-orders',
            labelKey: 'nav.adminOrders',
            to: '/marketplace/admin/orders',
            icon: ClipboardDocumentListIcon,
            roles: [UserRole.SUPER_ADMIN],
          },
          {
            id: 'mk-inventory',
            labelKey: 'nav.inventory',
            to: '/marketplace/admin/inventory',
            icon: ServerStackIcon,
            roles: [UserRole.SUPER_ADMIN],
          },
          {
            id: 'mk-sales-reports',
            labelKey: 'nav.salesReports',
            to: '/marketplace/admin/reports',
            icon: DocumentChartBarIcon,
            roles: [UserRole.SUPER_ADMIN],
          },
        ],
      },
      {
        id: 'abonnement',
        labelKey: 'nav.abonnement',
        icon: CreditCardIcon,
        roles: CLIENTS,
        children: [
          {
            id: 'abo-current',
            labelKey: 'nav.abonnementCurrent',
            to: '/abonnement',
            icon: ShieldCheckIcon,
            roles: CLIENTS,
            match: exact('/abonnement'),
          },
          {
            id: 'abo-plans',
            labelKey: 'nav.abonnementPlans',
            to: '/abonnement/plans',
            icon: TagIcon,
            roles: CLIENTS,
            match: exact('/abonnement/plans'),
          },
          {
            id: 'abo-history',
            labelKey: 'nav.abonnementHistory',
            to: '/abonnement/history',
            icon: ClipboardDocumentListIcon,
            roles: CLIENTS,
            match: exact('/abonnement/history'),
          },
        ],
      },
    ],
  },
  {
    id: 'outils',
    titleKey: 'nav.sectionOutils',
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE, UserRole.TECHNICIEN, UserRole.SUPPORT_IT],
    entries: [
      {
        id: 'firmware',
        labelKey: 'nav.firmware',
        icon: CpuChipIcon,
        roles: [UserRole.SUPER_ADMIN],
        children: [
          {
            id: 'fw-versions',
            labelKey: 'nav.firmwareVersions',
            to: '/firmware',
            icon: ServerStackIcon,
            roles: [UserRole.SUPER_ADMIN],
            match: exact('/firmware'),
          },
          {
            id: 'fw-upload',
            labelKey: 'nav.firmwareUpload',
            to: '/firmware/upload',
            icon: CubeIcon,
            roles: [UserRole.SUPER_ADMIN],
          },
          {
            id: 'fw-devices',
            labelKey: 'nav.firmwareDevices',
            to: '/firmware/devices',
            icon: DevicePhoneMobileIcon,
            roles: [UserRole.SUPER_ADMIN],
          },
          {
            id: 'fw-logs',
            labelKey: 'nav.firmwareLogs',
            to: '/firmware/logs',
            icon: ClipboardDocumentListIcon,
            roles: [UserRole.SUPER_ADMIN],
          },
        ],
      },
      {
        id: 'support-it',
        labelKey: 'nav.supportIt',
        icon: WrenchScrewdriverIcon,
        roles: [UserRole.SUPER_ADMIN, UserRole.SUPPORT_IT],
        children: [
          {
            id: 'sit-dashboard',
            labelKey: 'nav.dashboard',
            to: '/support-it',
            icon: HomeIcon,
            roles: [UserRole.SUPER_ADMIN, UserRole.SUPPORT_IT],
            match: exact('/support-it'),
          },
          {
            id: 'sit-health',
            labelKey: 'nav.supportItHealth',
            to: '/support-it/health',
            icon: ServerStackIcon,
            roles: [UserRole.SUPER_ADMIN, UserRole.SUPPORT_IT],
          },
          {
            id: 'sit-devices',
            labelKey: 'nav.supportItDevices',
            to: '/support-it/devices',
            icon: CpuChipIcon,
            roles: [UserRole.SUPER_ADMIN, UserRole.SUPPORT_IT],
          },
          {
            id: 'sit-companies',
            labelKey: 'nav.supportItCompanies',
            to: '/support-it/companies',
            icon: BuildingOffice2Icon,
            roles: [UserRole.SUPER_ADMIN, UserRole.SUPPORT_IT],
          },
          {
            id: 'sit-witnesses',
            labelKey: 'nav.supportItWitnesses',
            to: '/support-it/witnesses',
            icon: ShieldCheckIcon,
            roles: [UserRole.SUPER_ADMIN, UserRole.SUPPORT_IT],
          },
          {
            id: 'sit-alerts',
            labelKey: 'nav.supportItAlerts',
            to: '/support-it/alerts',
            icon: BellAlertIcon,
            roles: [UserRole.SUPER_ADMIN, UserRole.SUPPORT_IT],
          },
          {
            id: 'sit-tickets',
            labelKey: 'nav.supportItTickets',
            to: '/support-it/tickets',
            icon: ClipboardDocumentListIcon,
            roles: [UserRole.SUPER_ADMIN, UserRole.SUPPORT_IT],
          },
        ],
      },
    ],
  },
  {
    id: 'interne',
    titleKey: 'nav.sectionInterne',
    roles: SETUP,
    entries: [
      {
        id: 'crm',
        labelKey: 'nav.crm',
        icon: UsersIcon,
        roles: SETUP,
        children: [
          {
            id: 'crm-dashboard',
            labelKey: 'nav.crmDashboard',
            to: '/crm/followups/dashboard',
            icon: ChartBarIcon,
            roles: SETUP,
            match: exact('/crm/followups/dashboard'),
          },
          {
            id: 'crm-followups',
            labelKey: 'nav.crmFollowups',
            to: '/crm/followups',
            icon: ClipboardDocumentListIcon,
            roles: SETUP,
            match: exact('/crm/followups'),
          },
        ],
      },
      {
        id: 'suivi-techniciens',
        labelKey: 'nav.suiviTechniciens',
        icon: WrenchScrewdriverIcon,
        roles: SETUP,
        children: [
          {
            id: 'fiche-installation',
            labelKey: 'nav.ficheInstallation',
            to: '/parametres/fiches-installation',
            icon: DocumentPlusIcon,
            roles: SETUP,
            match: (p) => p.startsWith('/parametres/fiches-installation'),
          },
          {
            id: 'param-rapport-tech',
            labelKey: 'nav.rapportTechnicien',
            to: '/parametres/rapport-technicien',
            icon: ClipboardDocumentListIcon,
            roles: SETUP,
            match: exact('/parametres/rapport-technicien'),
          },
          {
            id: 'param-activites-tech',
            labelKey: 'nav.activitesTechniciens',
            to: '/parametres/activites-techniciens',
            icon: DocumentChartBarIcon,
            roles: [UserRole.SUPER_ADMIN],
            match: exact('/parametres/activites-techniciens'),
          },
        ],
      },
      {
        id: 'param-admin-abonnements',
        labelKey: 'nav.adminAbonnements',
        to: '/parametres/admin/abonnements',
        icon: BanknotesIcon,
        roles: [UserRole.SUPER_ADMIN],
        match: exact('/parametres/admin/abonnements'),
      },
    ],
  },
  {
    id: 'compte',
    titleKey: 'nav.sectionCompte',
    roles: ALL,
    entries: [
      {
        id: 'mon-espace',
        labelKey: 'nav.monEspace',
        to: '/mon-espace',
        icon: UserCircleIcon,
        roles: [UserRole.EMPLOYE],
      },
      {
        id: 'parametres',
        labelKey: 'nav.parametres',
        icon: Cog6ToothIcon,
        roles: ALL,
        children: [
          {
            id: 'param-profile',
            labelKey: 'nav.profile',
            to: '/parametres/profile',
            icon: UserIcon,
            roles: ALL,
            match: exact('/parametres/profile'),
          },
          {
            id: 'param-company',
            labelKey: 'nav.company',
            to: '/parametres/entreprise',
            icon: BuildingOffice2Icon,
            roles: ADMIN_SUPER,
            match: exact('/parametres/entreprise'),
          },
          {
            id: 'param-users',
            labelKey: 'nav.users',
            to: '/parametres/utilisateurs',
            icon: UsersIcon,
            roles: ADMIN_SUPER_TECH,
            match: exact('/parametres/utilisateurs'),
          },
          {
            id: 'param-roles',
            labelKey: 'nav.roles',
            to: '/parametres/roles',
            icon: ShieldCheckIcon,
            roles: [UserRole.SUPER_ADMIN],
            match: exact('/parametres/roles'),
          },
          {
            id: 'param-rapports-planifies',
            labelKey: 'nav.rapportsPlanifies',
            to: '/parametres/rapports-planifies',
            icon: DocumentChartBarIcon,
            roles: ADMIN_SUPER,
            match: exact('/parametres/rapports-planifies'),
          },
          {
            id: 'param-support',
            labelKey: 'nav.supportPlaintes',
            to: '/parametres/support',
            icon: WrenchScrewdriverIcon,
            roles: [UserRole.ADMIN_ENTERPRISE, UserRole.MANAGER],
            match: exact('/parametres/support'),
          },
          {
            id: 'param-aide',
            labelKey: 'nav.centreAide',
            to: '/parametres/aide',
            icon: QuestionMarkCircleIcon,
            roles: CLIENTS_TECH,
            match: exact('/parametres/aide'),
          },
        ],
      },
    ],
  },
]

const sectionOrderByRole: Partial<Record<UserRole, string[]>> = {
  [UserRole.TECHNICIEN]: ['outils', 'exploitation', 'interne', 'compte'],
  [UserRole.SUPPORT_IT]: ['outils', 'compte'],
  [UserRole.EMPLOYE]: ['compte'],
}

export function buildMenu(role: UserRole | undefined): MenuSection[] {
  if (!role) return []

  const visible = sections
    .filter((section) => section.roles.includes(role))
    .map((section) => {
      const entries = section.entries
        .filter((entry) => entry.roles.includes(role))
        .map((entry) => {
          if (isGroup(entry)) {
            return { ...entry, children: entry.children.filter((c) => c.roles.includes(role)) }
          }
          return entry
        })
        .filter((entry) => !isGroup(entry) || entry.children.length > 0)
      return { ...section, entries }
    })
    .filter((section) => section.entries.length > 0)

  const order = sectionOrderByRole[role]
  if (!order) return visible

  return [...visible].sort((a, b) => {
    const ia = order.indexOf(a.id)
    const ib = order.indexOf(b.id)
    if (ia === -1 && ib === -1) return 0
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })
}
