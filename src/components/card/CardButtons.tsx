import React from 'react'
import { Plus, Minus } from 'lucide-react'
import type { Card } from '@/types/card'

interface CardButtonsProps {
  card: Card
  cardCountInDeck: number
  canAddMore: boolean
  isInDeck: boolean
  onAdd?: (cardId: string) => void
  onRemove?: (cardId: string) => void
  addCardToDeck: (card: Card) => void
  removeCardFromDeck: (cardId: string) => void
  totalCards: number
}

/**
 * カードの+/-ボタンコンポーネント
 */
export const CardButtons: React.FC<CardButtonsProps> = ({
  card,
  cardCountInDeck,
  canAddMore,
  isInDeck,
  onAdd,
  onRemove,
  addCardToDeck,
  removeCardFromDeck,
  totalCards
}) => {
  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onAdd) {
      onAdd(card.cardId)
    } else {
      addCardToDeck(card)
    }
  }

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onRemove) {
      onRemove(card.cardId)
    } else {
      removeCardFromDeck(card.cardId)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const getAddButtonTitle = () => {
    if (cardCountInDeck >= 4) {
      return `${card.name}は4枚制限に達しています`
    }
    if (totalCards >= 50) {
      return `デッキは50枚制限に達しています`
    }
    return `${card.name}をデッキに追加`
  }

  return (
    <>
      {/* +ボタン（4枚未満の場合のみ表示） */}
      {canAddMore && (
        <div className="absolute bottom-1 right-1">
          <button
            onClick={handleAddClick}
            onMouseDown={handleMouseDown}
            className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg transform hover:scale-110 transition-all duration-200"
            title={getAddButtonTitle()}
            style={{ zIndex: 1000, cursor: 'pointer' }}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      )}
      
      {/* -ボタン（デッキ内カードのみ表示） */}
      {isInDeck && (
        <div className="absolute bottom-1 left-1">
          <button
            onClick={handleRemoveClick}
            onMouseDown={handleMouseDown}
            className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transform hover:scale-110 transition-all duration-200"
            title={`${card.name}をデッキから削除`}
            style={{ zIndex: 1000, cursor: 'pointer' }}
          >
            <Minus className="h-5 w-5" />
          </button>
        </div>
      )}
    </>
  )
}

export default CardButtons