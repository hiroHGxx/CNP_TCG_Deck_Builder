import React, { useState } from 'react'
import { CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import type { Card } from '@/types/card'

interface DeckStatisticsProps {
  mainDeckCount: number
  reikiDeckCount: number
  supportBPCount: number
  completionRate: number
  isValidDeck: boolean
  deckCardEntries: Array<{ card: Card; count: number }>
}

/**
 * デッキ統計表示コンポーネント
 */
export const DeckStatistics: React.FC<DeckStatisticsProps> = ({
  mainDeckCount,
  reikiDeckCount,
  supportBPCount,
  completionRate,
  isValidDeck,
  deckCardEntries
}) => {
  const [expandedStats, setExpandedStats] = useState({
    colorDistribution: true,
    bpDistribution: false,
    costDistribution: false
  })

  const toggleStats = (stat: keyof typeof expandedStats) => {
    setExpandedStats(prev => ({
      ...prev,
      [stat]: !prev[stat]
    }))
  }

  // 色分布計算
  const colorDistribution = deckCardEntries.reduce((acc, { card, count }) => {
    acc[card.color] = (acc[card.color] || 0) + count
    return acc
  }, {} as Record<string, number>)

  // BP分布計算（ユニットカードのみ）
  const bpDistribution = deckCardEntries
    .filter(({ card }) => card.cardType === 'unit' && card.bp !== null)
    .reduce((acc, { card, count }) => {
      acc[card.bp!] = (acc[card.bp!] || 0) + count
      return acc
    }, {} as Record<number, number>)

  // コスト分布計算（全カード）
  const costDistribution = deckCardEntries.reduce((acc, { card, count }) => {
    acc[card.cost] = (acc[card.cost] || 0) + count
    return acc
  }, {} as Record<number, number>)

  const getColorName = (color: string) => {
    const colorNames: Record<string, string> = {
      red: '赤',
      blue: '青',
      green: '緑',
      yellow: '黄',
      purple: '紫'
    }
    return colorNames[color] || color
  }

  const getColorClass = (color: string) => {
    const colorClasses: Record<string, string> = {
      red: 'bg-red-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      purple: 'bg-purple-500'
    }
    return colorClasses[color] || 'bg-gray-400'
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-blue-900">デッキ統計</h3>
        {isValidDeck ? (
          <CheckCircle className="w-6 h-6 text-green-500" />
        ) : (
          <AlertCircle className="w-6 h-6 text-orange-500" />
        )}
      </div>
      
      {/* 基本統計グリッド */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-white rounded-lg p-3 border border-blue-100">
          <div className="text-2xl font-bold text-blue-900">{mainDeckCount}</div>
          <div className="text-blue-700">メインデッキ</div>
          <div className="text-xs text-blue-600">/ 50枚</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-blue-100">
          <div className="text-2xl font-bold text-indigo-900">{reikiDeckCount}</div>
          <div className="text-indigo-700">レイキデッキ</div>
          <div className="text-xs text-indigo-600">/ 15枚</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-blue-100">
          <div className="text-2xl font-bold text-purple-900">{supportBPCount}</div>
          <div className="text-purple-700">助太刀対応</div>
          <div className="text-xs text-purple-600">種類</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-blue-100">
          <div className="text-2xl font-bold text-teal-900">{completionRate}%</div>
          <div className="text-teal-700">完成度</div>
          <div className="text-xs text-teal-600">65枚中</div>
        </div>
      </div>
      
      {/* 詳細統計グラフ */}
      <div className="mt-4 space-y-3">
        {/* 色分布グラフ */}
        {Object.keys(colorDistribution).length > 0 && (
          <div className="bg-white rounded-lg border border-blue-100">
            <div 
              className="px-4 py-3 border-b border-blue-100 cursor-pointer hover:bg-blue-50 transition-colors"
              onClick={() => toggleStats('colorDistribution')}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">🎨 メインデッキ色分布</h4>
                {expandedStats.colorDistribution ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </div>
            </div>
            {expandedStats.colorDistribution && (
              <div className="p-4">
                <div className="space-y-2">
                  {Object.entries(colorDistribution)
                    .filter(([color]) => color !== 'colorless')
                    .map(([color, count]) => {
                      const percentage = Math.round((count / mainDeckCount) * 100)
                      return (
                        <div key={color} className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2 w-16">
                            <div className={`w-3 h-3 rounded-full ${getColorClass(color)}`} />
                            <span className="text-xs font-medium">{getColorName(color)}</span>
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getColorClass(color)}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-600 w-12 text-right">
                            {count}枚
                          </div>
                          <div className="text-xs text-gray-500 w-8 text-right">
                            {percentage}%
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* BP分布グラフ */}
        {Object.keys(bpDistribution).length > 0 && (
          <div className="bg-white rounded-lg border border-blue-100">
            <div 
              className="px-4 py-3 border-b border-blue-100 cursor-pointer hover:bg-blue-50 transition-colors"
              onClick={() => toggleStats('bpDistribution')}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">⚔️ ユニットBP分布</h4>
                {expandedStats.bpDistribution ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </div>
            </div>
            {expandedStats.bpDistribution && (
              <div className="p-4">
                <div className="flex items-end justify-between h-32 space-x-1">
                  {[1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000].map(bp => {
                    const count = bpDistribution[bp] || 0
                    const maxCount = Math.max(...Object.values(bpDistribution))
                    const height = maxCount > 0 ? Math.max((count / maxCount) * 80, count > 0 ? 8 : 0) : 0
                    
                    return (
                      <div key={bp} className="flex-1 flex flex-col items-center">
                        <div className="text-xs text-gray-600 mb-2 h-5 flex items-center justify-center">
                          {count > 0 ? count : ''}
                        </div>
                        <div 
                          className={`bg-purple-500 rounded-t w-full min-h-0 ${count > 0 ? 'opacity-100' : 'opacity-20 bg-gray-300'}`}
                          style={{ height: `${height}px` }}
                        />
                        <div className="text-xs text-gray-500 mt-2 transform -rotate-90 w-4">
                          {bp/1000}k
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="text-xs text-gray-500 text-center mt-3">BP値</div>
              </div>
            )}
          </div>
        )}

        {/* コスト分布グラフ */}
        {Object.keys(costDistribution).length > 0 && (
          <div className="bg-white rounded-lg border border-blue-100">
            <div 
              className="px-4 py-3 border-b border-blue-100 cursor-pointer hover:bg-blue-50 transition-colors"
              onClick={() => toggleStats('costDistribution')}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">💎 コスト分布</h4>
                {expandedStats.costDistribution ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </div>
            </div>
            {expandedStats.costDistribution && (
              <div className="p-4">
                <div className="flex items-end justify-between h-28 space-x-1">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(cost => {
                    const count = costDistribution[cost] || 0
                    const maxCount = Math.max(...Object.values(costDistribution))
                    const height = maxCount > 0 ? Math.max((count / maxCount) * 64, count > 0 ? 6 : 0) : 0
                    
                    return (
                      <div key={cost} className="flex-1 flex flex-col items-center">
                        <div className="text-xs text-gray-600 mb-2 h-5 flex items-center justify-center">
                          {count > 0 ? count : ''}
                        </div>
                        <div 
                          className={`bg-teal-500 rounded-t w-full min-h-0 ${count > 0 ? 'opacity-100' : 'opacity-20 bg-gray-300'}`}
                          style={{ height: `${height}px` }}
                        />
                        <div className="text-xs text-gray-500 mt-2">
                          {cost}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="text-xs text-gray-500 text-center mt-3">コスト</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DeckStatistics