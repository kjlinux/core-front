import type { RouteRecordRaw } from 'vue-router'
import { UserRole } from '@/types/enums'

const marketplaceRoutes: RouteRecordRaw[] = [
  {
    path: '/marketplace',
    meta: { requiresAuth: true, layout: 'dashboard', module: 'marketplace' },
    children: [
      {
        path: '',
        name: 'marketplace-catalog',
        component: () => import('@/pages/marketplace/ProductCatalogPage.vue'),
        meta: { title: 'Catalogue RFID' },
      },
      {
        path: 'products/:id',
        name: 'marketplace-product-detail',
        component: () => import('@/pages/marketplace/ProductDetailPage.vue'),
        meta: { title: 'Detail produit' },
      },
      {
        path: 'cart',
        name: 'marketplace-cart',
        component: () => import('@/pages/marketplace/CartPage.vue'),
        meta: { title: 'Mon panier' },
      },
      {
        path: 'checkout',
        name: 'marketplace-checkout',
        component: () => import('@/pages/marketplace/CheckoutPage.vue'),
        meta: { title: 'Finaliser la commande' },
      },
      {
        path: 'orders',
        name: 'marketplace-orders',
        component: () => import('@/pages/marketplace/MyOrdersPage.vue'),
        meta: { title: 'Mes commandes' },
      },
      {
        path: 'orders/:id',
        name: 'marketplace-order-detail',
        component: () => import('@/pages/marketplace/OrderDetailPage.vue'),
        meta: { title: 'Detail commande' },
      },
      {
        path: 'payment/callback',
        name: 'marketplace-payment-callback',
        component: () => import('@/pages/marketplace/PaymentCallbackPage.vue'),
        meta: { title: 'Traitement du paiement' },
      },
      // Admin pages - Super Admin only
      {
        path: 'admin/products',
        name: 'marketplace-admin-products',
        component: () => import('@/pages/marketplace/admin/AdminProductListPage.vue'),
        meta: { title: 'Gestion produits', roles: [UserRole.SUPER_ADMIN] },
      },
      {
        path: 'admin/products/create',
        name: 'marketplace-admin-product-create',
        component: () => import('@/pages/marketplace/admin/AdminProductCreatePage.vue'),
        meta: { title: 'Nouveau produit', roles: [UserRole.SUPER_ADMIN] },
      },
      {
        path: 'admin/products/:id/edit',
        name: 'marketplace-admin-product-edit',
        component: () => import('@/pages/marketplace/admin/AdminProductEditPage.vue'),
        meta: { title: 'Modifier produit', roles: [UserRole.SUPER_ADMIN] },
      },
      {
        path: 'admin/orders',
        name: 'marketplace-admin-orders',
        component: () => import('@/pages/marketplace/admin/AdminOrderListPage.vue'),
        meta: { title: 'Toutes les commandes', roles: [UserRole.SUPER_ADMIN] },
      },
      {
        path: 'admin/orders/:id',
        name: 'marketplace-admin-order-detail',
        component: () => import('@/pages/marketplace/admin/AdminOrderDetailPage.vue'),
        meta: { title: 'Detail commande admin', roles: [UserRole.SUPER_ADMIN] },
      },
      {
        path: 'admin/reports',
        name: 'marketplace-admin-reports',
        component: () => import('@/pages/marketplace/admin/SalesReportsPage.vue'),
        meta: { title: 'Rapports de ventes', roles: [UserRole.SUPER_ADMIN] },
      },
      {
        path: 'admin/inventory',
        name: 'marketplace-admin-inventory',
        component: () => import('@/pages/marketplace/admin/InventoryManagementPage.vue'),
        meta: { title: 'Gestion des stocks', roles: [UserRole.SUPER_ADMIN] },
      },
    ],
  },
]

export default marketplaceRoutes
