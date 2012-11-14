import type { RouteRecordRaw } from 'vue-router'
import { UserRole } from '@/types/enums'

const pointageRfidRoutes: RouteRecordRaw[] = [
  {
    path: '/pointage-rfid',
    meta: { requiresAuth: true, layout: 'dashboard', module: 'pointage-rfid' },
    children: [
      {
        path: 'companies',
        name: 'rfid-companies',
        component: () => import('@/pages/pointage-rfid/companies/CompanyListPage.vue'),
        meta: { title: 'Entreprises', roles: [UserRole.SUPER_ADMIN] },
      },
      {
        path: 'companies/create',
        name: 'rfid-company-create',
        component: () => import('@/pages/pointage-rfid/companies/CompanyCreatePage.vue'),
        meta: { title: 'Nouvelle entreprise', roles: [UserRole.SUPER_ADMIN] },
      },
      {
        path: 'companies/:id',
        name: 'rfid-company-detail',
        component: () => import('@/pages/pointage-rfid/companies/CompanyDetailPage.vue'),
        meta: { title: 'Detail entreprise' },
      },
      {
        path: 'companies/:id/edit',
        name: 'rfid-company-edit',
        component: () => import('@/pages/pointage-rfid/companies/CompanyEditPage.vue'),
        meta: { title: 'Modifier entreprise', roles: [UserRole.SUPER_ADMIN] },
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
        meta: { title: 'Detail site' },
      },
      {
        path: 'departments',
        name: 'rfid-departments',
        component: () => import('@/pages/pointage-rfid/departments/DepartmentListPage.vue'),
        meta: { title: 'Departements' },
      },
      {
        path: 'departments/:id',
        name: 'rfid-department-detail',
        component: () => import('@/pages/pointage-rfid/departments/DepartmentDetailPage.vue'),
        meta: { title: 'Detail departement' },
      },
      {
        path: 'employees',
        name: 'rfid-employees',
        component: () => import('@/pages/pointage-rfid/employees/EmployeeListPage.vue'),
        meta: { title: 'Employes' },
      },
      {
        path: 'employees/create',
        name: 'rfid-employee-create',
        component: () => import('@/pages/pointage-rfid/employees/EmployeeCreatePage.vue'),
        meta: { title: 'Nouvel employe', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE] },
      },
      {
        path: 'employees/:id',
        name: 'rfid-employee-detail',
        component: () => import('@/pages/pointage-rfid/employees/EmployeeDetailPage.vue'),
        meta: { title: 'Detail employe' },
      },
      {
        path: 'employees/:id/edit',
        name: 'rfid-employee-edit',
        component: () => import('@/pages/pointage-rfid/employees/EmployeeEditPage.vue'),
        meta: { title: 'Modifier employe', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE] },
      },
      {
        path: 'cards',
        name: 'rfid-cards',
        component: () => import('@/pages/pointage-rfid/cards/CardListPage.vue'),
        meta: { title: 'Cartes RFID' },
      },
      {
        path: 'cards/register',
        name: 'rfid-card-register',
        component: () => import('@/pages/pointage-rfid/cards/CardRegisterPage.vue'),
        meta: { title: 'Enregistrer carte', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE] },
      },
      {
        path: 'cards/:id',
        name: 'rfid-card-detail',
        component: () => import('@/pages/pointage-rfid/cards/CardDetailPage.vue'),
        meta: { title: 'Detail carte' },
      },
      {
        path: 'cards/:id/history',
        name: 'rfid-card-history',
        component: () => import('@/pages/pointage-rfid/cards/CardHistoryPage.vue'),
        meta: { title: 'Historique carte' },
      },
      {
        path: 'schedules',
        name: 'rfid-schedules',
        component: () => import('@/pages/pointage-rfid/schedules/ScheduleListPage.vue'),
        meta: { title: 'Horaires' },
      },
      {
        path: 'schedules/create',
        name: 'rfid-schedule-create',
        component: () => import('@/pages/pointage-rfid/schedules/ScheduleCreatePage.vue'),
        meta: { title: 'Nouvel horaire', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE] },
      },
      {
        path: 'schedules/:id/edit',
        name: 'rfid-schedule-edit',
        component: () => import('@/pages/pointage-rfid/schedules/ScheduleEditPage.vue'),
        meta: { title: 'Modifier horaire', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE] },
      },
      {
        path: 'holidays',
        name: 'rfid-holidays',
        component: () => import('@/pages/pointage-rfid/schedules/HolidayManagementPage.vue'),
        meta: { title: 'Jours feries' },
      },
      {
        path: 'attendance',
        name: 'rfid-attendance-dashboard',
        component: () => import('@/pages/pointage-rfid/attendance/AttendanceDashboardPage.vue'),
        meta: { title: 'Pointage' },
      },
      {
        path: 'attendance/daily',
        name: 'rfid-attendance-daily',
        component: () => import('@/pages/pointage-rfid/attendance/AttendanceDailyPage.vue'),
        meta: { title: 'Pointage journalier' },
      },
      {
        path: 'attendance/monthly',
        name: 'rfid-attendance-monthly',
        component: () => import('@/pages/pointage-rfid/attendance/AttendanceMonthlyPage.vue'),
        meta: { title: 'Pointage mensuel' },
      },
      {
        path: 'attendance/employee/:id',
        name: 'rfid-attendance-employee',
        component: () => import('@/pages/pointage-rfid/attendance/AttendanceByEmployeePage.vue'),
        meta: { title: 'Pointage par employe' },
      },
      {
        path: 'attendance/department/:id',
        name: 'rfid-attendance-department',
        component: () => import('@/pages/pointage-rfid/attendance/AttendanceByDepartmentPage.vue'),
        meta: { title: 'Pointage par departement' },
      },
      {
        path: 'reports',
        name: 'rfid-reports',
        component: () => import('@/pages/pointage-rfid/reports/ReportsPage.vue'),
        meta: { title: 'Rapports' },
      },
    ],
  },
]

export default pointageRfidRoutes
