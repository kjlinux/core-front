import { ref } from 'vue'
import { defineStore } from 'pinia'
import { cardApi } from '@/services/api/card.api'
import type { RfidCard, CardHistoryEntry } from '@/types'

export const useCardStore = defineStore('card', () => {
  const cards = ref<RfidCard[]>([])
  const currentCard = ref<RfidCard | null>(null)
  const cardHistory = ref<CardHistoryEntry[]>([])
  const isLoading = ref(false)

  async function fetchCards(params?: Record<string, unknown>) {
    isLoading.value = true
    try {
      cards.value = await cardApi.getAll(params)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCard(id: string) {
    isLoading.value = true
    try {
      currentCard.value = await cardApi.getById(id)
    } finally {
      isLoading.value = false
    }
  }

  async function registerCard(data: Partial<RfidCard>) {
    isLoading.value = true
    try {
      const created = await cardApi.register(data)
      cards.value.push(created)
      return created
    } finally {
      isLoading.value = false
    }
  }

  async function assignCard(cardId: string, employeeId: string) {
    isLoading.value = true
    try {
      const updated = await cardApi.assign(cardId, employeeId)
      const index = cards.value.findIndex((c) => c.id === cardId)
      if (index !== -1) {
        cards.value[index] = updated
      }
      if (currentCard.value?.id === cardId) {
        currentCard.value = updated
      }
      return updated
    } finally {
      isLoading.value = false
    }
  }

  async function blockCard(id: string, reason: string) {
    isLoading.value = true
    try {
      const updated = await cardApi.block(id, reason)
      const index = cards.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        cards.value[index] = updated
      }
      if (currentCard.value?.id === id) {
        currentCard.value = updated
      }
      return updated
    } finally {
      isLoading.value = false
    }
  }

  async function unblockCard(id: string) {
    isLoading.value = true
    try {
      const updated = await cardApi.unblock(id)
      const index = cards.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        cards.value[index] = updated
      }
      if (currentCard.value?.id === id) {
        currentCard.value = updated
      }
      return updated
    } finally {
      isLoading.value = false
    }
  }

  async function fetchHistory(cardId: string) {
    isLoading.value = true
    try {
      cardHistory.value = await cardApi.getHistory(cardId)
    } finally {
      isLoading.value = false
    }
  }

  return { cards, currentCard, cardHistory, isLoading, fetchCards, fetchCard, registerCard, assignCard, blockCard, unblockCard, fetchHistory }
})
