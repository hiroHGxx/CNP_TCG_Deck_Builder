import React, { memo } from 'react'
import CardThumbnail from './CardThumbnail'
import type { Card } from '@/types/card'

interface CardGridProps {
  cards: Card[]
  onCardAdd?: (cardId: string) => void
  onCardRemove?: (cardId: string) => void
  loading?: boolean
}

const CardGrid: React.FC<CardGridProps> = memo(({ 
  cards, 
  onCardAdd,
  onCardRemove, 
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 aspect-[3/4] rounded-t-lg"></div>
            <div className="bg-white rounded-b-lg p-2 space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <div className="text-6xl mb-4">🃏</div>
        <h3 className="text-lg font-semibold mb-2">カードが見つかりません</h3>
        <p className="text-sm">検索条件を変更してみてください</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* カード数表示 */}
      <div className="text-sm text-gray-600" aria-live="polite">
        {cards.length}枚のカードが見つかりました
      </div>

      {/* カードグリッド */}
      <div 
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4"
        role="grid" 
        aria-label="カード一覧"
      >
        {cards.map((card) => (
          <CardThumbnail
            key={card.cardId}
            card={card}
            onAdd={onCardAdd}
            onRemove={onCardRemove}
          />
        ))}
      </div>
    </div>
  )
})

export default CardGrid