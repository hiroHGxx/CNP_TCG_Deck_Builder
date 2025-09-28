import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

/**
 * Convexデッキ管理フック
 * 既存のローカルストレージ機能を段階的にサーバーサイドに移行
 */
export const useConvexDecks = () => {
  // デッキ一覧取得
  const decks = useQuery(api.decks.getUserDecks, {})
  
  // デッキ保存
  const saveDeckMutation = useMutation(api.decks.saveDeck)
  
  // デッキ削除
  const deleteDeckMutation = useMutation(api.decks.deleteDeck)
  
  // 公開デッキ取得
  const publicDecks = useQuery(api.decks.getPublicDecks, { limit: 10 })

  /**
   * デッキ保存（新規・更新両対応）
   */
  const saveDeck = async (deckData: {
    deckId?: Id<"decks">
    name: string
    description?: string
    mainCards: Record<string, number>
    reikiCards: Array<{ color: string; count: number }>
    tags?: string[]
    isPublic?: boolean
  }) => {
    try {
      const result = await saveDeckMutation(deckData)
      return { success: true, deckId: result }
    } catch (error) {
      console.error('デッキ保存エラー:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * デッキ削除
   */
  const deleteDeck = async (deckId: Id<"decks">) => {
    try {
      await deleteDeckMutation({ deckId })
      return { success: true }
    } catch (error) {
      console.error('デッキ削除エラー:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * 現在のローカルストレージデッキをConvexに移行
   */
  const migrateLocalDecks = async () => {
    try {
      const localDecks = localStorage.getItem('cnp-decks')
      if (!localDecks) return { success: true, message: '移行するデッキがありません' }

      const decksData = JSON.parse(localDecks)
      let migratedCount = 0

      for (const [deckName, deckData] of Object.entries(decksData)) {
        if (typeof deckData === 'object' && deckData !== null) {
          const deck = deckData as any
          
          // ローカルデータをConvex形式に変換
          const convexDeckData = {
            name: deckName,
            description: `ローカルストレージから移行: ${new Date().toLocaleDateString()}`,
            mainCards: deck.cards || {},
            reikiCards: deck.reikiCards || [],
            tags: ['移行済み'],
            isPublic: false
          }

          const result = await saveDeck(convexDeckData)
          if (result.success) {
            migratedCount++
          }
        }
      }

      return { 
        success: true, 
        message: `${migratedCount}個のデッキを移行しました`,
        migratedCount 
      }
    } catch (error) {
      console.error('デッキ移行エラー:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  return {
    // データ
    decks,
    publicDecks,
    isLoading: decks === undefined,
    
    // 操作
    saveDeck,
    deleteDeck,
    migrateLocalDecks,
  }
}

/**
 * 個別デッキ詳細取得フック
 */
export const useConvexDeck = (deckId: Id<"decks"> | undefined) => {
  const deck = useQuery(api.decks.getDeck, deckId ? { deckId } : "skip")
  
  return {
    deck,
    isLoading: deck === undefined && deckId !== undefined,
  }
}