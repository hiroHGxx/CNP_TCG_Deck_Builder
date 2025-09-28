import React, { useState } from 'react'
import { useConvexDecks } from '../hooks/useConvexDecks'
import { ConvexIntegration } from './ConvexIntegration'

/**
 * Convex統合テストコンポーネント
 * 基本的なCRUD操作をテストする
 */
export const ConvexTest: React.FC = () => {
  const { decks, isLoading, saveDeck, deleteDeck, migrateLocalDecks } = useConvexDecks()
  const [testDeckName, setTestDeckName] = useState('テストデッキ')
  const [message, setMessage] = useState('')

  const handleCreateTestDeck = async () => {
    setMessage('デッキ作成中...')
    
    const result = await saveDeck({
      name: testDeckName,
      description: 'Convex動作テスト用デッキ',
      mainCards: {
        'BT1-001': 4,
        'BT1-002': 3,
        'BT1-003': 2,
      },
      reikiCards: [
        { color: 'red', count: 5 },
        { color: 'blue', count: 3 },
      ],
      tags: ['テスト', 'Convex'],
      isPublic: false
    })

    if (result.success) {
      setMessage(`✅ デッキ作成成功！ID: ${result.deckId}`)
    } else {
      setMessage(`❌ デッキ作成失敗: ${result.error}`)
    }
  }

  const handleMigrationTest = async () => {
    setMessage('ローカルデッキ移行中...')
    
    const result = await migrateLocalDecks()
    
    if (result.success) {
      setMessage(`✅ 移行成功: ${result.message}`)
    } else {
      setMessage(`❌ 移行失敗: ${result.error}`)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">🔄 Convex接続中...</h3>
        <p>データベースに接続しています</p>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">🧪 Convex動作テスト</h3>
      
      {/* 接続状況 */}
      <div className="mb-4 p-3 bg-green-100 rounded">
        <p className="text-green-800">
          ✅ Convex接続成功！現在のデッキ数: {decks?.length || 0}
        </p>
      </div>

      {/* テスト操作 */}
      <div className="space-y-4">
        <div>
          <input
            type="text"
            value={testDeckName}
            onChange={(e) => setTestDeckName(e.target.value)}
            className="border rounded px-3 py-2 mr-2"
            placeholder="テストデッキ名"
          />
          <button
            onClick={handleCreateTestDeck}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            テストデッキ作成
          </button>
        </div>

        <div>
          <button
            onClick={handleMigrationTest}
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
          >
            ローカルデッキ移行テスト
          </button>
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className="p-3 bg-yellow-100 rounded">
            <p>{message}</p>
          </div>
        )}

        {/* デッキ一覧表示 */}
        {decks && decks.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold mb-2">📋 保存済みデッキ:</h4>
            <div className="space-y-2">
              {decks.map((deck) => (
                <div key={deck._id} className="p-3 bg-white rounded border">
                  <div className="flex justify-between items-center">
                    <div>
                      <h5 className="font-medium">{deck.name}</h5>
                      <p className="text-sm text-gray-600">
                        メイン: {deck.totalMainCards}枚 | レイキ: {deck.totalReikiCards}枚
                      </p>
                    </div>
                    <button
                      onClick={() => deleteDeck(deck._id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 統合管理UI */}
      <div className="mt-8">
        <ConvexIntegration />
      </div>
    </div>
  )
}