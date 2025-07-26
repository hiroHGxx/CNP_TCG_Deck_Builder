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
    const tooltipHeight = 100
    const margin = 8
    const cardWidth = 140
    const cardHeight = 190
    
    // position座標系を修正: ページ座標 → ビューポート座標変換
    const viewportX = position.x
    const viewportY = position.y - window.scrollY // ビューポート座標に変換
    
    // カードの境界を計算（ビューポート座標）
    const cardLeft = viewportX - cardWidth / 2
    const cardRight = viewportX + cardWidth / 2
    const cardTop = viewportY - cardHeight / 2
    
    // 配置候補: 右上 → 右下 → 左上 → 左下
    const candidates = [
      {
        // 右上
        left: cardRight + margin,
        top: position.y - cardHeight / 2, // ページ座標で返す
        transform: 'translateY(0)',
        placement: 'right-top'
      },
      {
        // 右下  
        left: cardRight + margin,
        top: position.y + cardHeight / 2 - tooltipHeight, // ページ座標で返す
        transform: 'translateY(0)',
        placement: 'right-bottom'
      },
      {
        // 左上
        left: cardLeft - tooltipWidth - margin,
        top: position.y - cardHeight / 2, // ページ座標で返す
        transform: 'translateY(0)',
        placement: 'left-top'
      },
      {
        // 左下
        left: cardLeft - tooltipWidth - margin,
        top: position.y + cardHeight / 2 - tooltipHeight, // ページ座標で返す
        transform: 'translateY(0)',
        placement: 'left-bottom'
      }
    ]
    
    // 画面内判定（ビューポート座標で判定）
    for (const candidate of candidates) {
      const candidateViewportY = candidate.top - window.scrollY
      
      const withinBounds = 
        candidate.left >= margin &&
        candidate.left + tooltipWidth <= window.innerWidth - margin &&
        candidateViewportY >= margin &&
        candidateViewportY + tooltipHeight <= window.innerHeight - margin
        
      if (withinBounds) {
        return candidate
      }
    }
    
    // すべて画面外の場合は右上を強制選択し、ビューポート内に調整
    const fallbackViewportTop = Math.min(Math.max(cardTop, margin), window.innerHeight - tooltipHeight - margin)
    return {
      left: Math.min(Math.max(cardRight + margin, margin), window.innerWidth - tooltipWidth - margin),
      top: fallbackViewportTop + window.scrollY, // ページ座標に戻す
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