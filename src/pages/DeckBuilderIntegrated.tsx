import React, { useState, useEffect } from 'react'
import { useCardDB } from '@/hooks/useCardDB'
import { useSearch } from '@/hooks/useSearch'
import { useDeckStore } from '@/stores/deckStore'
import CardGrid from '@/components/CardGrid'
import SearchBar from '@/components/SearchBar'
import FilterPanel from '@/components/FilterPanel'
import { DeckSidebar } from '@/components/deck/DeckSidebar'
import { IntegratedLayout, CardGridSection } from '@/components/layout/IntegratedLayout'
import { ErrorBoundaryWrapper, SimpleError } from '@/components/common/ErrorBoundary'
import { OfflineNotification, ConnectionStatus } from '@/components/common/OfflineNotification'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'
// import type { Card } from '@/types/card' // Unused after removing handleCardClick

const DeckBuilderIntegrated: React.FC = () => {
  const { cards, loading, error, totalCount, retry, canRetry } = useCardDB()
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
    setAllCards
  } = useDeckStore()
  
  // カードデータをdeckStoreに設定（色分布計算のため）
  useEffect(() => {
    if (cards.length > 0) {
      setAllCards(cards)
    }
  }, [cards, setAllCards])

  // カード全体クリックによる追加機能を無効化
  // カードの操作は+/-ボタンのみに限定

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold text-gray-900">Deck Builder</h1>
        <SimpleError
          error={`${error.userMessage}${error.suggestion ? ` ${error.suggestion}` : ''}`}
          onRetry={canRetry ? retry : undefined}
        />
        
        {/* 開発環境でのみ詳細エラーを表示 */}
        {import.meta.env.MODE === 'development' && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
              技術詳細 (開発環境のみ)
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
          </details>
        )}
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
          loading={loading}
        />
      </CardGridSection>
    </>
  )

  // 右カラムコンテンツ（統合デッキサイドバー）
  const rightColumn = (
    <DeckSidebar 
      cards={cards}
    />
  )

  return (
    <ErrorBoundaryWrapper
      onError={(error, errorInfo) => {
        console.error('DeckBuilderIntegrated Error:', error, errorInfo)
        // 本番環境では外部ログサービスに送信する等の処理を追加
      }}
    >
      <OfflineNotification />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Skip to content リンク */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
        >
          メインコンテンツにスキップ
        </a>
        
        {/* ヘッダー */}
        <header className="bg-white shadow-sm border-b border-gray-200" role="banner">
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
                <ConnectionStatus />
              </div>
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main id="main-content" role="main" tabIndex={-1}>
          <IntegratedLayout sidebar={rightColumn}>
            {leftColumn}
          </IntegratedLayout>
        </main>
      </div>
    </ErrorBoundaryWrapper>
  )
}

export default DeckBuilderIntegrated