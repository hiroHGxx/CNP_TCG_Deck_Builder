import { useState, useEffect, useCallback } from 'react'
import type { Card } from '@/types/card'
import { fetchWithRetry, ManualRetryHandler } from '@/utils/retryHandler'
import { createDetailedError, logError, type DetailedError } from '@/utils/errorHandler'

interface UseCardDBReturn {
  cards: Card[]
  loading: boolean
  error: DetailedError | null
  totalCount: number
  retry: () => void
  canRetry: boolean
}

export const useCardDB = (): UseCardDBReturn => {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<DetailedError | null>(null)
  const [retryHandler] = useState(() => new ManualRetryHandler<Card[]>(
    async () => {
      const result = await fetchWithRetry('/data/cards.json', {}, {
        maxAttempts: 3,
        delayMs: 1000,
        backoffMultiplier: 2
      })

      if (!result.success || !result.data) {
        throw result.error || new Error('Failed to fetch cards')
      }

      const cardsData: Card[] = await result.data.json()
      
      if (!Array.isArray(cardsData)) {
        throw new Error('Invalid cards data format: expected array')
      }

      return cardsData
    },
    { maxAttempts: 5 }
  ))

  const loadCards = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await retryHandler.execute()
      
      if (result.success && result.data) {
        setCards(result.data)
        console.log(`Loaded ${result.data.length} cards successfully after ${result.attempts} attempts`)
      } else {
        const detailedError = createDetailedError(result.error)
        setError(detailedError)
        logError(detailedError, 'useCardDB.loadCards')
      }
    } catch (err) {
      const detailedError = createDetailedError(err)
      setError(detailedError)
      logError(detailedError, 'useCardDB.loadCards')
      console.error('Error loading cards:', detailedError)
    } finally {
      setLoading(false)
    }
  }, [retryHandler])

  const retry = useCallback(() => {
    if (retryHandler.canRetry()) {
      loadCards()
    }
  }, [loadCards, retryHandler])

  useEffect(() => {
    loadCards()
  }, [loadCards])

  return {
    cards,
    loading,
    error,
    totalCount: cards.length,
    retry,
    canRetry: retryHandler.canRetry()
  }
}