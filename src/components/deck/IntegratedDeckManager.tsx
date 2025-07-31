import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { Save, FolderOpen, Trash2, Download, Upload } from 'lucide-react'
import { useDeckStore } from '@/stores/deckStore'
import { useReikiStore } from '@/stores/reikiStore'
import type { Deck } from '@/types/card'

interface IntegratedDeckManagerProps {}

const IntegratedDeckManager: React.FC<IntegratedDeckManagerProps> = () => {
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ type: string; deckId: string; deckName: string } | null>(null)
  
  const { 
    currentDeck,
    saveIntegratedDeck, 
    loadIntegratedDeck, 
    deleteIntegratedDeck, 
    getIntegratedDecks,
    setDeckName,
    clearDeck,
    setCardCount
  } = useDeckStore()
  
  const { cards: reikiCards, clear: clearReiki, setColor } = useReikiStore()
  
  const savedDecks = getIntegratedDecks().sort((a, b) => {
    // updatedAtまたはcreatedAtで降順ソート（最新が上）
    const dateA = new Date(a.updatedAt || a.createdAt).getTime()
    const dateB = new Date(b.updatedAt || b.createdAt).getTime()
    return dateB - dateA
  })

  const handleSave = () => {
    // 既存デッキかチェック
    const existingDeck = savedDecks.find(deck => deck.name === currentDeck.name)
    const isUpdate = !!existingDeck
    
    saveIntegratedDeck(reikiCards)
    
    if (isUpdate) {
      alert(`デッキ「${currentDeck.name}」を上書き保存しました！`)
    } else {
      alert(`デッキ「${currentDeck.name}」を新規保存しました！`)
    }
  }

  const handleLoad = (deckId: string) => {
    const result = loadIntegratedDeck(deckId)
    if (result.success && result.reikiCards) {
      // レイキストアにデータを復元
      clearReiki()
      result.reikiCards.forEach(reikiCard => {
        setColor(reikiCard.color, reikiCard.count)
      })
      
      const deck = savedDecks.find(d => d.deckId === deckId)
      alert(`デッキ「${deck?.name}」を読み込みました！`)
    } else {
      alert('デッキの読み込みに失敗しました')
    }
  }

  const handleDelete = (deckId: string, deckName: string) => {
    setConfirmAction({ type: 'delete', deckId, deckName })
    setShowConfirm(true)
  }

  const executeConfirmAction = () => {
    if (confirmAction?.type === 'delete') {
      deleteIntegratedDeck(confirmAction.deckId)
      alert(`デッキ「${confirmAction.deckName}」を削除しました`)
    }
    setShowConfirm(false)
    setConfirmAction(null)
  }

  const handleExport = (deck: Deck, format: 'json' | 'text' = 'json') => {
    if (format === 'json') {
      const exportData = {
        name: deck.name,
        mainCards: deck.mainCards,
        reikiCards: deck.reikiCards,
        version: deck.version,
        exportedAt: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${deck.name.replace(/[^a-zA-Z0-9]/g, '_')}_deck.json`
      a.click()
      URL.revokeObjectURL(url)
    } else if (format === 'text') {
      // テキスト形式でのエクスポート
      let textContent = `デッキ名: ${deck.name}\n`
      textContent += `作成日: ${new Date(deck.createdAt).toLocaleDateString('ja-JP')}\n`
      textContent += `バージョン: ${deck.version}\n\n`
      
      // メインデッキ
      textContent += `[メインデッキ - ${getMainCardCount(deck.mainCards)}枚]\n`
      Object.entries(deck.mainCards)
        .sort(([,a], [,b]) => b - a) // 枚数降順
        .forEach(([cardId, count]) => {
          textContent += `${count}枚 ${cardId}\n` // TODO: カード名取得
        })
      
      textContent += `\n[レイキデッキ - ${getReikiCardCount(deck.reikiCards)}枚]\n`
      deck.reikiCards.forEach(reikiCard => {
        if (reikiCard.count > 0) {
          const colorName = {
            red: '赤', blue: '青', green: '緑', yellow: '黄'
          }[reikiCard.color] || reikiCard.color
          textContent += `${reikiCard.count}枚 ${colorName}レイキ\n`
        }
      })
      
      const blob = new Blob([textContent], { type: 'text/plain; charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${deck.name.replace(/[^a-zA-Z0-9]/g, '_')}_deck.txt`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          try {
            const importData = JSON.parse(event.target?.result as string)
            
            // データ形式検証
            if (!importData.name || !importData.mainCards || !importData.reikiCards) {
              alert('無効なデッキファイル形式です')
              return
            }
            
            // デッキ名をインポート時刻付きで設定
            setDeckName(`${importData.name} (インポート)`)
            
            // 現在のデッキをクリア
            clearDeck()
            
            // インポートしたカードをセット
            Object.entries(importData.mainCards).forEach(([cardId, count]) => {
              if (typeof count === 'number' && count > 0) {
                setCardCount(cardId, count)
              }
            })
            
            // レイキデッキを復元
            if (importData.reikiCards) {
              clearReiki()
              importData.reikiCards.forEach((reikiCard: any) => {
                if (reikiCard.color && typeof reikiCard.count === 'number') {
                  setColor(reikiCard.color, reikiCard.count)
                }
              })
            }
            
            alert(`デッキ「${importData.name}」をインポートしました！`)
          } catch (error) {
            alert('ファイルの読み込みエラーが発生しました')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getMainCardCount = (mainCards: Record<string, number>) => {
    return Object.values(mainCards).reduce((sum, count) => sum + count, 0)
  }

  const getReikiCardCount = (reikiCards: any[]) => {
    return reikiCards.reduce((sum, card) => sum + card.count, 0)
  }

  return (
    <div className="space-y-6">
      {/* 現在のデッキを保存 */}
      <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
        <h3 className="font-semibold text-gray-900 mb-3">現在のデッキを保存</h3>
        
        <div className="space-y-3">
          <input
            type="text"
            value={currentDeck.name}
            onChange={(e) => setDeckName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="デッキ名を入力"
          />
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>保存</span>
            </button>
            <button
              onClick={handleImport}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center space-x-2"
              title="JSONファイルからデッキを読み込み"
            >
              <Upload className="h-4 w-4" />
              <span>読み込み</span>
            </button>
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          メイン: {Object.values(currentDeck.cards).reduce((sum, count) => sum + count, 0)}枚、
          レイキ: {reikiCards.reduce((sum, card) => sum + card.count, 0)}枚
        </div>
      </div>

      {/* 保存済みデッキ一覧 */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">
          保存済みデッキ ({savedDecks.length}個)
        </h3>
        
        {savedDecks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
            <FolderOpen className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p>保存されたデッキがありません</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {savedDecks.map((deck) => (
              <div key={deck.deckId} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{deck.name}</h4>
                    <div className="text-sm text-gray-600 mt-1">
                      メイン: {getMainCardCount(deck.mainCards)}枚、
                      レイキ: {getReikiCardCount(deck.reikiCards)}枚
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      作成: {formatDate(deck.createdAt)}
                      {deck.updatedAt !== deck.createdAt && (
                        <span> • 更新: {formatDate(deck.updatedAt)}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4 min-w-0">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleLoad(deck.deckId)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                        title="読み込み"
                      >
                        <FolderOpen className="h-4 w-4" />
                        <span>読込</span>
                      </button>
                      
                      <button
                        onClick={() => handleDelete(deck.deckId, deck.name)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                        title="削除"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>削除</span>
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleExport(deck, 'json')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs flex items-center space-x-1"
                        title="JSON形式でエクスポート"
                      >
                        <Download className="h-3 w-3" />
                        <span>JSON</span>
                      </button>
                      <button
                        onClick={() => handleExport(deck, 'text')}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center space-x-1"
                        title="テキスト形式でエクスポート"
                      >
                        <Download className="h-3 w-3" />
                        <span>TXT</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 確認ダイアログ - Portalを使用してbody直下にレンダリング */}
      {showConfirm && confirmAction && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          style={{ zIndex: 10000 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowConfirm(false)
            }
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">確認</h3>
            <p className="text-gray-700 mb-6">
              デッキ「{confirmAction.deckName}」を削除しますか？
              <br />
              <span className="text-sm text-red-600">この操作は取り消せません。</span>
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 py-2 px-4 rounded-md text-sm font-medium"
              >
                キャンセル
              </button>
              <button
                onClick={executeConfirmAction}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md text-sm font-medium"
              >
                削除する
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default IntegratedDeckManager