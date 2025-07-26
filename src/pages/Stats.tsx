import React from 'react'

const Stats: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Statistics</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">総戦績</h3>
          <p className="text-gray-600">
            統計機能を実装中...
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">勝率</h3>
          <p className="text-gray-600">
            勝率チャートを実装中...
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">デッキ別成績</h3>
          <p className="text-gray-600">
            デッキ分析を実装中...
          </p>
        </div>
      </div>
    </div>
  )
}

export default Stats