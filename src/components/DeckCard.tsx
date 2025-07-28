import React from 'react'
import { Plus, Minus, X } from 'lucide-react'
import type { Card } from '@/types/card'

interface DeckCardProps {
  card: Card
  count: number
  onAdd: (card: Card) => void
  onRemove: (cardId: string) => void
  onSetCount: (cardId: string, count: number) => void
  maxCount?: number
}

const DeckCard: React.FC<DeckCardProps> = ({
  card,
  count,
  onAdd,
  onRemove,
  onSetCount,
  maxCount = 4
}) => {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800'
      case 'rare': return 'bg-blue-100 text-blue-800'
      case 'rare_rare': return 'bg-purple-100 text-purple-800'
      case 'triple_rare': return 'bg-yellow-100 text-yellow-800'
      case 'super_rare': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

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

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCount = parseInt(e.target.value) || 0
    if (newCount >= 0 && newCount <= maxCount) {
      onSetCount(card.cardId, newCount)
    }
  }

  const handleRemoveAll = () => {
    onSetCount(card.cardId, 0)
  }

  return (
    <div className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      {/* カード画像（小） */}
      <div className="flex-shrink-0">
        <div className="w-12 h-16 bg-gray-100 rounded overflow-hidden">
          {card.imageUrl ? (
            <img
              src={card.imageUrl}
              alt={card.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
              No Image
            </div>
          )}
        </div>
      </div>

      {/* カード情報 */}
      <div className="flex-grow min-w-0">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-grow">
            <h4 className="text-sm font-semibold text-gray-900 truncate">
              {card.name}
            </h4>
            
            <div className="flex items-center space-x-2 mt-1">
              {/* コスト */}
              <div className="flex items-center space-x-1">
                <div className={`w-3 h-3 rounded-full ${getColorDot(card.color)}`} />
                <span className="text-xs font-medium text-gray-600">
                  {card.cost}
                </span>
              </div>
              
              {/* BP */}
              {card.bp !== null && (
                <span className="text-xs text-gray-500">
                  BP: {card.bp}
                </span>
              )}
              
              {/* レアリティ */}
              <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${getRarityColor(card.rarity)}`}>
                {card.rarity.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 数量コントロール */}
      <div className="flex items-center space-x-2">
        {/* 減らすボタン */}
        <button
          onClick={() => onRemove(card.cardId)}
          disabled={count <= 0}
          className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="w-3 h-3 text-gray-600" />
        </button>

        {/* 数量入力 */}
        <input
          type="number"
          min="0"
          max={maxCount}
          value={count}
          onChange={handleCountChange}
          className="w-12 text-center text-sm border border-gray-300 rounded px-1 py-1 focus:ring-blue-500 focus:border-blue-500"
        />

        {/* 増やすボタン */}
        <button
          onClick={() => onAdd(card)}
          disabled={count >= maxCount}
          className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-3 h-3 text-gray-600" />
        </button>

        {/* 削除ボタン */}
        <button
          onClick={handleRemoveAll}
          className="w-6 h-6 flex items-center justify-center rounded bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
          title="デッキから完全削除"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

export default DeckCard