import type { Card, DeckValidationResult } from '@/types/card'

/**
 * デッキバリデーションを実行
 */
export const validateDeck = (
  deckCards: Record<string, number>,
  allCards: Card[]
): DeckValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []
  
  // カード情報のマップを作成
  const cardMap = new Map(allCards.map(card => [card.cardId, card]))
  
  // 総枚数チェック
  const totalCards = Object.values(deckCards).reduce((sum, count) => sum + count, 0)
  if (totalCards < 50) {
    errors.push(`デッキは50枚である必要があります（現在: ${totalCards}枚、あと${50 - totalCards}枚必要）`)
  } else if (totalCards > 50) {
    errors.push(`デッキは50枚である必要があります（現在: ${totalCards}枚、${totalCards - 50}枚多い）`)
  }
  
  // 4枚制限チェック
  Object.entries(deckCards).forEach(([cardId, count]) => {
    if (count > 4) {
      const card = cardMap.get(cardId)
      errors.push(`${card?.name || cardId}は4枚を超えて入れることはできません（現在: ${count}枚）`)
    }
  })
  
  // 存在しないカードのチェック
  Object.keys(deckCards).forEach(cardId => {
    if (!cardMap.has(cardId)) {
      errors.push(`カードID: ${cardId} は存在しません`)
    }
  })
  
  // 色分布計算
  const colorBalance: Record<string, number> = {
    red: 0,
    blue: 0,
    green: 0,
    yellow: 0,
    colorless: 0
  }
  
  Object.entries(deckCards).forEach(([cardId, count]) => {
    const card = cardMap.get(cardId)
    if (card) {
      colorBalance[card.color] = (colorBalance[card.color] || 0) + count
    }
  })
  
  // コストカーブ計算
  const costCurve: Record<number, number> = {}
  Object.entries(deckCards).forEach(([cardId, count]) => {
    const card = cardMap.get(cardId)
    if (card) {
      costCurve[card.cost] = (costCurve[card.cost] || 0) + count
    }
  })
  
  // カード種類分布
  const typeDistribution: Record<string, number> = {
    unit: 0,
    supporter: 0,
    event: 0
  }
  
  Object.entries(deckCards).forEach(([cardId, count]) => {
    const card = cardMap.get(cardId)
    if (card) {
      typeDistribution[card.cardType] = (typeDistribution[card.cardType] || 0) + count
    }
  })
  
  // 警告の生成
  generateWarnings(colorBalance, costCurve, typeDistribution, totalCards, warnings)
  
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
      totalCards: 0,
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

/**
 * デッキの警告を生成
 */
const generateWarnings = (
  colorBalance: Record<string, number>,
  costCurve: Record<number, number>,
  typeDistribution: Record<string, number>,
  totalCards: number,
  warnings: string[]
) => {
  // 色バランスの警告
  const totalNonColorless = Object.entries(colorBalance)
    .filter(([color]) => color !== 'colorless')
    .reduce((sum, [, count]) => sum + count, 0)
  
  if (totalNonColorless > 0) {
    Object.entries(colorBalance).forEach(([color, count]) => {
      if (color !== 'colorless' && count > 0) {
        const percentage = (count / totalNonColorless) * 100
        if (percentage > 85) {
          warnings.push(`${getColorName(color)}色のカードが多すぎる可能性があります（${percentage.toFixed(1)}%）`)
        } else if (percentage < 10 && count > 0) {
          warnings.push(`${getColorName(color)}色のカードが少ない可能性があります（${percentage.toFixed(1)}%）`)
        }
      }
    })
  }
  
  // コストカーブの警告
  if (totalCards === 50) {
    const lowCostCards = (costCurve[0] || 0) + (costCurve[1] || 0) + (costCurve[2] || 0)
    const highCostCards = Object.entries(costCurve)
      .filter(([cost]) => parseInt(cost) >= 6)
      .reduce((sum, [, count]) => sum + count, 0)
    
    if (lowCostCards < 12) {
      warnings.push('低コスト（0-2）のカードが少ない可能性があります（序盤の安定性）')
    }
    
    if (highCostCards > 12) {
      warnings.push('高コスト（6以上）のカードが多すぎる可能性があります（手札事故のリスク）')
    }
  }
  
  // カード種類バランスの警告
  if (totalCards === 50) {
    const unitPercentage = (typeDistribution.unit / totalCards) * 100
    const supporterPercentage = (typeDistribution.supporter / totalCards) * 100
    
    if (unitPercentage < 40) {
      warnings.push('ユニットカードが少ない可能性があります（戦闘力不足）')
    }
    
    if (supporterPercentage < 10) {
      warnings.push('サポーターカードが少ない可能性があります（サポート不足）')
    }
  }
}

/**
 * 色名の日本語変換
 */
const getColorName = (color: string): string => {
  const colorNames: Record<string, string> = {
    red: '赤',
    blue: '青',
    green: '緑',
    yellow: '黄',
    colorless: '無色'
  }
  return colorNames[color] || color
}

/**
 * デッキの統計情報を計算
 */
export const calculateDeckStats = (
  deckCards: Record<string, number>,
  allCards: Card[]
) => {
  const cardMap = new Map(allCards.map(card => [card.cardId, card]))
  
  // 色分布
  const colorDistribution: Record<string, number> = {}
  
  // コストカーブ
  const costCurve: Record<number, number> = {}
  
  // カード種類分布
  const typeDistribution: Record<string, number> = {}
  
  // 平均コスト
  let totalCost = 0
  let totalCards = 0
  
  Object.entries(deckCards).forEach(([cardId, count]) => {
    const card = cardMap.get(cardId)
    if (card) {
      // 色分布
      colorDistribution[card.color] = (colorDistribution[card.color] || 0) + count
      
      // コストカーブ
      costCurve[card.cost] = (costCurve[card.cost] || 0) + count
      
      // カード種類分布
      typeDistribution[card.cardType] = (typeDistribution[card.cardType] || 0) + count
      
      // 平均コスト計算
      totalCost += card.cost * count
      totalCards += count
    }
  })
  
  const averageCost = totalCards > 0 ? totalCost / totalCards : 0
  
  return {
    totalCards,
    colorDistribution,
    costCurve,
    typeDistribution,
    averageCost: Math.round(averageCost * 100) / 100 // 小数点以下2桁
  }
}