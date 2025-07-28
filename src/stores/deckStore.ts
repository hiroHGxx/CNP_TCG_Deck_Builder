import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { calculateColorStats } from '@/utils/reikiCalculation'
import { calculateSupportBPDistribution } from '@/utils/supportBPCalculation'
import type { Card, CurrentDeck, Deck, DeckValidationResult, SupportBPDistribution } from '@/types/card'
import type { ReikiCard, ColorDistribution } from '@/types/reiki'

interface DeckStore {
  // 現在編集中のデッキ
  currentDeck: CurrentDeck
  
  // 保存済みデッキ一覧
  savedDecks: Deck[]
  
  // v2.0: 全カードデータ（色分布計算用）
  allCards: Card[]
  
  // メインデッキ操作
  addCardToDeck: (card: Card) => void
  removeCardFromDeck: (cardId: string) => void
  setCardCount: (cardId: string, count: number) => void
  clearDeck: () => void
  setDeckName: (name: string) => void
  
  // v2.0: カードデータ設定
  setAllCards: (cards: Card[]) => void
  
  // デッキ保存・読み込み
  saveDeck: () => string // deckIdを返す
  loadDeck: (deckId: string) => void
  deleteDeck: (deckId: string) => void
  
  // バリデーション
  validateDeck: () => DeckValidationResult
  
  // v2.0: 統計情報（正確な計算）
  getTotalCardCount: () => number
  getColorDistribution: () => ColorDistribution
  getCostCurve: () => Record<number, number>
  
  // v2.0: レイキサポート
  getMainDeckColorStats: () => ColorDistribution
  
  // v2.0: 助太刀BP統計
  getSupportBPDistribution: () => SupportBPDistribution
}

