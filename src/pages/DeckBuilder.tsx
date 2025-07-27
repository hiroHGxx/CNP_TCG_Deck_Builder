import React, { useState } from 'react'
import { useCardDB } from '@/hooks/useCardDB'
import { useSearch } from '@/hooks/useSearch'
import CardGrid from '@/components/CardGrid'
import SearchBar from '@/components/SearchBar'
import FilterPanel from '@/components/FilterPanel'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { Card } from '@/types/card'

const DeckBuilder: React.FC = () => {
  const { cards, loading, error, totalCount } = useCardDB()
  const [showFilters, setShowFilters] = useState(false)
  
  // 検索・フィルタ機能
  const {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    filteredCards,
    totalCount: filteredCount,
    includeFlavorText,
    setIncludeFlavorText,
    clearAll
  } = useSearch({ cards })

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
          {filteredCount}/{totalCount} cards
        </div>
      </div>

      {/* 検索バー */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={clearAll}
          includeFlavorText={includeFlavorText}
          onIncludeFlavorTextChange={setIncludeFlavorText}
        />
      </div>

      {/* フィルタセクション */}
      <div className="space-y-4">
        {/* フィルタ表示切り替えボタン */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          {showFilters ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
          <span className="font-medium">詳細フィルタ</span>
          {(filters.colors?.length || 0) + 
           (filters.cardTypes?.length || 0) + 
           (filters.rarities?.length || 0) +
           (filters.minCost !== undefined ? 1 : 0) +
           (filters.maxCost !== undefined ? 1 : 0) > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {(filters.colors?.length || 0) + 
               (filters.cardTypes?.length || 0) + 
               (filters.rarities?.length || 0) +
               (filters.minCost !== undefined ? 1 : 0) +
               (filters.maxCost !== undefined ? 1 : 0)}
            </span>
          )}
        </button>

        {/* フィルタパネル */}
        {showFilters && (
          <FilterPanel
            filters={filters}
            onFilterChange={setFilters}
            onClearAll={clearAll}
          />
        )}
      </div>

      {/* カードグリッド */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <CardGrid
          cards={filteredCards}
          onCardAdd={handleCardAdd}
          onCardClick={handleCardClick}
          loading={loading}
        />
      </div>
    </div>
  )
}

export default DeckBuilder