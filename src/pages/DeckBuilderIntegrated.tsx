import React, { useState, useEffect } from 'react'
import { useCardDB } from '@/hooks/useCardDB'
import { useSearch } from '@/hooks/useSearch'
import { useDeckStore } from '@/stores/deckStore'
import CardGrid from '@/components/CardGrid'
import SearchBar from '@/components/SearchBar'
import FilterPanel from '@/components/FilterPanel'
import { DeckSidebar } from '@/components/deck/DeckSidebar'
import { IntegratedLayout, CardGridSection } from '@/components/layout/IntegratedLayout'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import type { Card } from '@/types/card'

const DeckBuilderIntegrated: React.FC = () => {
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

  // デッキ機能
  const {
    addCardToDeck,
    removeCardFromDeck,
    clearDeck,
    saveDeck,
    setAllCards
  } = useDeckStore()
  
  // カードデータをdeckStoreに設定（色分布計算のため）
  useEffect(() => {
    if (cards.length > 0) {
      setAllCards(cards)
    }
  }, [cards, setAllCards])

  const handleCardClick = (card: Card) => {
    // カード全体クリックによる追加機能を無効化
    // カードの操作は+/-ボタンのみに限定
  }

  const handleSaveDeck = () => {
    const deckId = saveDeck()
    alert(`デッキを保存しました (ID: ${deckId})`)
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold text-gray-900">Deck Builder</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Cards</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  // 左カラムコンテンツ（カードグリッド・検索・フィルタ）
  const leftColumn = (
    <>
      {/* 検索・フィルタセクション */}
      <CardGridSection className="bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">カード検索</h2>
        </div>
        
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={clearAll}
          includeFlavorText={includeFlavorText}
          onIncludeFlavorTextChange={setIncludeFlavorText}
        />
        
        {/* フィルタ表示切り替え */}
        <div className="mt-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            {showFilters ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span className="font-medium text-sm">詳細フィルタ</span>
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
            <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
              <FilterPanel
                filters={filters}
                onFilterChange={setFilters}
                onClearAll={clearAll}
              />
            </div>
          )}
        </div>
      </CardGridSection>

      {/* カードグリッドセクション */}
      <CardGridSection>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">カード一覧</h2>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {filteredCount}種類表示中
            </div>
            <div className="text-xs text-gray-500">
              全{totalCount}種類
            </div>
          </div>
        </div>
        <CardGrid
          cards={filteredCards}
          onCardAdd={(cardId) => {
            const card = cards.find(c => c.cardId === cardId)
            if (card) addCardToDeck(card)
          }}
          onCardRemove={removeCardFromDeck}
          onCardClick={handleCardClick}
          loading={loading}
        />
      </CardGridSection>
    </>
  )

  // 右カラムコンテンツ（統合デッキサイドバー）
  const rightColumn = (
    <DeckSidebar 
      cards={cards}
      onSaveDeck={handleSaveDeck}
      onClearDeck={clearDeck}
    />
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">CNP TCG Deck Builder</h1>
              <p className="text-sm text-gray-600 mt-1">メインデッキ50枚 + レイキデッキ15枚の統合管理</p>
            </div>
            <div className="hidden md:flex items-center space-x-4 text-sm">
              <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                全{totalCount}種類のカード
              </div>
              <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full">
                Phase 2統合UI
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 統合レイアウト */}
      <IntegratedLayout sidebar={rightColumn}>
        {leftColumn}
      </IntegratedLayout>
    </div>
  )
}

export default DeckBuilderIntegrated