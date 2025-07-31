import type { Card } from '@/types/card'
import type { ReikiCard, ColorDistribution } from '@/types/reiki'

/**
 * 統合デッキ分析ユーティリティ
 * メインデッキ + レイキデッキの総合分析を提供
 */

export interface IntegratedColorAnalysis {
  // メインデッキの色分布
  mainDeck: {
    total: number
    colorDistribution: Record<string, number>
    dominantColors: string[] // 主要色（10%以上）
  }
  
  // レイキデッキの色分布
  reikiDeck: {
    total: number
    colorDistribution: Record<string, number>
    activeColors: string[] // 配置されている色
  }
  
  // 統合分析
  integrated: {
    colorAlignment: ColorAlignment[]
    balanceScore: number // 0-100のスコア
    recommendations: string[]
    riskFactors: string[]
  }
}

export interface ColorAlignment {
  color: string
  mainCount: number
  reikiCount: number
  alignmentRatio: number // メイン/レイキの比率
  isBalanced: boolean
  suggestion: string
}

/**
 * 統合デッキの色均衡分析
 */
export function analyzeIntegratedDeck(
  mainCards: Record<string, number>,
  reikiCards: ReikiCard[],
  allCards: Card[]
): IntegratedColorAnalysis {
  
  // カードIDからカード情報のマップを作成
  const cardMap = new Map(allCards.map(card => [card.cardId, card]))
  
  // メインデッキの色分布計算
  const mainColorDist: Record<string, number> = {}
  let mainTotal = 0
  
  Object.entries(mainCards).forEach(([cardId, count]) => {
    const card = cardMap.get(cardId)
    if (card && card.color !== 'colorless') {
      mainColorDist[card.color] = (mainColorDist[card.color] || 0) + count
      mainTotal += count
    }
  })
  
  // 主要色の特定（10%以上）
  const dominantColors = Object.entries(mainColorDist)
    .filter(([, count]) => (count / mainTotal) >= 0.1)
    .map(([color]) => color)
  
  // レイキデッキの色分布
  const reikiColorDist: Record<string, number> = {}
  let reikiTotal = 0
  
  reikiCards.forEach(reikiCard => {
    if (reikiCard.count > 0) {
      reikiColorDist[reikiCard.color] = reikiCard.count
      reikiTotal += reikiCard.count
    }
  })
  
  const activeColors = Object.keys(reikiColorDist)
  
  // 色ごとの alignment 分析
  const colorAlignment: ColorAlignment[] = []
  const allColors = new Set([...Object.keys(mainColorDist), ...activeColors])
  
  allColors.forEach(color => {
    const mainCount = mainColorDist[color] || 0
    const reikiCount = reikiColorDist[color] || 0
    
    let alignmentRatio = 0
    let isBalanced = false
    let suggestion = ''
    
    if (mainCount > 0 && reikiCount > 0) {
      alignmentRatio = mainCount / reikiCount
      
      // バランス判定（推奨比率: 3:1 〜 5:1）
      if (alignmentRatio >= 3 && alignmentRatio <= 5) {
        isBalanced = true
        suggestion = '良好なバランスです'
      } else if (alignmentRatio < 3) {
        suggestion = `レイキが多すぎる可能性があります（比率: ${alignmentRatio.toFixed(1)}:1）`
      } else {
        suggestion = `レイキが少なすぎる可能性があります（比率: ${alignmentRatio.toFixed(1)}:1）`
      }
    } else if (mainCount > 0 && reikiCount === 0) {
      suggestion = `${getColorName(color)}レイキを追加することを検討してください`
    } else if (mainCount === 0 && reikiCount > 0) {
      suggestion = `メインデッキに${getColorName(color)}カードがないため、レイキが活用できません`
    }
    
    colorAlignment.push({
      color,
      mainCount,
      reikiCount,
      alignmentRatio,
      isBalanced,
      suggestion
    })
  })
  
  // 全体バランススコア計算
  const balanceScore = calculateBalanceScore(colorAlignment, mainTotal, reikiTotal)
  
  // 推奨事項生成
  const recommendations = generateRecommendations(colorAlignment, dominantColors, activeColors)
  
  // リスク要因特定
  const riskFactors = identifyRiskFactors(colorAlignment, mainTotal, reikiTotal)
  
  return {
    mainDeck: {
      total: mainTotal,
      colorDistribution: mainColorDist,
      dominantColors
    },
    reikiDeck: {
      total: reikiTotal,
      colorDistribution: reikiColorDist,
      activeColors
    },
    integrated: {
      colorAlignment,
      balanceScore,
      recommendations,
      riskFactors
    }
  }
}

