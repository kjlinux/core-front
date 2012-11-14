export const UserRole = {
  SUPER_ADMIN: 'super_admin',
  ADMIN_ENTERPRISE: 'admin_enterprise',
  MANAGER: 'manager',
} as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const CardStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BLOCKED: 'blocked',
  LOST: 'lost',
} as const
export type CardStatus = (typeof CardStatus)[keyof typeof CardStatus]

export const AttendanceStatus = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  LEFT_EARLY: 'left_early',
} as const
export type AttendanceStatus = (typeof AttendanceStatus)[keyof typeof AttendanceStatus]

export const SatisfactionLevel = {
  BON: 'bon',
  NEUTRE: 'neutre',
  MAUVAIS: 'mauvais',
} as const
export type SatisfactionLevel = (typeof SatisfactionLevel)[keyof typeof SatisfactionLevel]

export const OrderStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus]

export const PaymentMethod = {
  MOBILE_MONEY: 'mobile_money',
  BANK_CARD: 'bank_card',
  MANUAL: 'manual',
} as const
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod]

export const PaymentStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]
