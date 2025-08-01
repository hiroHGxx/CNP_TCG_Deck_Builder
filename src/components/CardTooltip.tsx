import React from 'react'
import type { Card } from '@/types/card'

interface CardTooltipProps {
  card: Card
  visible: boolean
  position: { x: number; y: number }
  id?: string
}

const CardTooltip: React.FC<CardTooltipProps> = ({ card, visible, position, id }) => {
  if (!visible) return null
  

  // Excel風配置ロジック: カードを隠さない位置を計算
  const calculateOptimalPosition = () => {
    const tooltipWidth = 280
    const tooltipHeight = 100
    const margin = 8
    const cardWidth = 140
    const cardHeight = 190
    
    // positionはCardThumbnailから渡される
    // position.x: viewport座標, position.y: ページ座標(scrollY含む)
    const cardCenterX = position.x
    const cardCenterPageY = position.y
    
    // カードの境界を計算（ビューポート座標に統一）
    const cardCenterViewportY = cardCenterPageY - window.scrollY
    const cardLeft = cardCenterX - cardWidth / 2
    const cardRight = cardCenterX + cardWidth / 2
    const cardTop = cardCenterViewportY - cardHeight / 2
    const cardBottom = cardCenterViewportY + cardHeight / 2
    
    // 配置候補: 右上 → 右下 → 左上 → 左下（全てビューポート座標）
    const candidates = [
      {
        // 右上
        left: cardRight + margin,
        top: cardTop,
        placement: 'right-top'
      },
      {
        // 右下  
        left: cardRight + margin,
        top: cardBottom - tooltipHeight,
        placement: 'right-bottom'
      },
      {
        // 左上
        left: cardLeft - tooltipWidth - margin,
        top: cardTop,
        placement: 'left-top'
      },
      {
        // 左下
        left: cardLeft - tooltipWidth - margin,
        top: cardBottom - tooltipHeight,
        placement: 'left-bottom'
      }
    ]
    
    // 画面内判定（ビューポート座標で判定）
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
    
    // すべて画面外の場合は右側にビューポート内調整
    const fallbackTop = Math.min(
      Math.max(margin, cardTop), 
      window.innerHeight - tooltipHeight - margin
    )
    const fallbackLeft = Math.min(
      Math.max(cardRight + margin, margin), 
      window.innerWidth - tooltipWidth - margin
    )
    
    return {
      left: fallbackLeft,
      top: fallbackTop,
      placement: 'adjusted'
    }
  }

  const { left, top } = calculateOptimalPosition()

  return (
    <div 
      id={id}
      role="tooltip"
      aria-live="polite"
      className="fixed z-50 border rounded-md shadow-xl p-3 max-w-xs pointer-events-none animate-fade-in"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: '280px',
        backgroundColor: '#1e3a8a', // ダークブルー（blue-800相当）
        borderColor: '#3730a3',     // ボーダー（blue-700相当）
        boxShadow: '0 25px 50px -12px rgba(30, 58, 138, 0.25)' // ブルー系の影
      }}
    >
      {/* カード効果のみ表示 */}
      {card.effect ? (
        <div className="text-sm leading-relaxed" style={{ color: '#f9fafb' }}>
          {card.effect}
        </div>
      ) : (
        <div className="text-sm italic" style={{ color: '#d1d5db' }}>
          効果テキストがありません
        </div>
      )}
    </div>
  )
}

export default CardTooltip