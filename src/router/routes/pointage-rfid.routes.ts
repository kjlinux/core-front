import type { RouteRecordRaw } from 'vue-router'
import { UserRole } from '@/types/enums'

const pointageRfidRoutes: RouteRecordRaw[] = [
  {
    path: '/pointage-rfid',
    meta: { requiresAuth: true, layout: 'dashboard', module: 'pointage-rfid' },
    children: [
      {
        path: 'devices',
        name: 'rfid-devices',
        component: () => import('@/pages/pointage-rfid/devices/DeviceListPage.vue'),
        meta: {
          title: 'Terminaux RFID',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE, UserRole.TECHNICIEN],
        },
      },
      {
        path: 'devices/:id',
        name: 'rfid-device-detail',
        component: () => import('@/pages/pointage-rfid/devices/DeviceDetailPage.vue'),
        meta: {
          title: 'Détail terminal RFID',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE, UserRole.TECHNICIEN],
        },
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
        meta: {
          title: 'Enregistrer carte',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE, UserRole.TECHNICIEN],
        },
      },
      {
        path: 'cards/:id',
        name: 'rfid-card-detail',
        component: () => import('@/pages/pointage-rfid/cards/CardDetailPage.vue'),
        meta: { title: 'Détail carte' },
      },
      {
        path: 'cards/:id/history',
        name: 'rfid-card-history',
        component: () => import('@/pages/pointage-rfid/cards/CardHistoryPage.vue'),
        meta: { title: 'Historique carte' },
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
        meta: { title: 'Pointage par employé' },
      },
      {
        path: 'attendance/department/:id',
        name: 'rfid-attendance-department',
        component: () => import('@/pages/pointage-rfid/attendance/AttendanceByDepartmentPage.vue'),
        meta: { title: 'Pointage par département' },
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
