import React, { useState } from 'react'
import { useConvexDecks } from '../hooks/useConvexDecks'
import { useConvexDeckStore } from '../stores/convexDeckStore'
import { useDeckStore } from '../stores/deckStore' // 既存のデッキストア
import { useReikiStore } from '../stores/reikiStore'

/**
 * Convex統合管理コンポーネント
 * 既存のローカルストレージとサーバーストレージの統合UI
 */
export const ConvexIntegration: React.FC = () => {
  const { decks, saveDeck, isLoading } = useConvexDecks()
  const { 
    useServerStorage, 
    enableServerStorage, 
    disableServerStorage,
    migrateCurrentDeckToServer 
  } = useConvexDeckStore()
  
  // 既存のメインデッキストアから現在のデッキを取得
  const { currentDeck } = useDeckStore()
  const { cards: reikiCards } = useReikiStore()
  
  const [message, setMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleEnableServerStorage = () => {
    enableServerStorage()
    setMessage('✅ サーバー保存を有効にしました')
  }

  const handleDisableServerStorage = () => {
    disableServerStorage()
    setMessage('📱 ローカル保存に戻しました')
  }

  const handleSaveCurrentDeck = async () => {
    if (!currentDeck.name) {
      setMessage('❌ デッキ名を入力してください')
      return
    }

    setIsProcessing(true)
    setMessage('💾 デッキをサーバーに保存中...')

    try {
      const result = await saveDeck({
        name: currentDeck.name,
        description: `統合デッキ - ${new Date().toLocaleDateString()}`,
        mainCards: currentDeck.cards,
        reikiCards: reikiCards.map(card => ({
          color: card.color,
          count: card.count
        })),
        tags: ['統合保存'],
        isPublic: false
      })

      if (result.success) {
        setMessage(`✅ デッキ保存成功！ID: ${result.deckId}`)
        enableServerStorage()
      } else {
        setMessage(`❌ 保存失敗: ${result.error}`)
      }
    } catch (error) {
      setMessage(`❌ エラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMigrateToDeck = async () => {
    if (!currentDeck.name) {
      setMessage('❌ デッキ名を入力してください')
      return
    }

    setIsProcessing(true)
    setMessage('🔄 現在のデッキをサーバーに移行中...')

    const result = await migrateCurrentDeckToServer(reikiCards)

    if (result.success) {
      setMessage(`✅ 移行成功！サーバー保存を有効にしました`)
    } else {
      setMessage(`❌ 移行失敗: ${result.error}`)
    }

    setIsProcessing(false)
  }

  const totalMainCards = Object.values(currentDeck.cards).reduce((sum, count) => sum + count, 0)
  const totalReikiCards = reikiCards.reduce((sum, card) => sum + card.count, 0)
  const hasValidDeck = totalMainCards > 0 || totalReikiCards > 0

  return (
    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        🔗 デッキ保存統合管理
        {useServerStorage && <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">サーバー保存</span>}
        {!useServerStorage && <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">ローカル保存</span>}
      </h3>

      {/* 現在のデッキ状況 */}
      <div className="mb-4 p-3 bg-white rounded border">
        <h4 className="font-medium mb-2">📋 現在のデッキ状況</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">デッキ名:</span>
            <div className="font-medium">{currentDeck.name || '未設定'}</div>
          </div>
          <div>
            <span className="text-gray-600">メインカード:</span>
            <div className="font-medium">{totalMainCards}/50枚</div>
          </div>
          <div>
            <span className="text-gray-600">レイキカード:</span>
            <div className="font-medium">{totalReikiCards}/15枚</div>
          </div>
          <div>
            <span className="text-gray-600">保存先:</span>
            <div className="font-medium">{useServerStorage ? 'サーバー' : 'ローカル'}</div>
          </div>
        </div>
      </div>

      {/* 操作ボタン */}
      <div className="space-y-3">
        {!useServerStorage ? (
          <div className="space-y-2">
            <button
              onClick={handleEnableServerStorage}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              🚀 サーバー保存を有効にする
            </button>
            
            {hasValidDeck && (
              <button
                onClick={handleMigrateToDeck}
                disabled={isProcessing || !currentDeck.name}
                className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? '🔄 移行中...' : '📤 現在のデッキをサーバーに移行'}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {hasValidDeck && (
              <button
                onClick={handleSaveCurrentDeck}
                disabled={isProcessing || !currentDeck.name}
                className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? '💾 保存中...' : '💾 サーバーに保存'}
              </button>
            )}
            
            <button
              onClick={handleDisableServerStorage}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
            >
              📱 ローカル保存に戻す
            </button>
          </div>
        )}
      </div>

      {/* サーバー上のデッキ一覧 */}
      {useServerStorage && !isLoading && decks && decks.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium mb-2">☁️ サーバー保存済みデッキ ({decks.length}個)</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {decks.map((deck) => (
              <div key={deck._id} className="p-2 bg-white rounded border text-sm">
                <div className="font-medium">{deck.name}</div>
                <div className="text-gray-600">
                  メイン: {deck.totalMainCards}枚 | レイキ: {deck.totalReikiCards}枚 | 
                  作成: {new Date(deck.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* メッセージ表示 */}
      {message && (
        <div className="mt-4 p-3 bg-yellow-100 rounded border">
          <p className="text-sm">{message}</p>
        </div>
      )}

      {/* 説明 */}
      <div className="mt-4 p-3 bg-blue-100 rounded text-sm">
        <h5 className="font-medium mb-1">💡 統合機能について</h5>
        <ul className="text-blue-800 space-y-1">
          <li>• ローカル保存: ブラウザ内のみ（従来通り）</li>
          <li>• サーバー保存: クラウド保存・デバイス間同期</li>
          <li>• いつでも切り替え可能</li>
          <li>• 段階的移行サポート</li>
        </ul>
      </div>
    </div>
  )
}