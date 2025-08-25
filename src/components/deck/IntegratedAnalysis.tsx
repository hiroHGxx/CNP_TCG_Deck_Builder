import React, { useState } from 'react'
import { ChevronDown, ChevronUp, TrendingUp, AlertTriangle, CheckCircle, Target, Wand2 } from 'lucide-react'
import { useDeckStore } from '@/stores/deckStore'
import { useReikiStore } from '@/stores/reikiStore'
import { analyzeIntegratedDeck } from '@/utils/integratedDeckAnalysis'
// import { calculateSuggestedReiki } from '@/utils/reikiCalculation' // Unused
import type { Card } from '@/types/card'
import type { ColorAlignment } from '@/utils/integratedDeckAnalysis'

interface IntegratedAnalysisProps {
  cards: Card[]
}

const IntegratedAnalysis: React.FC<IntegratedAnalysisProps> = ({ cards }) => {
  const { currentDeck, getColorDistribution } = useDeckStore()
  const { cards: reikiCards, applySuggestion } = useReikiStore()
  const [isExpanded, setIsExpanded] = useState(false)
  
  // 統合分析実行
  const analysis = analyzeIntegratedDeck(currentDeck.cards, reikiCards, cards)
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }
  
  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200'
    if (score >= 60) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }
  
  const getAlignmentColor = (alignment: ColorAlignment) => {
    if (alignment.isBalanced) return 'text-green-600'
    if (alignment.mainCount > 0 && alignment.reikiCount > 0) return 'text-yellow-600'
    return 'text-red-600'
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

  const handleApplyRecommendations = () => {
    if (analysis.integrated.balanceScore >= 80) {
      alert('既に良好なバランスです！')
      return
    }
    
    // メインデッキの色分布を取得して推奨レイキを計算
    const mainColorDist = getColorDistribution()
    applySuggestion(mainColorDist)
    
    alert('レイキデッキに推奨配分を適用しました！')
  }

  const hasImprovementPotential = () => {
    return analysis.integrated.balanceScore < 80 && 
           analysis.integrated.recommendations.length > 0
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-purple-600" />
            <h3 className="text-md font-semibold text-purple-900">統合デッキ分析</h3>
            <div className={`px-2 py-1 rounded-full text-xs font-bold border ${getScoreBgColor(analysis.integrated.balanceScore)}`}>
              <span className={getScoreColor(analysis.integrated.balanceScore)}>
                {analysis.integrated.balanceScore}点
              </span>
            </div>
            {hasImprovementPotential() && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleApplyRecommendations()
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs font-medium flex items-center space-x-1"
                title="推奨配分を自動適用"
              >
                <Wand2 className="h-3 w-3" />
                <span>自動改善</span>
              </button>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-purple-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-purple-500" />
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* 基本統計 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">メインデッキ</h4>
              <div className="text-lg font-bold text-blue-700">{analysis.mainDeck.total}枚</div>
              <div className="text-xs text-blue-600">
                主要色: {analysis.mainDeck.dominantColors.map(getColorName).join(', ') || 'なし'}
              </div>
            </div>
            
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-indigo-900 mb-2">レイキデッキ</h4>
              <div className="text-lg font-bold text-indigo-700">{analysis.reikiDeck.total}枚</div>
              <div className="text-xs text-indigo-600">
                配置色: {analysis.reikiDeck.activeColors.map(getColorName).join(', ') || 'なし'}
              </div>
            </div>
          </div>
          
          {/* 色別アライメント */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>色別バランス分析</span>
            </h4>
            
            <div className="space-y-2">
              {analysis.integrated.colorAlignment
                .filter(alignment => alignment.mainCount > 0 || alignment.reikiCount > 0)
                .map(alignment => (
                <div key={alignment.color} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full ${getColorClass(alignment.color)}`}></div>
                      <span className="font-medium text-gray-900">{getColorName(alignment.color)}</span>
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <span>メイン: {alignment.mainCount}枚</span>
                        <span>•</span>
                        <span>レイキ: {alignment.reikiCount}枚</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {alignment.alignmentRatio > 0 && (
                        <span className="text-xs text-gray-500">
                          比率 {alignment.alignmentRatio.toFixed(1)}:1
                        </span>
                      )}
                      {alignment.isBalanced ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  </div>
                  
                  <div className={`text-xs ${getAlignmentColor(alignment)}`}>
                    {alignment.suggestion}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 推奨事項 */}
          {analysis.integrated.recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span>改善推奨</span>
              </h4>
              <div className="space-y-2">
                {analysis.integrated.recommendations.map((recommendation, index) => (
                  <div key={index} className="bg-blue-50 border border-blue-200 rounded p-2">
                    <div className="text-sm text-blue-800">{recommendation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* リスク要因 */}
          {analysis.integrated.riskFactors.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span>リスク要因</span>
              </h4>
              <div className="space-y-2">
                {analysis.integrated.riskFactors.map((risk, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded p-2">
                    <div className="text-sm text-red-800">{risk}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* スコア詳細説明 */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">スコア評価基準</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>• 80-100点: 優秀なバランス - 安定した戦術が期待できます</div>
              <div>• 60-79点: 良好なバランス - 軽微な調整でさらに向上します</div>
              <div>• 60点未満: 改善が必要 - 色バランスの見直しを推奨します</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default IntegratedAnalysis