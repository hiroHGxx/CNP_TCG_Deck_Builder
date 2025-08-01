import React, { useState, useEffect } from 'react'
import { useCardDB } from '@/hooks/useCardDB'
import { useSearch } from '@/hooks/useSearch'
import { useDeckStore } from '@/stores/deckStore'
import { useReikiStore } from '@/stores/reikiStore'
import CardGrid from '@/components/CardGrid'
import SearchBar from '@/components/SearchBar'
import FilterPanel from '@/components/FilterPanel'
import DeckList from '@/components/DeckList'
import { ReikiManager } from '@/components/deck/ReikiManager'
import { SupportBPStats } from '@/components/deck/SupportBPStats'
import { SimpleError } from '@/components/common/ErrorBoundary'
import { ChevronDown, ChevronUp, Layout, List, Sparkles, Target } from 'lucide-react'
import type { Card } from '@/types/card'

const DeckBuilder: React.FC = () => {
  const { cards, loading, error, totalCount, retry, canRetry } = useCardDB()
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'deck' | 'reiki' | 'stats'>('cards')
  
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
    currentDeck,
    addCardToDeck,
    removeCardFromDeck,
    setCardCount,
    clearDeck,
    setDeckName,
    saveDeck,
    getTotalCardCount,
    setAllCards
  } = useDeckStore()
  
  // レイキ機能
  const { getTotalCount: getReikiTotalCount } = useReikiStore()
  
  // カードデータをdeckStoreに設定（色分布計算のため）
  useEffect(() => {
    if (cards.length > 0) {
      setAllCards(cards)
    }
  }, [cards, setAllCards])

  const handleCardAdd = (cardId: string) => {
    const card = cards.find(c => c.cardId === cardId)
    if (card) {
      addCardToDeck(card)
    }
  }

  // カードクリック機能は無効化済み（+/-ボタンのみ使用）

  const handleCardAddDirect = (card: Card) => {
    addCardToDeck(card)
  }

  const handleSaveDeck = () => {
    const deckId = saveDeck()
    alert(`デッキ「${currentDeck.name}」を保存しました (ID: ${deckId})`)
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Deck Builder</h1>
        <SimpleError
          error={`${error.userMessage}${error.suggestion ? ` ${error.suggestion}` : ''}`}
          onRetry={canRetry ? retry : undefined}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Deck Builder</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            メイン: {getTotalCardCount()}/50枚
          </div>
          <div className="text-sm text-gray-500">
            レイキ: {getReikiTotalCount()}/15枚
          </div>
          <div className="text-sm text-gray-500">
            カード: {filteredCount}/{totalCount}種類
          </div>
        </div>
      </div>

      {/* ビューモード切り替え */}
      <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setViewMode('cards')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
            viewMode === 'cards'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Layout className="h-4 w-4" />
          <span>カード一覧</span>
        </button>
        <button
          onClick={() => setViewMode('deck')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
            viewMode === 'deck'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <List className="h-4 w-4" />
          <span>デッキ編集</span>
        </button>
        <button
          onClick={() => setViewMode('reiki')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
            viewMode === 'reiki'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>レイキ</span>
        </button>
        <button
          onClick={() => setViewMode('stats')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
            viewMode === 'stats'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Target className="h-4 w-4" />
          <span>統計</span>
        </button>
      </div>

      {viewMode === 'cards' ? (
        <>
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
              loading={loading}
            />
          </div>
        </>
      ) : viewMode === 'deck' ? (
        /* デッキ編集モード */
        <DeckList
          cards={cards}
          deckCards={currentDeck.cards}
          deckName={currentDeck.name}
          onCardAdd={handleCardAddDirect}
          onCardRemove={removeCardFromDeck}
          onCardSetCount={setCardCount}
          onDeckNameChange={setDeckName}
          onSaveDeck={handleSaveDeck}
          onClearDeck={clearDeck}
        />
      ) : viewMode === 'reiki' ? (
        /* レイキ編集モード */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <ReikiManager allCards={cards} />
        </div>
      ) : (
        /* 統計表示モード */
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              デッキ統計
            </h2>
            
            {/* デッキ概要情報 */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-700 mb-2">
                デッキ概要
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs text-blue-600">
                <div className="flex justify-between">
                  <span>メインデッキ:</span>
                  <span className="font-medium">{getTotalCardCount()}/50枚</span>
                </div>
                <div className="flex justify-between">
                  <span>レイキデッキ:</span>
                  <span className="font-medium">{getReikiTotalCount()}/15枚</span>
                </div>
                <div className="flex justify-between">
                  <span>助太刀対応:</span>
                  <span className="font-medium">{Object.keys(currentDeck.cards).filter(cardId => cards.find(c => c.cardId === cardId && c.supportBP !== null && c.supportBP > 0)).length}種類</span>
                </div>
                <div className="flex justify-between">
                  <span>完成度:</span>
                  <span className="font-medium">{Math.round(((getTotalCardCount() + getReikiTotalCount()) / 65) * 100)}%</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 助太刀BP統計 */}
              <SupportBPStats showDetails={true} />
              
              {/* レイキ管理（コンパクト版） */}
              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-900">レイキ構成</h3>
                <ReikiManager allCards={cards} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeckBuilder