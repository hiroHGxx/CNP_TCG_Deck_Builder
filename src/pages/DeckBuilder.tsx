import React from 'react'
import { useCardDB } from '@/hooks/useCardDB'
import CardGrid from '@/components/CardGrid'
import type { Card } from '@/types/card'

const DeckBuilder: React.FC = () => {
  const { cards, loading, error, totalCount } = useCardDB()

  const handleCardAdd = (cardId: string) => {
    console.log('Adding card to deck:', cardId)
    // TODO: デッキに追加する処理
  }

  const handleCardClick = (card: Card) => {
    console.log('Card clicked:', card.name)
    // TODO: カード詳細モーダルを開く処理
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Deck Builder</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Cards</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Deck Builder</h1>
        <div className="text-sm text-gray-500">
          {totalCount} cards available
        </div>
      </div>

      {/* カードグリッド */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <CardGrid
          cards={cards}
          onCardAdd={handleCardAdd}
          onCardClick={handleCardClick}
          loading={loading}
        />
      </div>
    </div>
  )
}

export default DeckBuilder