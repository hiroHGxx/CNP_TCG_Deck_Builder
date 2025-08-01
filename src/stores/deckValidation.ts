import type { Card, DeckValidationResult } from '@/types/card'

/**
 * デッキバリデーションロジック
 */
export const validateDeckLogic = (cards: Record<string, number>, allCards: Card[]): DeckValidationResult => {
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
    mainDeck: {
      totalCards,
      isValidCount: totalCards === 50,
      cardLimitViolations: errors.filter(e => e.includes('4枚')),
      colorBalance,
      costCurve
    },
    reikiDeck: {
      totalCards: 0, // Not managed in legacy validation
      isValidCount: true,
      colorBalance: {
        red: 0,
        blue: 0,
        green: 0,
        yellow: 0
      }
    },
    overall: {
      colorAlignment: false,
      suggestions: warnings
    }
  }
}