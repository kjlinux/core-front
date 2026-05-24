import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { CartItem, Product } from '@/types'

function loadCartFromStorage(): CartItem[] {
  try {
    const stored = localStorage.getItem('cart_items')
    if (!stored) return []
    return JSON.parse(stored) as CartItem[]
  } catch {
    // Mode prive, storage corrompu ou indisponible
    return []
  }
}

function persistCart(items: CartItem[]) {
  try {
    localStorage.setItem('cart_items', JSON.stringify(items))
  } catch {
    // Quota depasse / mode prive : on garde l'etat en memoire
  }
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>(loadCartFromStorage())

  const itemCount = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
  const subtotal = computed(() => items.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0))
  const isEmpty = computed(() => items.value.length === 0)

  function addItem(product: Product, quantity: number, customization?: CartItem['customization']) {
    const existing = items.value.find((item) => item.productId === product.id)
    if (existing) {
      existing.quantity += quantity
      if (customization) {
        existing.customization = customization
      }
    } else {
      items.value.push({
        productId: product.id,
        product,
        quantity,
        customization,
      })
    }
    persistCart(items.value)
  }

  function removeItem(productId: string) {
    items.value = items.value.filter((item) => item.productId !== productId)
    persistCart(items.value)
  }

  function updateQuantity(productId: string, quantity: number) {
    const item = items.value.find((i) => i.productId === productId)
    if (item) {
      item.quantity = quantity
      if (item.quantity <= 0) {
        removeItem(productId)
        return
      }
    }
    persistCart(items.value)
  }

  function clearCart() {
    items.value = []
    persistCart(items.value)
  }

  function setCustomization(productId: string, customization: CartItem['customization']) {
    const item = items.value.find((i) => i.productId === productId)
    if (item) {
      item.customization = customization
    }
    persistCart(items.value)
  }

  return { items, itemCount, subtotal, isEmpty, addItem, removeItem, updateQuantity, clearCart, setCustomization }
})
