import React, { useState } from 'react'
import type { Card } from '@/types/card'

interface CardThumbnailProps {
  card: Card
  onAdd?: (cardId: string) => void
  onClick?: (card: Card) => void
  showCount?: number
}

const CardThumbnail: React.FC<CardThumbnailProps> = ({ 
  card, 
  onAdd, 
  onClick, 
  showCount 
}) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const handleClick = () => {
    if (onClick) {
      onClick(card)
    } else if (onAdd) {
      onAdd(card.cardId)
    }
  }

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoading(false)
  }

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

  return (
    <div 
      className="card-thumbnail relative group"
      onClick={handleClick}
    >
      {/* カード画像 */}
      <div className="relative aspect-[3/4] bg-gray-100 rounded-t-lg overflow-hidden">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        )}
        
        {!imageError && card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500">
            <div className="text-center p-2">
              <div className="text-xs font-semibold mb-1">No Image</div>
              <div className="text-xs opacity-75">{card.cardId}</div>
            </div>
          </div>
        )}

        {/* 枚数表示 */}
        {showCount && showCount > 0 && (
          <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {showCount}
          </div>
        )}

        {/* ホバー効果 */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200" />
      </div>

      {/* カード情報 */}
      <div className="p-2 space-y-1">
        {/* 名前とコスト */}
        <div className="flex items-start justify-between">
          <h3 className="text-sm font-semibold text-gray-900 leading-tight flex-1 pr-1">
            {card.name}
          </h3>
          <div className="flex items-center space-x-1 flex-shrink-0">
            <div className={`w-2 h-2 rounded-full ${getColorDot(card.color)}`} />
            <span className="text-sm font-bold text-gray-700">{card.cost}</span>
          </div>
        </div>

        {/* BP（ユニットのみ） */}
        {card.bp !== null && (
          <div className="text-xs text-gray-600">
            BP: <span className="font-semibold">{card.bp}</span>
          </div>
        )}

        {/* レアリティとタイプ */}
        <div className="flex items-center justify-between">
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRarityColor(card.rarity)}`}>
            {card.rarity.toUpperCase()}
          </span>
          <span className="text-xs text-gray-500 capitalize">
            {card.cardType}
          </span>
        </div>
      </div>
    </div>
  )
}

export default CardThumbnail