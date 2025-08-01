import React, { useState, useRef, useMemo, memo } from 'react'
import CardTooltip from './CardTooltip'
import CardButtons from './card/CardButtons'
import { useDeckStore } from '@/stores/deckStore'
import { useCardTooltip } from '@/hooks/useCardTooltip'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'
import { getRarityColor, getColorDot, calculateCostDisplay } from '@/utils/cardHelpers'
import type { Card } from '@/types/card'

interface CardThumbnailProps {
  card: Card
  onAdd?: (cardId: string) => void
  onRemove?: (cardId: string) => void
  showCount?: number
}

const CardThumbnail: React.FC<CardThumbnailProps> = memo(({ 
  card, 
  onAdd,
  onRemove, 
  showCount 
}) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const cardRef = useRef<HTMLDivElement>(null)
  
  // ツールチップ機能をカスタムフックに委譲
  const {
    showTooltip,
    tooltipPosition,
    handleMouseEnter,
    handleMouseLeave,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove
  } = useCardTooltip()

  // キーボードナビゲーション
  const { handleKeyDown, handleEscapeKey } = useKeyboardNavigation()
  
  // デッキストアから現在のカード枚数を取得
  const { currentDeck, addCardToDeck, removeCardFromDeck, getTotalCardCount } = useDeckStore()
  const cardCountInDeck = currentDeck.cards[card.cardId] || 0
  const isInDeck = cardCountInDeck > 0
  const totalCards = getTotalCardCount()
  const canAddMore = cardCountInDeck < 4 && totalCards < 50 // 4枚制限 + 50枚制限チェック

  // カード全体クリック機能は無効化済み（+/-ボタンのみ使用）

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoading(false)
  }


  // コスト表示の計算（メモ化）
  const costDisplay = useMemo(() => 
    calculateCostDisplay(card.colorBalance, card.cost), 
    [card.colorBalance, card.cost]
  )

  // アクセシビリティ用のラベル生成
  const cardAriaLabel = useMemo(() => {
    const parts = [
      `カード: ${card.name}`,
      `コスト: ${card.cost}`,
      `色: ${card.color}`,
      `レアリティ: ${card.rarity}`,
      `タイプ: ${card.cardType}`
    ]
    
    if (card.bp) {
      parts.push(`BP: ${card.bp}`)
    }
    
    if (cardCountInDeck > 0) {
      parts.push(`デッキ内: ${cardCountInDeck}枚`)
    }
    
    return parts.join(', ')
  }, [card, cardCountInDeck])

  // キーボードイベントハンドラー
  const handleCardKeyDown = (event: React.KeyboardEvent) => {
    // Escキーでツールチップを閉じる
    handleEscapeKey(() => {
      // ツールチップを閉じる処理はuseCardTooltipで管理
    }, event)
    
    // Enter/Spaceキーでツールチップ表示
    handleKeyDown(() => {
      handleMouseEnter(cardRef)
    }, event)
  }

  return (
    <>
      <div 
        ref={cardRef}
        className="card-thumbnail relative group"
        role="button"
        tabIndex={0}
        aria-label={cardAriaLabel}
        aria-describedby={`tooltip-${card.cardId}`}
        aria-pressed={isInDeck}
        style={{ cursor: 'default' }}
        onMouseEnter={() => handleMouseEnter(cardRef)}
        onMouseLeave={handleMouseLeave}
        onTouchStart={() => handleTouchStart(cardRef)}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onKeyDown={handleCardKeyDown}
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

        {/* 枚数バッジ（デッキ内カード枚数） */}
        {cardCountInDeck > 0 && (
          <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
            {cardCountInDeck}
          </div>
        )}

        {/* showCount prop（既存の表示） */}
        {showCount && showCount > 0 && !cardCountInDeck && (
          <div className="absolute top-1 right-1 bg-gray-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {showCount}
          </div>
        )}

        {/* カードボタン（+/-） */}
        <CardButtons
          card={card}
          cardCountInDeck={cardCountInDeck}
          canAddMore={canAddMore}
          isInDeck={isInDeck}
          onAdd={onAdd}
          onRemove={onRemove}
          addCardToDeck={addCardToDeck}
          removeCardFromDeck={removeCardFromDeck}
          totalCards={totalCards}
        />

        {/* ホバー効果（ボタンより下層に配置） */}
        <div 
          className={`absolute inset-0 transition-all duration-200 ${
            isInDeck 
              ? 'bg-blue-500 bg-opacity-0 group-hover:bg-opacity-15 border-2 border-blue-400 border-opacity-30' 
              : 'bg-black bg-opacity-0 group-hover:bg-opacity-10'
          }`}
          style={{ zIndex: 1, pointerEvents: 'none' }}
        />
      </div>

      {/* カード情報 */}
      <div className={`p-2 space-y-1 transition-colors duration-200 ${
        isInDeck ? 'bg-blue-50 border-l-2 border-blue-400' : 'bg-white'
      }`}>
        {/* 名前 */}
        <div>
          <h3 className={`text-sm font-semibold leading-tight ${
            isInDeck ? 'text-blue-900' : 'text-gray-900'
          }`}>
            {card.name}
          </h3>
        </div>

        {/* コスト表示（案1: アイコン分離表示） */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-0.5">
            {/* 色コスト */}
            {Array.from({ length: costDisplay.colorCost }).map((_, index) => (
              <div
                key={`color-${index}`}
                className={`w-2 h-2 rounded-full ${getColorDot(card.color)}`}
              />
            ))}
            {/* 無色コスト */}
            {Array.from({ length: costDisplay.colorlessCost }).map((_, index) => (
              <div
                key={`colorless-${index}`}
                className="w-2 h-2 rounded-full bg-gray-400"
              />
            ))}
            {/* 総コスト表示 */}
            <span className="text-xs font-semibold text-gray-600 ml-1">
              ({costDisplay.totalCost})
            </span>
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

      {/* ツールチップ */}
      <CardTooltip
        card={card}
        visible={showTooltip}
        position={tooltipPosition}
        id={`tooltip-${card.cardId}`}
      />
    </>
  )
})

export default CardThumbnail