import type { OrderStatus, PaymentMethod, PaymentStatus } from './enums'

export interface Product {
  id: string
  name: string
  description: string
  category: 'standard_card' | 'custom_card' | 'enterprise_pack'
  price: number
  currency: string
  stockQuantity: number
  images: string[]
  customizable: boolean
  minQuantity: number
  isActive: boolean
}

export interface CartItem {
  productId: string
  product: Product
  quantity: number
  customization?: {
    logoUrl?: string
    companyName?: string
    color?: string
  }
}

export interface Order {
  id: string
  orderNumber: string
  companyId: string
  companyName: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  currency: string
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  deliveryAddress: DeliveryAddress
  invoiceUrl?: string
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  customization?: Record<string, string>
}

export interface DeliveryAddress {
  fullName: string
  phone: string
  street: string
  city: string
  country: string
}
