import type { RouteRecordRaw } from 'vue-router'
import { UserRole } from '@/types/enums'

const marketplaceRoutes: RouteRecordRaw[] = [
  {
    path: '/marketplace',
    meta: { requiresAuth: true, layout: 'dashboard', module: 'marketplace' },
    children: [
      { path: '', name: 'marketplace-catalog', component: () => import('@/pages/marketplace/catalog/CatalogPage.vue'), meta: { title: 'Catalogue' } },
      { path: 'product/:id', name: 'marketplace-product', component: () => import('@/pages/marketplace/catalog/ProductDetailPage.vue'), meta: { title: 'Detail produit' } },
      { path: 'cart', name: 'marketplace-cart', component: () => import('@/pages/marketplace/cart/CartPage.vue'), meta: { title: 'Panier' } },
      { path: 'order/create', name: 'marketplace-order-create', component: () => import('@/pages/marketplace/orders/OrderCreatePage.vue'), meta: { title: 'Passer commande' } },
      { path: 'orders', name: 'marketplace-orders', component: () => import('@/pages/marketplace/orders/OrderListPage.vue'), meta: { title: 'Mes commandes' } },
      { path: 'orders/:id', name: 'marketplace-order-detail', component: () => import('@/pages/marketplace/orders/OrderDetailPage.vue'), meta: { title: 'Detail commande' } },
      { path: 'orders/:id/tracking', name: 'marketplace-order-tracking', component: () => import('@/pages/marketplace/orders/OrderTrackingPage.vue'), meta: { title: 'Suivi commande' } },
      { path: 'payment/:orderId', name: 'marketplace-payment', component: () => import('@/pages/marketplace/payment/PaymentPage.vue'), meta: { title: 'Paiement' } },
      { path: 'payment/success', name: 'marketplace-payment-success', component: () => import('@/pages/marketplace/payment/PaymentSuccessPage.vue'), meta: { title: 'Paiement reussi' } },
      { path: 'payment/failed', name: 'marketplace-payment-failed', component: () => import('@/pages/marketplace/payment/PaymentFailedPage.vue'), meta: { title: 'Paiement echoue' } },
      { path: 'admin', name: 'marketplace-admin', component: () => import('@/pages/marketplace/admin/MarketplaceAdminPage.vue'), meta: { title: 'Administration Marketplace', roles: [UserRole.SUPER_ADMIN] } },
      { path: 'admin/products', name: 'marketplace-product-mgmt', component: () => import('@/pages/marketplace/admin/ProductManagementPage.vue'), meta: { title: 'Gestion produits', roles: [UserRole.SUPER_ADMIN] } },
      { path: 'admin/orders', name: 'marketplace-order-mgmt', component: () => import('@/pages/marketplace/admin/OrderManagementPage.vue'), meta: { title: 'Gestion commandes', roles: [UserRole.SUPER_ADMIN] } },
      { path: 'admin/stock', name: 'marketplace-stock', component: () => import('@/pages/marketplace/admin/StockManagementPage.vue'), meta: { title: 'Gestion stock', roles: [UserRole.SUPER_ADMIN] } },
    ],
  },
]

export default marketplaceRoutes
