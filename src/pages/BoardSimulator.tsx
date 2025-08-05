import React from 'react';

const BoardSimulator: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* メインコンテナ */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* ページタイトル */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Board Simulator
          </h1>
          <p className="text-gray-600">
            ドラッグ&ドロップでCNP TCGの盤面を作成し、スクリーンショットで共有できます
          </p>
        </div>

        {/* 盤面エリア */}
        <div className="space-y-4">
          {/* 相手手札エリア */}
          <div className="w-full h-20 bg-red-50 border-2 border-red-200 rounded-lg flex items-center justify-center">
            <span className="text-red-600 font-medium">相手手札エリア</span>
          </div>

          {/* プレイマット */}
          <div className="w-full bg-white border-2 border-gray-300 rounded-lg p-6" style={{ height: '600px' }}>
            <div className="h-full grid grid-rows-4 gap-4">
              {/* 上段：トラッシュ・レイキ・デッキ */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-100 border border-gray-300 rounded flex items-center justify-center">
                  <span className="text-sm text-gray-600">トラッシュ</span>
                </div>
                <div className="bg-blue-100 border border-blue-300 rounded flex items-center justify-center">
                  <span className="text-sm text-blue-600">レイキエリア</span>
                </div>
                <div className="bg-green-100 border border-green-300 rounded flex items-center justify-center">
                  <span className="text-sm text-green-600">デッキ</span>
                </div>
              </div>

              {/* ゲージエリア */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-yellow-100 border border-yellow-300 rounded flex items-center justify-center">
                  <span className="text-sm text-yellow-600">ゲージ1</span>
                </div>
                <div className="bg-yellow-100 border border-yellow-300 rounded flex items-center justify-center">
                  <span className="text-sm text-yellow-600">ゲージ2</span>
                </div>
                <div className="bg-yellow-100 border border-yellow-300 rounded flex items-center justify-center">
                  <span className="text-sm text-yellow-600">ゲージ3</span>
                </div>
              </div>

              {/* ユニットエリア */}
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((slot) => (
                  <div
                    key={slot}
                    className="bg-purple-100 border border-purple-300 rounded flex items-center justify-center"
                  >
                    <span className="text-sm text-purple-600">ユニット{slot}</span>
                  </div>
                ))}
              </div>

              {/* サポーター・イベントエリア */}
              <div className="bg-orange-100 border border-orange-300 rounded flex items-center justify-center">
                <span className="text-sm text-orange-600">サポーター・イベントエリア</span>
              </div>
            </div>
          </div>

          {/* 自分手札エリア */}
          <div className="w-full h-20 bg-green-50 border-2 border-green-200 rounded-lg flex items-center justify-center">
            <span className="text-green-600 font-medium">自分手札エリア</span>
          </div>

          {/* カード選択エリア（プレースホルダー） */}
          <div className="w-full h-32 bg-blue-50 border-2 border-blue-200 rounded-lg flex items-center justify-center">
            <span className="text-blue-600 font-medium">カード選択エリア（Phase 2で実装予定）</span>
          </div>

          {/* 操作ボタン */}
          <div className="flex space-x-4 justify-center">
            <button
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              onClick={() => alert('クリア機能（Phase 4で実装予定）')}
            >
              クリア
            </button>
            <button
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              onClick={() => alert('スクリーンショット機能（Phase 5で実装予定）')}
            >
              スクリーンショット
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardSimulator;