import type MockAdapter from 'axios-mock-adapter'

const mockOrders: Record<string, unknown>[] = [
  {
    id: 'ord-1', orderNumber: 'CMD-2026-001', companyId: 'c1', companyName: 'Acme SA',
    status: 'delivered', paymentStatus: 'paid', paymentMethod: 'mobile_money',
    subtotal: 50000, deliveryFee: 2000, total: 52000, currency: 'FCFA',
    createdAt: '2026-01-15T10:00:00Z', updatedAt: '2026-01-20T10:00:00Z',
    items: [{ productId: 'p1', productName: 'Carte RFID Standard', quantity: 10, unitPrice: 5000, totalPrice: 50000 }],
    deliveryAddress: { fullName: 'Jean Dupont', phone: '+22670000001', street: 'Rue 10', city: 'Ouagadougou', country: 'BF' },
  },
  {
    id: 'ord-2', orderNumber: 'CMD-2026-002', companyId: 'c2', companyName: 'TechCorp',
    status: 'pending', paymentStatus: 'pending', paymentMethod: 'bank_card',
    subtotal: 500000, deliveryFee: 5000, total: 505000, currency: 'FCFA',
    createdAt: '2026-02-01T09:30:00Z', updatedAt: '2026-02-01T09:30:00Z',
    items: [{ productId: 'p3', productName: 'Pack Enterprise', quantity: 1, unitPrice: 500000, totalPrice: 500000 }],
    deliveryAddress: { fullName: 'Marie Ouedraogo', phone: '+22670000002', street: 'Avenue 5', city: 'Bobo-Dioulasso', country: 'BF' },
  },
  {
    id: 'ord-3', orderNumber: 'CMD-2026-003', companyId: 'c1', companyName: 'Acme SA',
    status: 'processing', paymentStatus: 'paid', paymentMethod: 'mobile_money',
    subtotal: 400000, deliveryFee: 3000, total: 403000, currency: 'FCFA',
    createdAt: '2026-02-20T14:15:00Z', updatedAt: '2026-02-21T08:00:00Z',
    items: [{ productId: 'p2', productName: 'Carte RFID Personnalisee', quantity: 50, unitPrice: 8000, totalPrice: 400000 }],
    deliveryAddress: { fullName: 'Jean Dupont', phone: '+22670000001', street: 'Rue 10', city: 'Ouagadougou', country: 'BF' },
  },
]

const mockProducts = [
  { id: 'p1', name: 'Carte RFID Standard', description: 'Carte standard pour pointage', category: 'standard_card', price: 5000, currency: 'FCFA', stockQuantity: 500, minQuantity: 10, customizable: false, isActive: true, images: [] },
  { id: 'p2', name: 'Carte RFID Personnalisee', description: 'Carte avec logo entreprise', category: 'custom_card', price: 8000, currency: 'FCFA', stockQuantity: 200, minQuantity: 50, customizable: true, isActive: true, images: [] },
  { id: 'p3', name: 'Pack Enterprise', description: 'Pack complet pour grandes entreprises', category: 'enterprise_pack', price: 500000, currency: 'FCFA', stockQuantity: 20, minQuantity: 1, customizable: true, isActive: true, images: [] },
]

export function setupMarketplaceHandlers(mock: MockAdapter) {
  mock.onGet('/marketplace/products').reply(200, { data: mockProducts, success: true })

  mock.onGet(/\/marketplace\/products\/[^/]+$/).reply((config) => {
    const id = config.url?.split('/').pop()
    const p = mockProducts.find((x) => x.id === id)
    if (p) return [200, { data: p, success: true }]
    return [404, { message: 'Produit non trouve' }]
  })

  mock.onPost('/marketplace/products').reply((config) => {
    const data = JSON.parse(config.data)
    return [201, { data: { ...data, id: 'p' + Date.now() }, success: true }]
  })

  mock.onPut(/\/marketplace\/products\/[^/]+/).reply((config) => {
    return [200, { data: JSON.parse(config.data), success: true }]
  })

  mock.onDelete(/\/marketplace\/products\/[^/]+/).reply(200, { success: true })
  mock.onPatch(/\/marketplace\/products\/[^/]+\/stock/).reply((config) => {
    return [200, { data: JSON.parse(config.data), success: true }]
  })

  // Orders via /orders (orderApi)
  mock.onGet('/orders').reply(200, { data: mockOrders, meta: { total: mockOrders.length, currentPage: 1, perPage: 20, totalPages: 1 }, success: true })
  mock.onGet(/\/orders\/[^/]+$/).reply((config) => {
    const id = config.url?.split('/orders/')[1]?.split('/')[0]
    const order = mockOrders.find((o) => o.id === id) ?? mockOrders[0]
    return [200, { data: order ?? {}, success: true }]
  })
  mock.onPost('/orders').reply((config) => {
    const data = JSON.parse(config.data)
    const newOrder = { ...data, id: 'ord-' + Date.now(), status: 'pending', createdAt: new Date().toISOString() }
    mockOrders.push(newOrder)
    return [201, { data: newOrder, success: true }]
  })
  mock.onPatch(/\/orders\/[^/]+\/cancel/).reply((config) => {
    const id = config.url?.split('/orders/')[1]?.split('/')[0]
    const order = mockOrders.find((o) => o.id === id)
    if (order) order.status = 'cancelled'
    return [200, { data: order ?? {}, success: true }]
  })
  mock.onPost(/\/orders\/[^/]+\/payment/).reply(200, { data: { paymentUrl: 'https://mock-payment.com' }, success: true })

  // Admin orders
  mock.onGet('/admin/orders').reply(200, { data: mockOrders, meta: { total: mockOrders.length, currentPage: 1, perPage: 20, totalPages: 1 }, success: true })
}
