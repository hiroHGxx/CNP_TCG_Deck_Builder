import React from 'react'
import type { Card } from '@/types/card'

interface CardTooltipProps {
  card: Card
  visible: boolean
  position: { x: number; y: number }
}

const CardTooltip: React.FC<CardTooltipProps> = ({ card, visible, position }) => {
  if (!visible) return null

  // Excel風配置ロジック: カードを隠さない位置を計算
  const calculateOptimalPosition = () => {
    const tooltipWidth = 280
    const tooltipHeight = 100 // 簡素化により大幅縮小
    const margin = 8
    const cardWidth = 140 // カードの概算幅
    const cardHeight = 190 // カードの概算高さ
    
    // カードの境界を計算（positionはカード中央）
    const cardLeft = position.x - cardWidth / 2
    const cardRight = position.x + cardWidth / 2
    const cardTop = position.y - cardHeight / 2
    const cardBottom = position.y + cardHeight / 2
    
    // 配置候補: 右上 → 右下 → 左上 → 左下
    const candidates = [
      {
        // 右上
        left: cardRight + margin,
        top: cardTop,
        transform: 'translateY(0)',
        placement: 'right-top'
      },
      {
        // 右下  
        left: cardRight + margin,
        top: cardBottom - tooltipHeight,
        transform: 'translateY(0)',
        placement: 'right-bottom'
      },
      {
        // 左上
        left: cardLeft - tooltipWidth - margin,
        top: cardTop,
        transform: 'translateY(0)',
        placement: 'left-top'
      },
      {
        // 左下
        left: cardLeft - tooltipWidth - margin,
        top: cardBottom - tooltipHeight,
        transform: 'translateY(0)',
        placement: 'left-bottom'
      }
    ]
    
    // 画面内に収まる最初の候補を選択
    for (const candidate of candidates) {
      const withinBounds = 
        candidate.left >= margin &&
        candidate.left + tooltipWidth <= window.innerWidth - margin &&
        candidate.top >= margin &&
        candidate.top + tooltipHeight <= window.innerHeight - margin
        
      if (withinBounds) {
        return candidate
      }
    }
    
    // すべて画面外の場合は右上を強制選択し、画面内に調整
    return {
      left: Math.min(Math.max(cardRight + margin, margin), window.innerWidth - tooltipWidth - margin),
      top: Math.min(Math.max(cardTop, margin), window.innerHeight - tooltipHeight - margin),
      transform: 'translateY(0)',
      placement: 'right-top-adjusted'
    }
  }

  const { left, top, transform } = calculateOptimalPosition()

  return (
    <div 
      className="fixed z-50 bg-white border border-gray-400 rounded-md shadow-lg p-3 max-w-xs pointer-events-none animate-fade-in"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        transform,
        width: '280px'
      }}
    >
      {/* カード効果のみ表示 */}
      {card.effect ? (
        <div className="text-sm text-gray-800 leading-relaxed">
          {card.effect}
        </div>
      ) : (
        <div className="text-sm text-gray-500 italic">
          効果テキストがありません
        </div>
      )}
    </div>
  )
}

export default CardTooltip