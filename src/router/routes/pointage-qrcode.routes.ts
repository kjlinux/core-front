import type { RouteRecordRaw } from 'vue-router'
import { UserRole } from '@/types/enums'

const pointageQrcodeRoutes: RouteRecordRaw[] = [
  // Route publique — page de scan mobile, accessible sans auth (l'employé scanne depuis son téléphone)
  {
    path: '/qr-scan',
    name: 'qr-scan-public',
    component: () => import('@/pages/pointage-qrcode/QrCodeScanPage.vue'),
    meta: { layout: 'none', title: 'Pointage QR Code' },
  },

  // Routes protégées du module
  {
    path: '/pointage-qrcode',
    meta: { requiresAuth: true, layout: 'dashboard', module: 'pointage-qrcode' },
    children: [
      {
        path: '',
        name: 'qrcode-dashboard',
        component: () => import('@/pages/pointage-qrcode/QrCodeDashboardPage.vue'),
        meta: { title: 'Tableau de bord QR Code' },
      },
      {
        path: 'list',
        name: 'qrcode-list',
        component: () => import('@/pages/pointage-qrcode/QrCodeListPage.vue'),
        meta: { title: 'QR Codes de sites' },
      },
      {
        path: 'generate',
        name: 'qrcode-generate',
        component: () => import('@/pages/pointage-qrcode/QrCodeGeneratePage.vue'),
        meta: {
          title: 'Generer QR Code de site',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE, UserRole.TECHNICIEN],
        },
      },
      {
        path: 'enroll',
        name: 'qrcode-enroll',
        component: () => import('@/pages/pointage-qrcode/QrCodeEnrollPage.vue'),
        meta: {
          title: 'Enrolement telephones',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE, UserRole.TECHNICIEN],
        },
      },
      {
        path: 'attendance',
        name: 'qrcode-attendance',
        component: () => import('@/pages/pointage-qrcode/QrCodeAttendancePage.vue'),
        meta: { title: 'Pointage QR Code' },
      },
      {
        path: 'reports',
        name: 'qrcode-reports',
        component: () => import('@/pages/pointage-qrcode/QrCodeReportsPage.vue'),
        meta: { title: 'Rapports QR Code' },
      },
    ],
  },
]

export default pointageQrcodeRoutes
