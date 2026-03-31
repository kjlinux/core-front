import type { RouteRecordRaw } from 'vue-router'
import { UserRole } from '@/types/enums'

const firmwareRoutes: RouteRecordRaw[] = [
  {
    path: '/firmware',
    meta: {
      requiresAuth: true,
      layout: 'dashboard',
      module: 'firmware',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE, UserRole.TECHNICIEN],
    },
    children: [
      {
        path: '',
        name: 'firmware-versions',
        component: () => import('@/pages/firmware/FirmwareVersionListPage.vue'),
        meta: {
          title: 'Versions firmware',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE, UserRole.TECHNICIEN],
        },
      },
      {
        path: 'upload',
        name: 'firmware-upload',
        component: () => import('@/pages/firmware/FirmwareUploadPage.vue'),
        meta: {
          title: 'Telecharger firmware',
          roles: [UserRole.SUPER_ADMIN, UserRole.TECHNICIEN],
        },
      },
      {
        path: 'devices',
        name: 'firmware-device-status',
        component: () => import('@/pages/firmware/FirmwareDeviceStatusPage.vue'),
        meta: {
          title: 'Etat firmware des terminaux',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE, UserRole.TECHNICIEN],
        },
      },
      {
        path: 'logs',
        name: 'firmware-logs',
        component: () => import('@/pages/firmware/FirmwareUpdateLogsPage.vue'),
        meta: {
          title: 'Historique mises a jour',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN_ENTERPRISE, UserRole.TECHNICIEN],
        },
      },
    ],
  },
]

export default firmwareRoutes
