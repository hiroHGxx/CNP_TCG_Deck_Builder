import React, { useState } from 'react'
import { useReikiStore } from '@/stores/reikiStore'
import { useDeckStore } from '@/stores/deckStore'
import { calculateColorStats } from '@/utils/reikiCalculation'
import { 
  getReikiImageUrl, 
  REIKI_COLOR_NAMES, 
  REIKI_COLOR_CODES,
  REIKI_TAILWIND_CLASSES 
} from '@/utils/reikiAssets'
import type { ReikiColor, ColorDistribution } from '@/types/reiki'
import type { Card } from '@/types/card'

interface ReikiManagerProps {
  allCards?: Card[]
}

/**
 * レイキデッキ管理コンポーネント
 * 15枚のレイキカード配分を管理・表示
 */
export const ReikiManager: React.FC<ReikiManagerProps> = ({ allCards = [] }) => {
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const {
    cards: reikiCards,
    setColor,
    increment,
    decrement,
    clear,
    // applySuggestion, // 現在未使用
    // getSuggestion, // 現在未使用
    validate,
    getTotalCount,
    isValid
  } = useReikiStore()
  
  const { currentDeck } = useDeckStore()
  
  // メインデッキの色分布を計算
  const mainColorDistribution: ColorDistribution = calculateColorStats(
    currentDeck.cards, 
    allCards
  )
  
  // バリデーション結果（エラーハンドリング付き）
  let validation;
  try {
    validation = validate()
  } catch (error) {
    console.error('ReikiManager validation error:', error)
    validation = {
      isValid: true,
      errors: [],
      warnings: [],
      totalCards: getTotalCount(),
      colorBalance: { red: 0, blue: 0, green: 0, yellow: 0 },
      suggestions: []
    }
  }
  const totalCards = getTotalCount()
  
  // 推奨配分取得（削除：現在未使用）
  // const suggestion = getSuggestion(mainColorDistribution)
  
  // 色コントロール（削除：現在未使用）
  // const handleColorChange = (color: ReikiColor, value: string) => {
  //   const count = Math.max(0, Math.min(15, parseInt(value) || 0))
  //   setColor(color, count)
  // }
  
  // 推奨配分適用（削除：現在未使用）
  // const handleApplySuggestion = () => {
  //   applySuggestion(mainColorDistribution)
  // }
  
  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">レイキデッキ</h3>
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            isValid() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {totalCards}/15
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {showAdvanced ? '簡単' : '詳細'}
          </button>
          <button
            onClick={clear}
            className="text-xs text-red-500 hover:text-red-700"
          >
            クリア
          </button>
        </div>
      </div>
      
      {/* レイキカード一覧 */}
      <div className="space-y-3">
        {reikiCards.map((reikiCard) => (
          <ReikiCardRow
            key={reikiCard.color}
            color={reikiCard.color}
            count={reikiCard.count}
            onChange={(count) => setColor(reikiCard.color, count)}
            onIncrement={() => increment(reikiCard.color)}
            onDecrement={() => decrement(reikiCard.color)}
            showAdvanced={showAdvanced}
          />
        ))}
      </div>
      
      {/* 推奨配分（削除：単色戦略を尊重） */}
      {/* 推奨配分機能は削除されました。プレイヤーの戦略を尊重します。 */}
      
      {/* バリデーション結果 */}
      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="space-y-2">
          {validation.errors.map((error, index) => (
            <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          ))}
          {validation.warnings.map((warning, index) => (
            <div key={index} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
              {warning}
            </div>
          ))}
        </div>
      )}
      
      {/* 詳細統計（詳細モード時） */}
      {showAdvanced && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            メインデッキ色分布
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(mainColorDistribution)
              .filter(([color]) => color !== 'colorless')
              .map(([color, count]) => (
                <div key={color} className="flex justify-between">
                  <span className="capitalize">{color}:</span>
                  <span>{count}枚</span>
                </div>
              ))}
          </div>
          
          {validation.suggestions.length > 0 && (
            <div className="mt-3">
              <h5 className="text-xs font-medium text-gray-700 mb-1">
                改善提案:
              </h5>
              {validation.suggestions.map((suggestion, index) => (
                <p key={index} className="text-xs text-gray-600">
                  • {suggestion}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * 個別レイキカード行コンポーネント
 */
interface ReikiCardRowProps {
  color: ReikiColor
  count: number
  onChange: (count: number) => void
  onIncrement: () => void
  onDecrement: () => void
  showAdvanced: boolean
}

const ReikiCardRow: React.FC<ReikiCardRowProps> = ({
  color,
  count,
  onChange,
  onIncrement,
  onDecrement,
  showAdvanced
}) => {
  return (
    <div className="flex items-center space-x-3 p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
      {/* レイキカード画像 */}
      <div className="flex-shrink-0">
        <img
          src={getReikiImageUrl(color)}
          alt={REIKI_COLOR_NAMES[color]}
          className="w-8 h-10 object-cover rounded"
          loading="lazy"
        />
      </div>
      
      {/* 色名・ラベル */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">
          {REIKI_COLOR_NAMES[color]}
        </h4>
        {showAdvanced && (
          <p className="text-xs text-gray-500">
            {color}
          </p>
        )}
      </div>
      
      {/* 数量コントロール */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onDecrement}
          disabled={count <= 0}
          className="w-6 h-6 flex items-center justify-center rounded bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          -
        </button>
        
        <input
          type="number"
          min="0"
          max="15"
          value={count}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="w-12 text-center text-sm border border-gray-300 rounded px-1 py-1"
        />
        
        <button
          onClick={onIncrement}
          disabled={count >= 15}
          className="w-6 h-6 flex items-center justify-center rounded bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>
      
      {/* 色バッジ */}
      <div 
        className={`w-3 h-3 rounded-full ${REIKI_TAILWIND_CLASSES[color]}`}
        style={{ backgroundColor: REIKI_COLOR_CODES[color] }}
      />
    </div>
  )
}