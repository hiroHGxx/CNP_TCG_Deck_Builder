import type { Card, SupportBPDistribution } from '@/types/card'

/**
 * 助太刀BP統計計算ユーティリティ
 */

/**
 * デッキの助太刀BP分布を計算
 */
export const calculateSupportBPDistribution = (
  deckCards: Record<string, number>, 
  allCards: Card[]
): SupportBPDistribution => {
  // カード情報のマップを作成
  const cardMap = new Map(allCards.map(card => [card.cardId, card]))
  
  // 助太刀BP分布の初期化
  const distribution: SupportBPDistribution = {
    bp1000: 0,
    bp2000: 0,
    bp3000: 0,
    bp4000: 0,
    bp5000: 0,
    total: 0,
    average: 0
  }
  
  let totalBP = 0
  let totalSupportCards = 0
  
  // 各カードの助太刀BPを集計
  Object.entries(deckCards).forEach(([cardId, count]) => {
    const card = cardMap.get(cardId)
    
    // デバッグ: 全カードの詳細状態をチェック
    console.log(`Processing card ${cardId}:`, {
      found: !!card,
      name: card?.name,
      cardType: card?.cardType,
      supportBP: card?.supportBP,
      supportBPType: typeof card?.supportBP
    })
    
    if (card && card.supportBP !== null && card.supportBP !== undefined) {
      // undefinedエラーが発生しているカードをログに記録しない（コンソールスパム回避）
      if (typeof card.supportBP === 'number') {
        const supportBP = card.supportBP
        console.log(`✅ Card ${cardId} (${card.name}) has supportBP: ${supportBP}`)
        
        // BP値別の枚数を集計
        switch (supportBP) {
          case 1000:
            distribution.bp1000 += count
            break
          case 2000:
            distribution.bp2000 += count
            break
          case 3000:
            distribution.bp3000 += count
            break
          case 4000:
            distribution.bp4000 += count
            break
          case 5000:
            distribution.bp5000 += count
            break
          default:
            console.warn(`Unexpected supportBP value: ${supportBP} for card ${cardId}`)
        }
        
        totalBP += supportBP * count
        totalSupportCards += count
      }
    }
  })
  
  // 総数と平均を計算
  distribution.total = totalSupportCards
  distribution.average = totalSupportCards > 0 ? Math.round(totalBP / totalSupportCards) : 0
  
  return distribution
}

/**
 * 助太刀BP分布の詳細分析
 */
export const analyzeSupportBPDistribution = (distribution: SupportBPDistribution) => {
  const analysis = {
    // 基本統計
    hasSupport: distribution.total > 0,
    dominantBP: getDominantBP(distribution),
    diversity: calculateBPDiversity(distribution),
    
    // 戦略分析
    lowBPRatio: distribution.total > 0 ? (distribution.bp1000 + distribution.bp2000) / distribution.total : 0,
    highBPRatio: distribution.total > 0 ? (distribution.bp4000 + distribution.bp5000) / distribution.total : 0,
    
    // 推奨事項
    recommendations: generateBPRecommendations(distribution)
  }
  
  return analysis
}

/**
 * 最も多いBP値を取得
 */
const getDominantBP = (distribution: SupportBPDistribution): number | null => {
  const bpCounts = [
    { bp: 1000, count: distribution.bp1000 },
    { bp: 2000, count: distribution.bp2000 },
    { bp: 3000, count: distribution.bp3000 },
    { bp: 4000, count: distribution.bp4000 },
    { bp: 5000, count: distribution.bp5000 }
  ]
  
  const maxCount = Math.max(...bpCounts.map(item => item.count))
  if (maxCount === 0) return null
  
  const dominant = bpCounts.find(item => item.count === maxCount)
  return dominant ? dominant.bp : null
}

/**
 * BP分布の多様性を計算（0-1の値）
 */
const calculateBPDiversity = (distribution: SupportBPDistribution): number => {
  if (distribution.total === 0) return 0
  
  const bpCounts = [
    distribution.bp1000,
    distribution.bp2000,
    distribution.bp3000,
    distribution.bp4000,
    distribution.bp5000
  ]
  
  // 非ゼロの種類数を計算（現在未使用）
  // const nonZeroTypes = bpCounts.filter(count => count > 0).length
  
  // シャノン多様性指数の簡易版
  let diversity = 0
  bpCounts.forEach(count => {
    if (count > 0) {
      const ratio = count / distribution.total
      diversity -= ratio * Math.log2(ratio)
    }
  })
  
  // 0-1の範囲に正規化
  const maxDiversity = Math.log2(5) // 5種類のBP値がある場合の最大多様性
  return maxDiversity > 0 ? diversity / maxDiversity : 0
}

/**
 * BP分布に基づく推奨事項を生成
 */
const generateBPRecommendations = (distribution: SupportBPDistribution): string[] => {
  const recommendations: string[] = []
  
  if (distribution.total === 0) {
    recommendations.push('助太刀可能なユニットカードがありません')
    return recommendations
  }
  
  // 実用的な推奨事項を生成
  if (distribution.total < 8) {
    recommendations.push('助太刀カードを増やして戦闘サポートを強化しましょう')
  } else if (distribution.total > 25) {
    recommendations.push('助太刀カードが多すぎる可能性があります')
  }
  
  // BP構成バランスの推奨
  if (distribution.bp1000 > 0 && distribution.bp2000 > 0) {
    recommendations.push('1000BPと2000BPのバランスが取れています')
  } else if (distribution.bp1000 > 0 && distribution.bp2000 === 0) {
    recommendations.push('2000BP助太刀の追加で攻撃力を強化できます')
  } else if (distribution.bp2000 > 0 && distribution.bp1000 === 0) {
    recommendations.push('安定した1000BP助太刀の追加を検討してください')
  }
  
  // デッキ内助太刀比率の分析
  const supportRatio = Math.round((distribution.total / 50) * 100) // 50枚デッキでの比率
  if (supportRatio >= 20) {
    recommendations.push(`助太刀比率: ${supportRatio}% - 高い戦闘サポート力`)
  } else if (supportRatio >= 10) {
    recommendations.push(`助太刀比率: ${supportRatio}% - 適度な戦闘サポート`)
  } else {
    recommendations.push(`助太刀比率: ${supportRatio}% - 戦闘サポートが不足気味`)
  }
  
  return recommendations
}

/**
 * 助太刀BP分布の表示用フォーマット
 */
export const formatSupportBPDistribution = (distribution: SupportBPDistribution) => {
  const entries = [
    { label: 'BP:1000', count: distribution.bp1000, bp: 1000 },
    { label: 'BP:2000', count: distribution.bp2000, bp: 2000 },
    { label: 'BP:3000', count: distribution.bp3000, bp: 3000 },
    { label: 'BP:4000', count: distribution.bp4000, bp: 4000 },
    { label: 'BP:5000', count: distribution.bp5000, bp: 5000 }
  ].filter(entry => entry.count > 0) // 0枚のものは除外
  
  return {
    entries,
    summary: {
      total: distribution.total,
      average: distribution.average,
      hasSupport: distribution.total > 0
    }
  }
}