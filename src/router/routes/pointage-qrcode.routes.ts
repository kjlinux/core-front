import type { RouteRecordRaw } from 'vue-router'
import { UserRole } from '@/types/enums'

const pointageQrcodeRoutes: RouteRecordRaw[] = [
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
        meta: { title: 'QR Codes' },
      },
      {
        path: 'generate',
        name: 'qrcode-generate',
        component: () => import('@/pages/pointage-qrcode/QrCodeGeneratePage.vue'),
        meta: {
          title: 'Generer un QR Code',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE, UserRole.TECHNICIEN],
        },
      },
      {
        path: 'scan',
        name: 'qrcode-scan',
        component: () => import('@/pages/pointage-qrcode/QrCodeScanPage.vue'),
        meta: { title: 'Scanner QR Code' },
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
