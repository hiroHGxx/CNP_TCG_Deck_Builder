import React, { useMemo } from 'react'
import { AlertCircle, CheckCircle, Edit3, Save, Trash2 } from 'lucide-react'
import DeckCard from './DeckCard'
import { validateDeck, calculateDeckStats } from '@/utils/deckValidation'
import type { Card, DeckCardEntry } from '@/types/card'

interface DeckListProps {
  cards: Card[]
  deckCards: Record<string, number>
  deckName: string
  onCardAdd: (card: Card) => void
  onCardRemove: (cardId: string) => void
  onCardSetCount: (cardId: string, count: number) => void
  onDeckNameChange: (name: string) => void
  onSaveDeck: () => void
  onClearDeck: () => void
}

const DeckList: React.FC<DeckListProps> = ({
  cards,
  deckCards,
  deckName,
  onCardAdd,
  onCardRemove,
  onCardSetCount,
  onDeckNameChange,
  onSaveDeck,
  onClearDeck
}) => {
  // デッキ内のカード一覧を生成
  const deckCardEntries: DeckCardEntry[] = useMemo(() => {
    const cardMap = new Map(cards.map(card => [card.cardId, card]))
    
    return Object.entries(deckCards)
      .map(([cardId, count]) => {
        const card = cardMap.get(cardId)
        if (card) {
          return { card, count }
        }
        return null
      })
      .filter((entry): entry is DeckCardEntry => entry !== null)
      .sort((a, b) => {
        // まずコストでソート、次に名前でソート
        if (a.card.cost !== b.card.cost) {
          return a.card.cost - b.card.cost
        }
        return a.card.name.localeCompare(b.card.name)
      })
  }, [cards, deckCards])

  // バリデーション結果
  const validation = useMemo(() => {
    return validateDeck(deckCards, cards)
  }, [deckCards, cards])

  // 統計情報
  const stats = useMemo(() => {
    return calculateDeckStats(deckCards, cards)
  }, [deckCards, cards])

  const [isEditingName, setIsEditingName] = React.useState(false)
  const [editName, setEditName] = React.useState(deckName)

  const handleNameEdit = () => {
    setEditName(deckName)
    setIsEditingName(true)
  }

  const handleNameSave = () => {
    onDeckNameChange(editName.trim() || 'New Deck')
    setIsEditingName(false)
  }

  const handleNameCancel = () => {
    setEditName(deckName)
    setIsEditingName(false)
  }

  const getColorName = (color: string) => {
    const colorNames: Record<string, string> = {
      red: '赤',
      blue: '青',
      green: '緑',
      yellow: '黄',
      colorless: '無色'
    }
    return colorNames[color] || color
  }

  return (
    <div className="space-y-6">
      {/* デッキヘッダー */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {isEditingName ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-xl font-bold border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameSave()
                    if (e.key === 'Escape') handleNameCancel()
                  }}
                  autoFocus
                />
                <button
                  onClick={handleNameSave}
                  className="p-1 text-green-600 hover:text-green-700"
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-gray-900">{deckName}</h2>
                <button
                  onClick={handleNameEdit}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onSaveDeck}
              disabled={!validation.isValid}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>保存</span>
            </button>
            
            <button
              onClick={onClearDeck}
              className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>クリア</span>
            </button>
          </div>
        </div>

        {/* デッキ統計 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.totalCards}</div>
            <div className="text-gray-600">総枚数</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.averageCost}</div>
            <div className="text-gray-600">平均コスト</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {Object.keys(stats.colorDistribution).length}
            </div>
            <div className="text-gray-600">使用色数</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center">
              {validation.isValid ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-500" />
              )}
            </div>
            <div className="text-gray-600">ステータス</div>
          </div>
        </div>
      </div>

      {/* バリデーション結果 */}
      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          {validation.errors.length > 0 && (
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-red-800 mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                エラー
              </h3>
              <ul className="text-sm text-red-700 space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {validation.warnings.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-yellow-800 mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                警告
              </h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                {validation.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 色分布 */}
      {stats.totalCards > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">色分布</h3>
          <div className="grid grid-cols-5 gap-3">
            {Object.entries(stats.colorDistribution).map(([color, count]) => (
              <div key={color} className="text-center">
                <div className={`w-6 h-6 rounded-full mx-auto mb-1 ${
                  color === 'red' ? 'bg-red-500' :
                  color === 'blue' ? 'bg-blue-500' :
                  color === 'green' ? 'bg-green-500' :
                  color === 'yellow' ? 'bg-yellow-500' :
                  'bg-gray-400'
                }`} />
                <div className="text-sm font-medium">{count}</div>
                <div className="text-xs text-gray-600">{getColorName(color)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* デッキ一覧 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          デッキ内容 ({deckCardEntries.length}種類)
        </h3>
        
        {deckCardEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🃏</div>
            <p>デッキにカードがありません</p>
            <p className="text-sm">左側からカードを追加してください</p>
          </div>
        ) : (
          <div className="space-y-2">
            {deckCardEntries.map(({ card, count }) => (
              <DeckCard
                key={card.cardId}
                card={card}
                count={count}
                onAdd={onCardAdd}
                onRemove={onCardRemove}
                onSetCount={onCardSetCount}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DeckList