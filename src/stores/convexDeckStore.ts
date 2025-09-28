import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Card, CurrentDeck } from '@/types/card'
import type { ReikiCard } from '@/types/reiki'
import type { Id } from '../../convex/_generated/dataModel'

/**
 * Convex統合デッキストア
 * 既存のローカルストレージと段階的に統合
 */
interface ConvexDeckStore {
  // 設定
  useServerStorage: boolean // サーバー保存を使用するか
  
  // 現在のデッキ（変更なし）
  currentDeck: CurrentDeck
  allCards: Card[]
  
  // Convex統合状態
  isConvexEnabled: boolean
  lastSyncAt: number | null
  
  // 基本操作（既存と同じ）
  addCardToDeck: (card: Card) => void
  removeCardFromDeck: (cardId: string) => void
  setCardCount: (cardId: string, count: number) => void
  clearDeck: () => void
  setDeckName: (name: string) => void
  setAllCards: (cards: Card[]) => void
  
  // Convex統合機能
  enableServerStorage: () => void
  disableServerStorage: () => void
  saveToServer: (reikiCards: ReikiCard[]) => Promise<{ success: boolean; deckId?: Id<"decks">; error?: string }>
  loadFromServer: (deckId: Id<"decks">) => Promise<{ success: boolean; error?: string }>
  
  // 同期機能
  syncToServer: (reikiCards: ReikiCard[]) => Promise<{ success: boolean; error?: string }>
  
  // 移行サポート
  migrateCurrentDeckToServer: (reikiCards: ReikiCard[]) => Promise<{ success: boolean; deckId?: Id<"decks">; error?: string }>
}

export const useConvexDeckStore = create<ConvexDeckStore>()(
  persist(
    (set, get) => ({
      // 初期設定
      useServerStorage: false,
      isConvexEnabled: false,
      lastSyncAt: null,
      
      // 現在のデッキ（既存と同じ）
      currentDeck: {
        name: '',
        cards: {},
        lastModified: new Date().toISOString()
      },
      allCards: [],
      
      // 基本操作（既存と同じ）
      addCardToDeck: (card: Card) => {
        set((state) => {
          const currentCount = state.currentDeck.cards[card.cardId] || 0
          if (currentCount >= 4) return state // 4枚制限
          
          return {
            currentDeck: {
              ...state.currentDeck,
              cards: {
                ...state.currentDeck.cards,
                [card.cardId]: currentCount + 1,
              },
            },
          }
        })
      },
      
      removeCardFromDeck: (cardId: string) => {
        set((state) => {
          const newCards = { ...state.currentDeck.cards }
          const currentCount = newCards[cardId] || 0
          
          if (currentCount <= 1) {
            delete newCards[cardId]
          } else {
            newCards[cardId] = currentCount - 1
          }
          
          return {
            currentDeck: {
              ...state.currentDeck,
              cards: newCards,
            },
          }
        })
      },
      
      setCardCount: (cardId: string, count: number) => {
        set((state) => {
          const newCards = { ...state.currentDeck.cards }
          
          if (count <= 0) {
            delete newCards[cardId]
          } else {
            newCards[cardId] = Math.min(count, 4) // 4枚制限
          }
          
          return {
            currentDeck: {
              ...state.currentDeck,
              cards: newCards,
            },
          }
        })
      },
      
      clearDeck: () => {
        set((state) => ({
          currentDeck: {
            ...state.currentDeck,
            cards: {},
          },
        }))
      },
      
      setDeckName: (name: string) => {
        set((state) => ({
          currentDeck: {
            ...state.currentDeck,
            name,
          },
        }))
      },
      
      setAllCards: (cards: Card[]) => {
        set({ allCards: cards })
      },
      
      // Convex統合機能
      enableServerStorage: () => {
        set({ 
          useServerStorage: true,
          isConvexEnabled: true 
        })
      },
      
      disableServerStorage: () => {
        set({ 
          useServerStorage: false 
        })
      },
      
      saveToServer: async (reikiCards: ReikiCard[]) => {
        const state = get()
        
        try {
          // useConvexDecksフックを直接呼べないので、
          // この関数は実際にはコンポーネント側で実装する
          console.log('サーバー保存:', {
            name: state.currentDeck.name,
            mainCards: state.currentDeck.cards,
            reikiCards,
          })
          
          return { success: true }
        } catch (error) {
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          }
        }
      },
      
      loadFromServer: async (deckId: Id<"decks">) => {
        try {
          // 実装はコンポーネント側で行う
          console.log('サーバーから読み込み:', deckId)
          return { success: true }
        } catch (error) {
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          }
        }
      },
      
      syncToServer: async (reikiCards: ReikiCard[]) => {
        const state = get()
        if (!state.useServerStorage) {
          return { success: false, error: 'サーバー保存が無効です' }
        }
        
        return await state.saveToServer(reikiCards)
      },
      
      migrateCurrentDeckToServer: async (reikiCards: ReikiCard[]) => {
        const state = get()
        
        if (!state.currentDeck.name) {
          return { success: false, error: 'デッキ名を入力してください' }
        }
        
        const result = await state.saveToServer(reikiCards)
        
        if (result.success) {
          set({ 
            useServerStorage: true,
            isConvexEnabled: true,
            lastSyncAt: Date.now() 
          })
        }
        
        return result
      },
    }),
    {
      name: 'convex-deck-storage', // localStorage key
      partialize: (state) => ({
        useServerStorage: state.useServerStorage,
        isConvexEnabled: state.isConvexEnabled,
        lastSyncAt: state.lastSyncAt,
        currentDeck: state.currentDeck,
      }),
    }
  )
)