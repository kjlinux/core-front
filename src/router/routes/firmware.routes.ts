import type { RouteRecordRaw } from 'vue-router'
import { UserRole } from '@/types/enums'

const firmwareRoutes: RouteRecordRaw[] = [
  {
    path: '/firmware',
    meta: {
      requiresAuth: true,
      layout: 'dashboard',
      module: 'firmware',
      roles: [UserRole.SUPER_ADMIN],
    },
    children: [
      {
        path: '',
        name: 'firmware-versions',
        component: () => import('@/pages/firmware/FirmwareVersionListPage.vue'),
        meta: {
          title: 'Versions firmware',
          roles: [UserRole.SUPER_ADMIN],
        },
      },
      {
        path: 'upload',
        name: 'firmware-upload',
        component: () => import('@/pages/firmware/FirmwareUploadPage.vue'),
        meta: {
          title: 'Télécharger firmware',
          roles: [UserRole.SUPER_ADMIN],
        },
      },
      {
        path: 'devices',
        name: 'firmware-device-status',
        component: () => import('@/pages/firmware/FirmwareDeviceStatusPage.vue'),
        meta: {
          title: 'État firmware des terminaux',
          roles: [UserRole.SUPER_ADMIN],
        },
      },
      {
        path: 'logs',
        name: 'firmware-logs',
        component: () => import('@/pages/firmware/FirmwareUpdateLogsPage.vue'),
        meta: {
          title: 'Historique mises à jour',
          roles: [UserRole.SUPER_ADMIN],
        },
      },
    ],
  },
]

export default firmwareRoutes
