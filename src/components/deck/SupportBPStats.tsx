import React from 'react'
import { useDeckStore } from '@/stores/deckStore'
import { 
  formatSupportBPDistribution, 
  analyzeSupportBPDistribution 
} from '@/utils/supportBPCalculation'
// import type { SupportBPDistribution } from '@/types/card' // 現在未使用

interface SupportBPStatsProps {
  showDetails?: boolean;
  className?: string;
}

/**
 * 助太刀BP統計表示コンポーネント
 */
export const SupportBPStats: React.FC<SupportBPStatsProps> = ({ 
  showDetails = false,
  className = ""
}) => {
  const { getSupportBPDistribution, currentDeck } = useDeckStore()
  
  try {
    // デッキ状態をデバッグ
    console.log('Current deck cards:', currentDeck.cards)
    console.log('Deck card count:', Object.keys(currentDeck.cards).length)
    
    // 助太刀BP分布を取得
    const distribution = getSupportBPDistribution()
    console.log('Support BP Distribution:', distribution)
    const formatted = formatSupportBPDistribution(distribution)
    const analysis = analyzeSupportBPDistribution(distribution)
  
    if (!formatted.summary.hasSupport) {
      return (
        <div className={`p-3 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            助太刀BP統計
          </h4>
          <p className="text-sm text-gray-500">
            助太刀可能なユニットカードがありません
          </p>
        </div>
      )
    }
  
  return (
    <div className={`p-3 bg-white border border-gray-200 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900">
          助太刀BP統計
        </h4>
        <div className="text-xs text-gray-500">
          {formatted.summary.total}枚 (平均: {formatted.summary.average}BP)
        </div>
      </div>
      
      {/* BP分布表示 */}
      <div className="space-y-2">
        {formatted.entries.map(entry => (
          <div key={entry.label} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded"
                style={{ 
                  backgroundColor: getBPColor(entry.bp),
                }}
              />
              <span className="text-sm font-medium text-gray-700">
                {entry.label}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-900 font-medium">
                {entry.count}枚
              </span>
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${(entry.count / formatted.summary.total) * 100}%`,
                    backgroundColor: getBPColor(entry.bp)
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* 詳細分析（詳細モード時） */}
      {showDetails && (
        <div className="mt-4 pt-3 border-t border-gray-200 space-y-3">
          {/* 戦略分析 */}
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-700">助太刀分析</h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">助太刀カード:</span>
                <span className="font-medium">
                  {formatted.summary.total}枚
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">平均BP:</span>
                <span className="font-medium">
                  {formatted.summary.average}BP
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">総助太刀力:</span>
                <span className="font-medium">
                  {formatted.entries.reduce((sum, entry) => sum + (entry.bp * entry.count), 0).toLocaleString()}BP
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">BP種類:</span>
                <span className="font-medium">
                  {formatted.entries.length}種類
                </span>
              </div>
            </div>
          </div>
          
          {/* 推奨事項 */}
          {analysis.recommendations.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-gray-700">推奨事項</h5>
              <div className="space-y-1">
                {analysis.recommendations.map((recommendation, index) => (
                  <p key={index} className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    💡 {recommendation}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
  } catch (error) {
    console.error('Error in SupportBPStats:', error)
    return (
      <div className={`p-3 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <h4 className="text-sm font-medium text-red-700 mb-2">
          助太刀BP統計エラー
        </h4>
        <p className="text-sm text-red-600">
          統計データの読み込みに失敗しました: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    )
  }
}

/**
 * BP値に対応する色を取得
 */
const getBPColor = (bp: number): string => {
  switch (bp) {
    case 1000: return '#10b981' // green-500
    case 2000: return '#3b82f6' // blue-500
    case 3000: return '#f59e0b' // yellow-500
    case 4000: return '#ef4444' // red-500
    case 5000: return '#8b5cf6' // purple-500
    default: return '#6b7280'   // gray-500
  }
}

/**
 * 簡略版助太刀BP統計（インライン表示用）
 */
export const SupportBPStatsInline: React.FC<{ className?: string }> = ({ 
  className = "" 
}) => {
  const { getSupportBPDistribution } = useDeckStore()
  const distribution = getSupportBPDistribution()
  const formatted = formatSupportBPDistribution(distribution)
  
  if (!formatted.summary.hasSupport) {
    return (
      <div className={`text-xs text-gray-500 ${className}`}>
        助太刀: なし
      </div>
    )
  }
  
  return (
    <div className={`text-xs text-gray-600 ${className}`}>
      <span className="font-medium">助太刀:</span>
      {formatted.entries.slice(0, 3).map((entry, index) => (
        <span key={entry.label} className="ml-1">
          {index > 0 && ', '}
          {entry.label}×{entry.count}
        </span>
      ))}
      {formatted.entries.length > 3 && <span className="ml-1">...</span>}
      <span className="ml-2 text-gray-500">
        (平均: {formatted.summary.average}BP)
      </span>
    </div>
  )
}

export default SupportBPStats