/**
 * バランススコア計算（0-100）
 */
function calculateBalanceScore(
  alignments: ColorAlignment[], 
  mainTotal: number, 
  reikiTotal: number
): number {
  let score = 0
  
  // 基本構成チェック（30点）
  if (mainTotal >= 45 && mainTotal <= 50) score += 15
  if (reikiTotal >= 10 && reikiTotal <= 15) score += 15
  
  // 色バランスチェック（50点）
  const balancedColors = alignments.filter(a => a.isBalanced).length
  const activeColorCount = alignments.filter(a => a.mainCount > 0 && a.reikiCount > 0).length
  
  if (activeColorCount >= 2) score += 25 // 複数色の連携
  score += Math.min(25, balancedColors * 8) // バランス取れた色ごとに8点
  
  // ペナルティ（20点減点まで）
  const unusedReiki = alignments.filter(a => a.mainCount === 0 && a.reikiCount > 0).length
  const unsupportedMain = alignments.filter(a => a.mainCount > 5 && a.reikiCount === 0).length
  
  score -= Math.min(20, unusedReiki * 8 + unsupportedMain * 5)
  
  return Math.max(0, Math.min(100, score))
}

/**
 * 推奨事項生成
 */
function generateRecommendations(
  alignments: ColorAlignment[],
  dominantColors: string[],
  activeColors: string[]
): string[] {
  const recommendations: string[] = []
  
  // 主要色にレイキサポートがない場合
  dominantColors.forEach(color => {
    const alignment = alignments.find(a => a.color === color)
    if (alignment && alignment.reikiCount === 0) {
      recommendations.push(`主要色${getColorName(color)}にレイキサポートを追加してください`)
    }
  })
  
  // 使用されていないレイキ
  alignments.forEach(alignment => {
    if (alignment.mainCount === 0 && alignment.reikiCount > 0) {
      recommendations.push(`${getColorName(alignment.color)}レイキ（${alignment.reikiCount}枚）が使用されていません`)
    }
  })
  
  // バランス改善提案
  alignments.forEach(alignment => {
    if (alignment.mainCount > 0 && alignment.reikiCount > 0 && !alignment.isBalanced) {
      if (alignment.alignmentRatio < 3) {
        recommendations.push(`${getColorName(alignment.color)}レイキを${Math.ceil(3 - alignment.alignmentRatio)}枚減らすことを検討してください`)
      } else if (alignment.alignmentRatio > 5) {
        recommendations.push(`${getColorName(alignment.color)}レイキを${Math.ceil(alignment.alignmentRatio - 5)}枚追加することを検討してください`)
      }
    }
  })
  
  return recommendations
}

/**
 * リスク要因特定
 */
function identifyRiskFactors(
  alignments: ColorAlignment[],
  mainTotal: number,
  reikiTotal: number
): string[] {
  const risks: string[] = []
  
  // デッキ構成リスク
  if (mainTotal < 50) {
    risks.push(`メインデッキが${50 - mainTotal}枚不足しています`)
  }
  if (reikiTotal < 15) {
    risks.push(`レイキデッキが${15 - reikiTotal}枚不足しています`)
  }
  
  // 色バランスリスク
  const unbalancedCount = alignments.filter(a => a.mainCount > 0 && a.reikiCount > 0 && !a.isBalanced).length
  if (unbalancedCount >= 2) {
    risks.push('複数の色でバランスが取れていません')
  }
  
  // 単色依存リスク
  const mainColors = alignments.filter(a => a.mainCount > 0).length
  if (mainColors === 1) {
    risks.push('単色デッキです。色バランスが偏っている可能性があります')
  }
  
  return risks
}

/**
 * 色名の日本語変換
 */
function getColorName(color: string): string {
  const colorNames: Record<string, string> = {
    red: '赤',
    blue: '青',
    green: '緑', 
    yellow: '黄'
  }
  return colorNames[color] || color
}