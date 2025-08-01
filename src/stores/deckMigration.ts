import type { Deck } from '@/types/card'
import type { ReikiCard } from '@/types/reiki'

/**
 * デッキ形式移行機能
 */
export class DeckMigration {
  /**
   * v1.0からv2.0へのデッキ移行
   */
  static migrateLegacyDecks(
    legacySavedDecks: any[], 
    currentSavedDecks: Deck[]
  ): { migrated: number; errors: string[]; newDecks: Deck[] } {
    let migrated = 0
    const errors: string[] = []
    
    if (!legacySavedDecks || legacySavedDecks.length === 0) {
      return { migrated: 0, errors: [], newDecks: currentSavedDecks }
    }
    
    const newDecks: Deck[] = [...currentSavedDecks]
    
    legacySavedDecks.forEach((legacyDeck: any) => {
      try {
        // v1.0 → v2.0 形式変換
        const migratedDeck: Deck = {
          deckId: `migrated_${legacyDeck.deckId || Date.now()}`,
          name: legacyDeck.name || 'Migrated Deck',
          mainCards: legacyDeck.cards || {}, // v1.0のcardsをmainCardsに
          reikiCards: DeckMigration.createDefaultReikiCards(),
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
    
    return { migrated, errors, newDecks }
  }

  /**
   * デフォルトのレイキカード構成を作成
   */
  static createDefaultReikiCards(): ReikiCard[] {
    return [
      { color: 'red', count: 0 },
      { color: 'blue', count: 0 },
      { color: 'green', count: 0 },
      { color: 'yellow', count: 0 }
    ]
  }

  /**
   * レガシーデッキが存在するかチェック
   */
  static hasLegacyDecks(legacySavedDecks: any[]): boolean {
    return legacySavedDecks && legacySavedDecks.length > 0
  }
}