import React from 'react'

const DeckBuilder: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Deck Builder</h1>
        <div className="text-sm text-gray-500">
          116 cards available
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600">
          デッキビルダー機能を実装中...
        </p>
        <div className="mt-4 space-y-2">
          <div className="text-sm text-gray-500">実装予定機能:</div>
          <ul className="text-sm text-gray-600 space-y-1 ml-4">
            <li>• カード検索・フィルタ</li>
            <li>• ドラッグ&ドロップでデッキ構築</li>
            <li>• カード詳細モーダル</li>
            <li>• デッキバリデーション</li>
            <li>• ローカル保存</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default DeckBuilder