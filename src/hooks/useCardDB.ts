import { useState, useEffect } from 'react'
import type { Card } from '@/types/card'

export const useCardDB = () => {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCards = async () => {
      try {
        setLoading(true)
        // data/cards.jsonを直接フェッチ
        const response = await fetch('/data/cards.json')
        
        if (!response.ok) {
          throw new Error(`Failed to load cards: ${response.status}`)
        }
        
        const cardsData: Card[] = await response.json()
        setCards(cardsData)
        console.log(`Loaded ${cardsData.length} cards successfully`)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(errorMessage)
        console.error('Error loading cards:', errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadCards()
  }, [])

  return {
    cards,
    loading,
    error,
    totalCount: cards.length
  }
}