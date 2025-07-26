import React from 'react'
import type { Card } from '@/types/card'

interface CardTooltipProps {
  card: Card
  visible: boolean
  position: { x: number; y: number }
  placement?: 'top' | 'bottom' | 'auto'
}

const CardTooltip: React.FC<CardTooltipProps> = ({ card, visible, position, placement = 'auto' }) => {
  if (!visible) return null

  const getColorDot = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red-500'
      case 'blue': return 'bg-blue-500'
      case 'green': return 'bg-green-500'
      case 'yellow': return 'bg-yellow-500'
      case 'colorless': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  const parseCostDisplay = () => {
    const colorBalance = card.colorBalance || ''
    const colorCostMatch = colorBalance.match(/(\d+)/)
    const colorCost = colorCostMatch ? parseInt(colorCostMatch[1]) : 0
    const colorlessCost = Math.max(0, card.cost - colorCost)
    
    return { colorCost, colorlessCost, totalCost: card.cost }
  }

  // 動的位置調整の計算
  const calculatePosition = () => {
    const tooltipWidth = 320
    const margin = 10
    
    let finalPlacement = placement
    
    // 自動配置の場合、画面位置に基づいて決定
    if (placement === 'auto') {
      const screenHeight = window.innerHeight
      const isUpperHalf = position.y < screenHeight / 2
      finalPlacement = isUpperHalf ? 'bottom' : 'top'
    }
    
    // 左右位置の調整
    let left = position.x - tooltipWidth / 2 // 中央配置
    if (left < margin) {
      left = margin // 左端調整
    } else if (left + tooltipWidth + margin > window.innerWidth) {
      left = window.innerWidth - tooltipWidth - margin // 右端調整
    }
    
    // 上下位置の調整
    let top: number
    let transform: string
    
    if (finalPlacement === 'bottom') {
      // カードの下に表示
      top = position.y + margin
      transform = 'translateY(0)'
    } else {
      // カードの上に表示
      top = position.y - margin
      transform = 'translateY(-100%)'
    }
    
    return {
      left,
      top,
      transform,
      placement: finalPlacement
    }
  }

  const { left, top, transform, placement: finalPlacement } = calculatePosition()

  return (
    <div 
      className={`fixed z-50 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4 w-80 pointer-events-none ${
        finalPlacement === 'bottom' ? 'animate-slide-in-down' : 'animate-slide-in-up'
      }`}
      style={{
        left: `${left}px`,
        top: `${top}px`,
        transform,
      }}
    >
      {/* カード名 */}
      <div className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-200 pb-2">
        {card.name}
      </div>

      {/* コスト情報 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-1">
          <span className="text-sm font-semibold text-gray-700">コスト:</span>
          <div className="flex items-center space-x-0.5">
            {(() => {
              const { colorCost, colorlessCost, totalCost } = parseCostDisplay()
              return (
                <>
                  {/* 色コスト */}
                  {Array.from({ length: colorCost }).map((_, index) => (
                    <div
                      key={`color-${index}`}
                      className={`w-3 h-3 rounded-full ${getColorDot(card.color)}`}
                    />
                  ))}
                  {/* 無色コスト */}
                  {Array.from({ length: colorlessCost }).map((_, index) => (
                    <div
                      key={`colorless-${index}`}
                      className="w-3 h-3 rounded-full bg-gray-400"
                    />
                  ))}
                  <span className="text-sm font-semibold text-gray-600 ml-1">
                    ({totalCost})
                  </span>
                </>
              )
            })()}
          </div>
        </div>

        {/* BP（ユニットの場合） */}
        {card.bp !== null && (
          <div className="text-sm">
            <span className="font-semibold text-gray-700">BP:</span>
            <span className="font-bold text-blue-600 ml-1">{card.bp}</span>
          </div>
        )}
      </div>

      {/* カードタイプとレアリティ */}
      <div className="flex items-center justify-between mb-3 text-sm">
        <span className="capitalize font-medium text-gray-600">
          {card.cardType}
        </span>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          card.rarity === 'common' ? 'bg-gray-100 text-gray-800' :
          card.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
          card.rarity === 'rare_rare' ? 'bg-purple-100 text-purple-800' :
          card.rarity === 'triple_rare' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {card.rarity.toUpperCase()}
        </span>
      </div>

      {/* 種族情報 */}
      {card.role.length > 0 && (
        <div className="mb-3">
          <div className="text-sm font-semibold text-gray-700 mb-1">種族:</div>
          <div className="flex flex-wrap gap-1">
            {card.role.map((role, index) => (
              <span 
                key={index}
                className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-md"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* カード効果 */}
      {card.effect && (
        <div className="mb-3">
          <div className="text-sm font-semibold text-gray-700 mb-1">効果:</div>
          <div className="text-sm text-gray-800 leading-relaxed bg-gray-50 p-2 rounded border-l-4 border-blue-400">
            {card.effect}
          </div>
        </div>
      )}

      {/* フレーバーテキスト */}
      {card.flavorText && (
        <div>
          <div className="text-sm font-semibold text-gray-700 mb-1">フレーバー:</div>
          <div className="text-sm text-gray-600 italic leading-relaxed">
            "{card.flavorText}"
          </div>
        </div>
      )}

      {/* イラストレーター */}
      {card.illustrator && (
        <div className="mt-3 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            イラスト: {card.illustrator}
          </div>
        </div>
      )}
    </div>
  )
}

export default CardTooltip