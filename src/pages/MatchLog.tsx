import React from 'react'

const MatchLog: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Match Log</h1>
        <button className="btn-primary">
          + Add Match
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600">
          戦績ログ機能を実装中...
        </p>
        <div className="mt-4 space-y-2">
          <div className="text-sm text-gray-500">実装予定機能:</div>
          <ul className="text-sm text-gray-600 space-y-1 ml-4">
            <li>• 試合結果の記録</li>
            <li>• 対戦相手・使用デッキ管理</li>
            <li>• 勝敗統計</li>
            <li>• メモ・コメント機能</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default MatchLog