import React, { useState, useEffect } from 'react'
import { Edit3, CheckCircle, AlertCircle, ChevronDown, ChevronUp, FolderOpen, HardDrive, Grid3X3, List, Cloud, Save } from 'lucide-react'
import { useDeckStore } from '@/stores/deckStore'
import { useReikiStore } from '@/stores/reikiStore'
import { useConvexDecks } from '@/hooks/useConvexDecks'
import { useConvexDeckStore } from '@/stores/convexDeckStore'
import { ReikiManager } from './ReikiManager'
import { SupportBPStats } from './SupportBPStats'
import IntegratedDeckManager from './IntegratedDeckManager'
import IntegratedAnalysis from './IntegratedAnalysis'
import type { Card } from '@/types/card'

export type ViewMode = 'list' | 'visual';

interface DeckSidebarProps {
  cards: Card[]
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

/**
 * 統合デッキサイドバー
 * メインデッキ + レイキデッキ + 統計を一元管理
 */
export const DeckSidebar: React.FC<DeckSidebarProps> = ({ cards, viewMode, onViewModeChange }) => {
  const { 
    currentDeck, 
    setDeckName, 
    getTotalCardCount, 
    removeCardFromDeck, 
    setCardCount, 
    clearDeck: clearMainDeck,
    hasLegacyDecks,
    migrateLegacyDecks,
    saveIntegratedDeck
  } = useDeckStore()
  const { getTotalCount: getReikiTotalCount, cards: reikiCards } = useReikiStore()
  
  // Convex統合
  const { decks, saveDeck: saveToConvex, isLoading, deleteDeck: deleteFromConvex } = useConvexDecks()
  const { useServerStorage, enableServerStorage, disableServerStorage } = useConvexDeckStore()
  
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState(currentDeck.name)
  const [showDeckManager, setShowDeckManager] = useState(false)
  const [showMigrationAlert, setShowMigrationAlert] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    mainDeck: true,
    reikiDeck: true,
    stats: false
  })
  
  const [expandedStats, setExpandedStats] = useState({
    colorDistribution: true,
    bpDistribution: false,
    costDistribution: false
  })
  
  // Convex状態
  const [convexMessage, setConvexMessage] = useState('')
  const [isConvexProcessing, setIsConvexProcessing] = useState(false)

  // デッキ統計計算
  const mainDeckCount = getTotalCardCount()
  const reikiDeckCount = getReikiTotalCount()
  const supportBPCount = Object.keys(currentDeck.cards).filter(cardId => 
    cards.find(c => c.cardId === cardId && c.supportBP !== null && c.supportBP > 0)
  ).length
  const completionRate = Math.round(((mainDeckCount + reikiDeckCount) / 65) * 100)
  const isValidDeck = mainDeckCount === 50 && reikiDeckCount === 15

  // デッキ内カード一覧（コスト順）
  const deckCardEntries = Object.entries(currentDeck.cards)
    .map(([cardId, count]) => {
      const card = cards.find(c => c.cardId === cardId)
      return card ? { card, count } : null
    })
    .filter((entry): entry is { card: Card; count: number } => entry !== null)
    .sort((a, b) => {
      if (a.card.cost !== b.card.cost) {
        return a.card.cost - b.card.cost
      }
      return a.card.name.localeCompare(b.card.name)
    })

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

  const handleNameEdit = () => {
    setEditName(currentDeck.name)
    setIsEditingName(true)
  }

  const handleNameSave = () => {
    setDeckName(editName.trim() || 'New Deck')
    setIsEditingName(false)
  }

  const handleNameCancel = () => {
    setEditName(currentDeck.name)
    setIsEditingName(false)
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const toggleStats = (stat: keyof typeof expandedStats) => {
    setExpandedStats(prev => ({
      ...prev,
      [stat]: !prev[stat]
    }))
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

  // v1.0デッキ移行チェック
  useEffect(() => {
    if (hasLegacyDecks()) {
      setShowMigrationAlert(true)
    }
  }, [hasLegacyDecks])

  const handleMigration = () => {
    const result = migrateLegacyDecks()
    if (result.migrated > 0) {
      alert(`${result.migrated}個のv1.0デッキをv2.0形式に移行しました！`)
    }
    if (result.errors.length > 0) {
      alert(`移行エラー: ${result.errors.join(', ')}`)
    }
    setShowMigrationAlert(false)
  }

  // Convex関数
  const handleToggleStorage = () => {
    if (useServerStorage) {
      disableServerStorage()
      setConvexMessage('📱 ローカル保存に切り替えました')
    } else {
      enableServerStorage()
      setConvexMessage('☁️ サーバー保存に切り替えました')
    }
    // 3秒後にメッセージを消去
    setTimeout(() => setConvexMessage(''), 3000)
  }

  const handleConvexSave = async () => {
    if (!currentDeck.name.trim()) {
      setConvexMessage('❌ デッキ名を入力してください')
      setTimeout(() => setConvexMessage(''), 3000)
      return
    }

    setIsConvexProcessing(true)
    setConvexMessage('💾 サーバーに保存中...')

    try {
      const result = await saveToConvex({
        name: currentDeck.name,
        description: `統合デッキ - ${new Date().toLocaleDateString()}`,
        mainCards: currentDeck.cards,
        reikiCards: reikiCards.map(card => ({
          color: card.color,
          count: card.count
        })),
        tags: ['統合サイドバー'],
        isPublic: false
      })

      if (result.success) {
        setConvexMessage(`✅ サーバー保存成功！`)
      } else {
        setConvexMessage(`❌ 保存失敗: ${result.error}`)
      }
    } catch (error) {
      setConvexMessage(`❌ エラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsConvexProcessing(false)
      setTimeout(() => setConvexMessage(''), 5000)
    }
  }

  const handleLocalSave = () => {
    const deckId = saveIntegratedDeck(reikiCards)
    setConvexMessage(`✅ ローカル保存完了 (ID: ${deckId})`)
    setTimeout(() => setConvexMessage(''), 3000)
  }

  return (
    <div className="space-y-4" data-testid="deck-sidebar">
      {/* v1.0デッキ移行アラート */}
      {showMigrationAlert && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <HardDrive className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-orange-800">デッキ形式の更新</h3>
          </div>
          <p className="text-sm text-orange-700 mb-3">
            古い形式のデッキが見つかりました。新しい統合デッキ形式（v2.0）に移行しますか？
          </p>
          <div className="flex space-x-2">
            <button
              onClick={handleMigration}
              className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm font-medium"
            >
              移行する
            </button>
            <button
              onClick={() => setShowMigrationAlert(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded text-sm font-medium"
            >
              後で
            </button>
          </div>
        </div>
      )}

      {/* ビューモード切り替え */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">表示モード</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => onViewModeChange('list')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-cnp-blue text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <List className="w-4 h-4" />
            <span>リスト</span>
          </button>
          <button
            onClick={() => onViewModeChange('visual')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'visual'
                ? 'bg-cnp-blue text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            <span>ビジュアル</span>
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {viewMode === 'list' ? 'カード一覧・編集モード' : 'トレカデッキ表示'}
        </div>
      </div>

      {/* デッキ統計 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-blue-900">デッキ統計</h3>
          {isValidDeck ? (
            <CheckCircle className="w-6 h-6 text-green-500" />
          ) : (
            <AlertCircle className="w-6 h-6 text-orange-500" />
          )}
        </div>
        
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
        
        {/* 統計グラフセクション */}
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

      {/* デッキ名編集 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-md font-semibold text-gray-900">デッキ名</h3>
        </div>
        
        <div className="p-4">
          <div className="mb-4">
            {isEditingName ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 text-lg font-semibold border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameSave()
                    if (e.key === 'Escape') handleNameCancel()
                  }}
                  autoFocus
                />
                <button
                  onClick={handleNameSave}
                  className="p-2 text-green-600 hover:text-green-700"
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900">{currentDeck.name}</h4>
                <button
                  onClick={handleNameEdit}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>


      {/* メインデッキ */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center space-x-2 cursor-pointer hover:text-blue-600 transition-colors flex-1"
              onClick={() => toggleSection('mainDeck')}
            >
              <h3 className="text-md font-semibold text-gray-900">メインデッキ</h3>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                {mainDeckCount}/50
              </span>
              {expandedSections.mainDeck ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </div>
            <button
              onClick={clearMainDeck}
              disabled={mainDeckCount === 0}
              className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              クリア
            </button>
          </div>
        </div>
        
        {expandedSections.mainDeck && (
          <div className="p-4">
            {deckCardEntries.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <div className="text-3xl mb-2">🃏</div>
                <p className="text-sm">カードを追加してください</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto" data-testid="main-deck-list">
                {deckCardEntries.map(({ card, count }) => (
                  <div key={card.cardId} className="flex items-center justify-between p-2 border border-gray-100 rounded hover:bg-gray-50">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getColorClass(card.color)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{card.name}</div>
                        <div className="text-xs text-gray-500">コスト {card.cost}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => removeCardFromDeck(card.cardId)}
                          className="w-6 h-6 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                        >
                          -
                        </button>
                        <span className="text-sm font-medium text-gray-900 w-6 text-center">{count}</span>
                        <button
                          onClick={() => setCardCount(card.cardId, count + 1)}
                          disabled={count >= 4}
                          className="w-6 h-6 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* レイキデッキ */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div 
          className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 cursor-pointer hover:from-purple-100 hover:to-pink-100 transition-colors"
          onClick={() => toggleSection('reikiDeck')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-md font-semibold text-purple-900">レイキデッキ</h3>
              <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                {reikiDeckCount}/15
              </span>
            </div>
            {expandedSections.reikiDeck ? (
              <ChevronUp className="w-4 h-4 text-purple-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-purple-500" />
            )}
          </div>
        </div>
        
        {expandedSections.reikiDeck && (
          <div className="p-4">
            <ReikiManager allCards={cards} />
          </div>
        )}
      </div>

      {/* 統計・分析 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div 
          className="px-4 py-3 border-b border-gray-200 bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
          onClick={() => toggleSection('stats')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-md font-semibold text-green-900">助太刀BP統計</h3>
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                {supportBPCount}種類
              </span>
            </div>
            {expandedSections.stats ? (
              <ChevronUp className="w-4 h-4 text-green-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-green-500" />
            )}
          </div>
        </div>
        
        {expandedSections.stats && (
          <div className="p-4">
            <SupportBPStats showDetails={true} />
          </div>
        )}
      </div>

      {/* 統合デッキ分析 */}
      <IntegratedAnalysis cards={cards} />

      {/* デッキ管理 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div 
          className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 cursor-pointer hover:from-gray-100 hover:to-blue-100 transition-colors"
          onClick={() => setShowDeckManager(!showDeckManager)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-5 w-5 text-blue-600" />
              <h3 className="text-md font-semibold text-blue-900">デッキ管理</h3>
            </div>
            {showDeckManager ? (
              <ChevronUp className="w-4 h-4 text-blue-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-blue-500" />
            )}
          </div>
        </div>
        
        {showDeckManager && (
          <div className="p-4">
            <IntegratedDeckManager />
          </div>
        )}
      </div>
    </div>
  )
}

export default DeckSidebar