// バリデーションロジック
const validateDeckLogic = (cards: Record<string, number>, allCards: Card[]): DeckValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []
  
  // カード情報のマップを作成
  const cardMap = new Map(allCards.map(card => [card.cardId, card]))
  
  // 総枚数チェック
  const totalCards = Object.values(cards).reduce((sum, count) => sum + count, 0)
  if (totalCards < 50) {
    errors.push(`デッキは50枚である必要があります（現在: ${totalCards}枚、あと${50 - totalCards}枚必要）`)
  } else if (totalCards > 50) {
    errors.push(`デッキは50枚である必要があります（現在: ${totalCards}枚、${totalCards - 50}枚多い）`)
  }
  
  // 4枚制限チェック
  Object.entries(cards).forEach(([cardId, count]) => {
    if (count > 4) {
      const card = cardMap.get(cardId)
      errors.push(`${card?.name || cardId}は4枚を超えて入れることはできません（現在: ${count}枚）`)
    }
  })
  
  // 色分布計算
  const colorBalance: Record<string, number> = {}
  Object.entries(cards).forEach(([cardId, count]) => {
    const card = cardMap.get(cardId)
    if (card) {
      colorBalance[card.color] = (colorBalance[card.color] || 0) + count
    }
  })
  
  // コストカーブ計算
  const costCurve: Record<number, number> = {}
  Object.entries(cards).forEach(([cardId, count]) => {
    const card = cardMap.get(cardId)
    if (card) {
      costCurve[card.cost] = (costCurve[card.cost] || 0) + count
    }
  })
  
  // 警告: 色が偏りすぎている場合
  const totalNonColorless = Object.entries(colorBalance)
    .filter(([color]) => color !== 'colorless')
    .reduce((sum, [, count]) => sum + count, 0)
  
  Object.entries(colorBalance).forEach(([color, count]) => {
    if (color !== 'colorless' && totalNonColorless > 0) {
      const percentage = (count / totalNonColorless) * 100
      if (percentage > 80) {
        warnings.push(`${color}色のカードが多すぎる可能性があります（${percentage.toFixed(1)}%）`)
      }
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    totalCards,
    colorBalance,
    costCurve
  }
}

export const useDeckStore = create<DeckStore>()(
  persist(
    (set, get) => ({
      // 初期状態
      currentDeck: {
        name: 'New Deck',
        cards: {},
        lastModified: new Date().toISOString()
      },
      savedDecks: [],
      allCards: [], // v2.0: 全カードデータ
      
      // カードをデッキに追加
      addCardToDeck: (card: Card) => {
        const { currentDeck } = get()
        const currentCount = currentDeck.cards[card.cardId] || 0
        
        // 4枚制限チェック
        if (currentCount >= 4) {
          return // 追加しない
        }
        
        set({
          currentDeck: {
            ...currentDeck,
            cards: {
              ...currentDeck.cards,
              [card.cardId]: currentCount + 1
            },
            lastModified: new Date().toISOString()
          }
        })
      },
      
      // カードをデッキから削除
      removeCardFromDeck: (cardId: string) => {
        const { currentDeck } = get()
        const newCards = { ...currentDeck.cards }
        
        if (newCards[cardId]) {
          if (newCards[cardId] === 1) {
            delete newCards[cardId]
          } else {
            newCards[cardId] -= 1
          }
        }
        
        set({
          currentDeck: {
            ...currentDeck,
            cards: newCards,
            lastModified: new Date().toISOString()
          }
        })
      },
      
      // カード枚数を直接設定
      setCardCount: (cardId: string, count: number) => {
        const { currentDeck } = get()
        const newCards = { ...currentDeck.cards }
        
        if (count <= 0) {
          delete newCards[cardId]
        } else if (count <= 4) {
          newCards[cardId] = count
        }
        
        set({
          currentDeck: {
            ...currentDeck,
            cards: newCards,
            lastModified: new Date().toISOString()
          }
        })
      },
      
      // デッキをクリア
      clearDeck: () => {
        set({
          currentDeck: {
            name: 'New Deck',
            cards: {},
            lastModified: new Date().toISOString()
          }
        })
      },
      
      // デッキ名を設定
      setDeckName: (name: string) => {
        const { currentDeck } = get()
        set({
          currentDeck: {
            ...currentDeck,
            name,
            lastModified: new Date().toISOString()
          }
        })
      },
      
      // v2.0: 全カードデータ設定
      setAllCards: (cards: Card[]) => {
        set({ allCards: cards })
      },
      
      // デッキを保存
      saveDeck: () => {
        const { currentDeck, savedDecks } = get()
        const deckId = `deck_${Date.now()}`
        const now = new Date().toISOString()
        
        const newDeck: Deck = {
          deckId,
          name: currentDeck.name,
          cards: { ...currentDeck.cards },
          createdAt: now,
          updatedAt: now
        }
        
        set({
          savedDecks: [...savedDecks, newDeck]
        })
        
        return deckId
      },
      
      // デッキを読み込み
      loadDeck: (deckId: string) => {
        const { savedDecks } = get()
        const deck = savedDecks.find(d => d.deckId === deckId)
        
        if (deck) {
          set({
            currentDeck: {
              name: deck.name,
              cards: { ...deck.cards },
              lastModified: new Date().toISOString()
            }
          })
        }
      },
      
      // デッキを削除
      deleteDeck: (deckId: string) => {
        const { savedDecks } = get()
        set({
          savedDecks: savedDecks.filter(deck => deck.deckId !== deckId)
        })
      },
      
      // バリデーション
      validateDeck: () => {
        const { currentDeck, allCards } = get()
        return validateDeckLogic(currentDeck.cards, allCards)
      },
      
      // 総枚数取得
      getTotalCardCount: () => {
        const { currentDeck } = get()
        return Object.values(currentDeck.cards).reduce((sum, count) => sum + count, 0)
      },
      
      // v2.0: 色分布取得（正確な計算）
      getColorDistribution: () => {
        const { currentDeck, allCards } = get()
        return calculateColorStats(currentDeck.cards, allCards)
      },
      
      // コストカーブ取得
      getCostCurve: () => {
        const { currentDeck, allCards } = get()
        const cardMap = new Map(allCards.map(card => [card.cardId, card]))
        const costCurve: Record<number, number> = {}
        
        Object.entries(currentDeck.cards).forEach(([cardId, count]) => {
          const card = cardMap.get(cardId)
          if (card) {
            costCurve[card.cost] = (costCurve[card.cost] || 0) + count
          }
        })
        
        return costCurve
      },
      
      // v2.0: レイキサポート - メインデッキ色統計
      getMainDeckColorStats: () => {
        const { currentDeck, allCards } = get()
        return calculateColorStats(currentDeck.cards, allCards)
      },
      
      // v2.0: 助太刀BP統計
      getSupportBPDistribution: () => {
        const { currentDeck, allCards } = get()
        return calculateSupportBPDistribution(currentDeck.cards, allCards)
      }
    }),
    {
      name: 'deck-storage', // localStorageのキー名
      partialize: (state) => ({
        savedDecks: state.savedDecks,
        currentDeck: state.currentDeck
      })
    }
  )
)