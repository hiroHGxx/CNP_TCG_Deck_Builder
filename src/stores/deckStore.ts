import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { calculateColorStats } from '@/utils/reikiCalculation'
import { calculateSupportBPDistribution } from '@/utils/supportBPCalculation'
import type { Card, CurrentDeck, Deck, DeckValidationResult, SupportBPDistribution } from '@/types/card'
import type { ReikiCard, ColorDistribution } from '@/types/reiki'

interface DeckStore {
  // 現在編集中のデッキ
  currentDeck: CurrentDeck
  
  // 保存済みデッキ一覧（v2.0統合形式）
  savedDecks: Deck[]
  
  // v1.0互換用（廃止予定）
  legacySavedDecks: any[]
  
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
  
  // v2.0: 統合デッキ保存・読み込み（メイン + レイキ一体管理）
  saveIntegratedDeck: (reikiCards: ReikiCard[]) => string
  loadIntegratedDeck: (deckId: string) => { success: boolean; reikiCards?: ReikiCard[] }
  deleteIntegratedDeck: (deckId: string) => void
  getIntegratedDecks: () => Deck[]
  
  // v1.0 → v2.0 移行サポート
  migrateLegacyDecks: () => { migrated: number; errors: string[] }
  hasLegacyDecks: () => boolean
  
  // v1.0互換（廃止予定）
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
      legacySavedDecks: [], // v1.0互換用
      allCards: [], // v2.0: 全カードデータ
      
      // カードをデッキに追加
      addCardToDeck: (card: Card) => {
        const { currentDeck } = get()
        const currentCount = currentDeck.cards[card.cardId] || 0
        
        // 4枚制限チェック
        if (currentCount >= 4) {
          return // 追加しない
        }
        
        // 50枚制限チェック
        const totalCards = Object.values(currentDeck.cards).reduce((sum, count) => sum + count, 0)
        if (totalCards >= 50) {
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
          // 50枚制限チェック（新しい枚数での総数を計算）
          const otherCardsTotal = Object.entries(currentDeck.cards)
            .filter(([id]) => id !== cardId)
            .reduce((sum, [, cardCount]) => sum + cardCount, 0)
          const newTotalCards = otherCardsTotal + count
          
          if (newTotalCards <= 50) {
            newCards[cardId] = count
          }
          // 50枚を超える場合は変更しない（現在の値を保持）
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
      },

      // v2.0: 統合デッキ保存（メイン + レイキ一体管理）
      saveIntegratedDeck: (reikiCards: ReikiCard[]) => {
        const { currentDeck, savedDecks } = get()
        const now = new Date().toISOString()
        
        // 同じ名前のデッキが既に存在するかチェック
        const existingDeckIndex = savedDecks.findIndex(deck => deck.name === currentDeck.name)
        
        let deckId: string
        let updatedDecks: Deck[]
        
        if (existingDeckIndex !== -1) {
          // 既存のデッキを上書き
          deckId = savedDecks[existingDeckIndex].deckId
          const updatedDeck: Deck = {
            ...savedDecks[existingDeckIndex],
            name: currentDeck.name,
            mainCards: { ...currentDeck.cards },
            reikiCards: [...reikiCards],
            updatedAt: now,
            version: "2.0"
          }
          
          updatedDecks = [...savedDecks]
          updatedDecks[existingDeckIndex] = updatedDeck
        } else {
          // 新規デッキとして作成
          deckId = `integrated_deck_${Date.now()}`
          const newDeck: Deck = {
            deckId,
            name: currentDeck.name,
            mainCards: { ...currentDeck.cards },
            reikiCards: [...reikiCards],
            createdAt: now,
            updatedAt: now,
            version: "2.0"
          }
          
          updatedDecks = [...savedDecks, newDeck]
        }
        
        set({ savedDecks: updatedDecks })
        
        return deckId
      },
      
      // v2.0: 統合デッキ読み込み
      loadIntegratedDeck: (deckId: string) => {
        const { savedDecks } = get()
        const deck = savedDecks.find(d => d.deckId === deckId)
        
        if (deck && deck.version === "2.0") {
          set({
            currentDeck: {
              name: deck.name,
              cards: { ...deck.mainCards },
              lastModified: new Date().toISOString()
            }
          })
          
          return { 
            success: true, 
            reikiCards: deck.reikiCards 
          }
        }
        
        return { success: false }
      },
      
      // v2.0: 統合デッキ削除
      deleteIntegratedDeck: (deckId: string) => {
        const { savedDecks } = get()
        set({
          savedDecks: savedDecks.filter(deck => deck.deckId !== deckId)
        })
      },
      
      // v2.0: 統合デッキ一覧取得
      getIntegratedDecks: () => {
        const { savedDecks } = get()
        return savedDecks.filter(deck => deck.version === "2.0")
      },
      
      // v1.0 → v2.0 移行機能
      migrateLegacyDecks: () => {
        const { legacySavedDecks, savedDecks } = get()
        let migrated = 0
        const errors: string[] = []
        
        if (!legacySavedDecks || legacySavedDecks.length === 0) {
          return { migrated: 0, errors: [] }
        }
        
        const newDecks: Deck[] = [...savedDecks]
        
        legacySavedDecks.forEach((legacyDeck: any) => {
          try {
            // v1.0 → v2.0 形式変換
            const migratedDeck: Deck = {
              deckId: `migrated_${legacyDeck.deckId || Date.now()}`,
              name: legacyDeck.name || 'Migrated Deck',
              mainCards: legacyDeck.cards || {}, // v1.0のcardsをmainCardsに
              reikiCards: [ // デフォルトレイキデッキ（空）
                { color: 'red', count: 0 },
                { color: 'blue', count: 0 },
                { color: 'green', count: 0 },
                { color: 'yellow', count: 0 }
              ],
              createdAt: legacyDeck.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              version: "2.0"
            }
            
            newDecks.push(migratedDeck)
            migrated++
          } catch (error) {
            errors.push(`デッキ「${legacyDeck.name || 'Unknown'}」の移行中にエラーが発生しました`)
          }
        })
        
        if (migrated > 0) {
          set({ 
            savedDecks: newDecks,
            legacySavedDecks: [] // 移行完了後はクリア
          })
        }
        
        return { migrated, errors }
      },
      
      // v1.0デッキの存在チェック
      hasLegacyDecks: () => {
        const { legacySavedDecks } = get()
        return legacySavedDecks && legacySavedDecks.length > 0
      }
    }),
    {
      name: 'deck-storage', // localStorageのキー名
      partialize: (state) => ({
        savedDecks: state.savedDecks, // v2.0統合デッキ
        legacySavedDecks: state.legacySavedDecks, // v1.0互換
        currentDeck: state.currentDeck
      })
    }
  )
)