import React, { useState } from 'react'
import { useReikiStore } from '@/stores/reikiStore'
import { useDeckStore } from '@/stores/deckStore'
import type { ColorDistribution } from '@/types/reiki'

/**
 * レイキシステムテストコンポーネント
 * 開発・デバッグ用
 */
export const ReikiTest: React.FC = () => {
  const [testCase, setTestCase] = useState<'single' | 'dual' | 'multi' | 'colorless'>('single')
  
  const {
    cards: reikiCards,
    applySuggestion,
    getSuggestion,
    validate,
    clear,
    getTotalCount,
    isValid
  } = useReikiStore()
  
  const { getMainDeckColorStats } = useDeckStore()
  
  // テストケース定義
  const testCases: Record<string, ColorDistribution> = {
    single: { red: 30, blue: 0, green: 0, yellow: 0, colorless: 20 }, // 赤単色
    dual: { red: 20, blue: 15, green: 0, yellow: 0, colorless: 15 }, // 赤青2色
    multi: { red: 12, blue: 10, green: 8, yellow: 6, colorless: 14 }, // 4色多色
    colorless: { red: 0, blue: 0, green: 0, yellow: 0, colorless: 50 } // 無色
  }
  
  // テストケース適用
  const handleTestCase = (caseType: keyof typeof testCases) => {
    const colorDistribution = testCases[caseType]
    applySuggestion(colorDistribution)
    setTestCase(caseType as 'single' | 'dual' | 'multi' | 'colorless')
  }
  
  // 推奨取得
  const currentMainColors = getMainDeckColorStats()
  const suggestion = getSuggestion(currentMainColors)
  const validation = validate()
  
  return (
    <div className="space-y-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          レイキシステムテスト
        </h3>
        <div className={`px-3 py-1 rounded text-sm font-medium ${
          isValid() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {getTotalCount()}/15 {isValid() ? '✓' : '✗'}
        </div>
      </div>
      
      {/* テストケース選択 */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">テストケース</h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(testCases).map(([key]) => {
            const label = {
              single: '赤単色',
              dual: '赤青2色',
              multi: '4色多色',
              colorless: '無色'
            }[key] || key
            
            return (
              <button
                key={key}
                onClick={() => handleTestCase(key as keyof typeof testCases)}
                className={`p-2 text-sm rounded border ${
                  testCase === key
                    ? 'bg-blue-100 border-blue-300 text-blue-800'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* 現在の配分 */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">現在の配分</h4>
        <div className="grid grid-cols-4 gap-2 text-xs">
          {reikiCards.map(card => (
            <div 
              key={card.color}
              className="p-2 bg-white rounded border text-center"
            >
              <div className="capitalize font-medium">{card.color}</div>
              <div className="text-gray-600">{card.count}枚</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 推奨情報 */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">推奨情報</h4>
        <div className="p-3 bg-white rounded border">
          <div className="text-xs text-gray-600 mb-1">
            信頼度: {Math.round(suggestion.confidence * 100)}%
          </div>
          <div className="text-sm text-gray-900 mb-2">
            {suggestion.reasoning}
          </div>
          <div className="grid grid-cols-4 gap-1 text-xs">
            {suggestion.distribution.map(card => (
              <div key={card.color} className="text-center">
                <span className="capitalize">{card.color}:</span> {card.count}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* バリデーション結果 */}
      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">バリデーション</h4>
          <div className="space-y-1">
            {validation.errors.map((error, index) => (
              <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            ))}
            {validation.warnings.map((warning, index) => (
              <div key={index} className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                {warning}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* メインデッキ色分布（参考） */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">
          メインデッキ色分布（参考）
        </h4>
        <div className="grid grid-cols-5 gap-1 text-xs">
          {Object.entries(currentMainColors).map(([color, count]) => (
            <div key={color} className="p-1 bg-white rounded border text-center">
              <div className="capitalize">{color}</div>
              <div className="text-gray-600">{count}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* アクション */}
      <div className="flex space-x-2">
        <button
          onClick={clear}
          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          クリア
        </button>
        <button
          onClick={() => applySuggestion(currentMainColors)}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          実際の推奨適用
        </button>
      </div>
    </div>
  )
}

export default ReikiTest