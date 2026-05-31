import type { RouteRecordRaw } from 'vue-router'
import { UserRole } from '@/types/enums'

const settingsRoutes: RouteRecordRaw[] = [
  {
    path: '/parametres',
    meta: { requiresAuth: true, layout: 'dashboard' },
    children: [
      {
        path: 'profile',
        name: 'settings-profile',
        component: () => import('@/pages/parametres/ProfilePage.vue'),
        meta: { title: 'Mon profil' },
      },
      {
        path: 'entreprise',
        name: 'settings-company',
        component: () => import('@/pages/parametres/CompanySettingsPage.vue'),
        meta: {
          title: 'Paramètres entreprise',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE, UserRole.TECHNICIEN],
        },
      },
      {
        path: 'utilisateurs',
        name: 'settings-users',
        component: () => import('@/pages/parametres/UserManagementPage.vue'),
        meta: {
          title: 'Gestion utilisateurs',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE, UserRole.TECHNICIEN],
        },
      },
      {
        path: 'roles',
        name: 'settings-roles',
        component: () => import('@/pages/parametres/RoleManagementPage.vue'),
        meta: {
          title: 'Gestion des rôles',
          roles: [UserRole.SUPER_ADMIN],
        },
      },
      {
        path: 'fiches-installation',
        name: 'technicien-installation-sheets',
        component: () => import('@/pages/parametres/InstallationSheetsListPage.vue'),
        meta: {
          title: "Fiches d'installation",
          roles: [UserRole.SUPER_ADMIN, UserRole.TECHNICIEN],
        },
      },
      {
        path: 'fiches-installation/nouvelle',
        name: 'technicien-installation-sheet',
        component: () => import('@/pages/parametres/InstallationSheetCreatePage.vue'),
        meta: {
          title: "Nouvelle fiche d'installation",
          roles: [UserRole.SUPER_ADMIN, UserRole.TECHNICIEN],
        },
      },
      {
        path: 'fiches-installation/:id',
        name: 'technicien-installation-sheet-detail',
        component: () => import('@/pages/parametres/InstallationSheetDetailPage.vue'),
        meta: {
          title: "Fiche d'installation",
          roles: [UserRole.SUPER_ADMIN, UserRole.TECHNICIEN],
        },
      },
      {
        path: 'rapport-technicien',
        name: 'technicien-report',
        component: () => import('@/pages/parametres/TechnicienReportPage.vue'),
        meta: {
          title: 'Rapport de mise en service',
          roles: [UserRole.SUPER_ADMIN, UserRole.TECHNICIEN],
        },
      },
      {
        path: 'activites-techniciens',
        name: 'technicien-activities',
        component: () => import('@/pages/parametres/TechnicienActivitiesPage.vue'),
        meta: {
          title: 'Activités techniciens',
          roles: [UserRole.SUPER_ADMIN],
        },
      },
      {
        path: 'admin/abonnements',
        name: 'admin-subscriptions',
        component: () => import('@/pages/parametres/admin/SubscriptionsAdminPage.vue'),
        meta: {
          title: 'Gestion des abonnements',
          roles: [UserRole.SUPER_ADMIN],
        },
      },
      {
        path: 'rapports-planifies',
        name: 'report-schedules',
        component: () => import('@/pages/parametres/ReportSchedulesPage.vue'),
        meta: {
          title: 'Rapports planifiés',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE],
        },
      },
      {
        path: 'aide',
        name: 'settings-help',
        component: () => import('@/pages/parametres/HelpPage.vue'),
        meta: { title: "Centre d'aide" },
      },
      {
        path: 'support',
        name: 'settings-support-tickets',
        component: () => import('@/pages/parametres/SupportTicketsPage.vue'),
        meta: {
          title: 'Support / Plaintes',
          roles: [UserRole.ADMIN_ENTERPRISE, UserRole.MANAGER],
        },
      },
    ],
  },
]

export default settingsRoutes
