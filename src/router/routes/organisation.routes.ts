import type { RouteRecordRaw } from 'vue-router'
import { UserRole } from '@/types/enums'

const organisationRoutes: RouteRecordRaw[] = [
  {
    path: '/organisation',
    meta: { requiresAuth: true, layout: 'dashboard', module: 'organisation' },
    children: [
      {
        path: 'companies',
        name: 'rfid-companies',
        component: () => import('@/pages/pointage-rfid/companies/CompanyListPage.vue'),
        meta: { title: 'Entreprises', roles: [UserRole.SUPER_ADMIN, UserRole.TECHNICIEN] },
      },
      {
        path: 'companies/create',
        name: 'rfid-company-create',
        component: () => import('@/pages/pointage-rfid/companies/CompanyCreatePage.vue'),
        meta: { title: 'Nouvelle entreprise', roles: [UserRole.SUPER_ADMIN, UserRole.TECHNICIEN] },
      },
      {
        path: 'companies/:id',
        name: 'rfid-company-detail',
        component: () => import('@/pages/pointage-rfid/companies/CompanyDetailPage.vue'),
        meta: { title: 'Détail entreprise', roles: [UserRole.SUPER_ADMIN, UserRole.TECHNICIEN] },
      },
      {
        path: 'companies/:id/edit',
        name: 'rfid-company-edit',
        component: () => import('@/pages/pointage-rfid/companies/CompanyEditPage.vue'),
        meta: { title: 'Modifier entreprise', roles: [UserRole.SUPER_ADMIN, UserRole.TECHNICIEN] },
      },
      {
        path: 'sites',
        name: 'rfid-sites',
        component: () => import('@/pages/pointage-rfid/sites/SiteListPage.vue'),
        meta: { title: 'Sites' },
      },
      {
        path: 'sites/:id',
        name: 'rfid-site-detail',
        component: () => import('@/pages/pointage-rfid/sites/SiteDetailPage.vue'),
        meta: { title: 'Détail site' },
      },
      {
        path: 'departments',
        name: 'rfid-departments',
        component: () => import('@/pages/pointage-rfid/departments/DepartmentListPage.vue'),
        meta: { title: 'Départements' },
      },
      {
        path: 'departments/:id',
        name: 'rfid-department-detail',
        component: () => import('@/pages/pointage-rfid/departments/DepartmentDetailPage.vue'),
        meta: { title: 'Détail département' },
      },
      {
        path: 'employees',
        name: 'rfid-employees',
        component: () => import('@/pages/pointage-rfid/employees/EmployeeListPage.vue'),
        meta: { title: 'Employés' },
      },
      {
        path: 'employees/create',
        name: 'rfid-employee-create',
        component: () => import('@/pages/pointage-rfid/employees/EmployeeCreatePage.vue'),
        meta: {
          title: 'Nouvel employé',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE, UserRole.TECHNICIEN],
        },
      },
      {
        path: 'employees/:id',
        name: 'rfid-employee-detail',
        component: () => import('@/pages/pointage-rfid/employees/EmployeeDetailPage.vue'),
        meta: { title: 'Détail employé' },
      },
      {
        path: 'employees/:id/edit',
        name: 'rfid-employee-edit',
        component: () => import('@/pages/pointage-rfid/employees/EmployeeEditPage.vue'),
        meta: {
          title: 'Modifier employé',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE, UserRole.TECHNICIEN],
        },
      },
      {
        path: 'schedules',
        name: 'rfid-schedules',
        component: () => import('@/pages/pointage-rfid/schedules/ScheduleListPage.vue'),
        meta: { title: 'Horaires' },
      },
      {
        path: 'schedules/help',
        name: 'rfid-schedule-help',
        component: () => import('@/pages/pointage-rfid/schedules/ScheduleHelpPage.vue'),
        meta: {
          title: 'Aide - Horaires',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE, UserRole.TECHNICIEN],
        },
      },
      {
        path: 'schedules/create',
        name: 'rfid-schedule-create',
        component: () => import('@/pages/pointage-rfid/schedules/ScheduleCreatePage.vue'),
        meta: {
          title: 'Nouvel horaire',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE, UserRole.TECHNICIEN],
        },
      },
      {
        path: 'schedules/:id/edit',
        name: 'rfid-schedule-edit',
        component: () => import('@/pages/pointage-rfid/schedules/ScheduleEditPage.vue'),
        meta: {
          title: 'Modifier horaire',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE, UserRole.TECHNICIEN],
        },
      },
      {
        path: 'holidays',
        name: 'rfid-holidays',
        component: () => import('@/pages/pointage-rfid/schedules/HolidayManagementPage.vue'),
        meta: { title: 'Jours fériés' },
      },
      {
        path: 'absences',
        name: 'rfid-absence-requests',
        component: () => import('@/pages/pointage-rfid/absences/AbsenceRequestsPage.vue'),
        meta: {
          title: 'Justificatifs d\'absence',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE, UserRole.MANAGER],
        },
      },
    ],
  },
]

export default organisationRoutes
