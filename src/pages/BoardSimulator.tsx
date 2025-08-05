import React from 'react';

const BoardSimulator: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ページタイトル */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Board Simulator
          </h1>
          <p className="text-sm text-gray-600">
            ドラッグ&ドロップでCNP TCGの盤面を作成し、スクリーンショットで共有できます
          </p>
        </div>
      </div>

      {/* メインレイアウト：左側プレイマット、右側手札エリア */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-4 gap-4 h-[700px]">
          
          {/* 左側：プレイマット（3/4幅） */}
          <div className="col-span-3 bg-white border-2 border-gray-300 rounded-lg p-4 relative">
            {/* 相手エリア表示 */}
            <div className="absolute top-2 left-2 bg-red-200 text-red-800 px-2 py-1 rounded text-xs font-semibold z-10">
              相手
            </div>
            
            <div className="h-full grid grid-rows-7 gap-2">
              
              {/* 上段：サポーター・イベント、レイキエリア */}
              <div className="grid grid-cols-5 gap-2">
                <div className="col-span-2 bg-red-100 border border-red-300 rounded flex items-center justify-center">
                  <span className="text-xs text-red-600">レイキエリア</span>
                </div>
                <div className="col-span-3 bg-red-200 border border-red-400 rounded flex items-center justify-center">
                  <span className="text-xs text-red-700">サポーター・イベントエリア</span>
                </div>
              </div>

              {/* ゲージエリア */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-red-50 border border-red-200 rounded flex items-center justify-center">
                  <span className="text-xs text-red-500">ゲージ3</span>
                </div>
                <div className="bg-red-50 border border-red-200 rounded flex items-center justify-center">
                  <span className="text-xs text-red-500">ゲージ2</span>
                </div>
                <div className="bg-red-50 border border-red-200 rounded flex items-center justify-center">
                  <span className="text-xs text-red-500">ゲージ1</span>
                </div>
              </div>

              {/* アタックエリア */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-red-100 border border-red-300 rounded flex items-center justify-center">
                  <span className="text-xs text-red-600">アタック3</span>
                </div>
                <div className="bg-red-100 border border-red-300 rounded flex items-center justify-center">
                  <span className="text-xs text-red-600">アタック2</span>
                </div>
                <div className="bg-red-100 border border-red-300 rounded flex items-center justify-center">
                  <span className="text-xs text-red-600">アタック1</span>
                </div>
              </div>

              {/* 共有拠点エリア（境界線上） */}
              <div className="grid grid-cols-3 gap-2 border-t-2 border-b-2 border-gray-400 bg-yellow-50 py-2">
                <div className="bg-yellow-200 border-2 border-yellow-400 rounded flex items-center justify-center font-semibold">
                  <span className="text-sm text-yellow-800">拠点1</span>
                </div>
                <div className="bg-yellow-200 border-2 border-yellow-400 rounded flex items-center justify-center font-semibold">
                  <span className="text-sm text-yellow-800">拠点2</span>
                </div>
                <div className="bg-yellow-200 border-2 border-yellow-400 rounded flex items-center justify-center font-semibold">
                  <span className="text-sm text-yellow-800">拠点3</span>
                </div>
              </div>

              {/* アタックエリア */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-blue-100 border border-blue-300 rounded flex items-center justify-center">
                  <span className="text-xs text-blue-600">アタック1</span>
                </div>
                <div className="bg-blue-100 border border-blue-300 rounded flex items-center justify-center">
                  <span className="text-xs text-blue-600">アタック2</span>
                </div>
                <div className="bg-blue-100 border border-blue-300 rounded flex items-center justify-center">
                  <span className="text-xs text-blue-600">アタック3</span>
                </div>
              </div>

              {/* ゲージエリア */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-blue-50 border border-blue-200 rounded flex items-center justify-center">
                  <span className="text-xs text-blue-500">ゲージ1</span>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded flex items-center justify-center">
                  <span className="text-xs text-blue-500">ゲージ2</span>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded flex items-center justify-center">
                  <span className="text-xs text-blue-500">ゲージ3</span>
                </div>
              </div>

              {/* 自分のサポーター・イベント、レイキエリア */}
              <div className="grid grid-cols-5 gap-2">
                <div className="col-span-3 bg-blue-200 border border-blue-400 rounded flex items-center justify-center">
                  <span className="text-xs text-blue-700">サポーター・イベントエリア</span>
                </div>
                <div className="col-span-2 bg-blue-100 border border-blue-300 rounded flex items-center justify-center">
                  <span className="text-xs text-blue-600">レイキエリア</span>
                </div>
              </div>
            </div>

            {/* 自分エリア表示 */}
            <div className="absolute bottom-2 right-2 bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs font-semibold z-10">
              自分
            </div>
          </div>

          {/* 右側：手札エリア（1/4幅） */}
          <div className="col-span-1 space-y-4">
            
            {/* 相手手札エリア */}
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 h-[45%]">
              <h3 className="text-sm font-semibold text-red-700 mb-2">相手手札</h3>
              <div className="space-y-2">
                <div className="bg-red-100 border border-red-300 rounded p-2 h-16 flex items-center justify-center">
                  <span className="text-xs text-red-600">裏面カード</span>
                </div>
                <div className="bg-red-100 border border-red-300 rounded p-2 h-16 flex items-center justify-center">
                  <span className="text-xs text-red-600">裏面カード</span>
                </div>
                <div className="bg-red-100 border border-red-300 rounded p-2 h-16 flex items-center justify-center">
                  <span className="text-xs text-red-600">裏面カード</span>
                </div>
              </div>
            </div>

            {/* 自分手札エリア */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 h-[45%]">
              <h3 className="text-sm font-semibold text-blue-700 mb-2">自分手札</h3>
              <div className="space-y-2">
                <div className="bg-blue-100 border border-blue-300 rounded p-2 h-16 flex items-center justify-center">
                  <span className="text-xs text-blue-600">カード1</span>
                </div>
                <div className="bg-blue-100 border border-blue-300 rounded p-2 h-16 flex items-center justify-center">
                  <span className="text-xs text-blue-600">カード2</span>
                </div>
                <div className="bg-blue-100 border border-blue-300 rounded p-2 h-16 flex items-center justify-center">
                  <span className="text-xs text-blue-600">カード3</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 下部：カード選択エリアと操作ボタン */}
        <div className="mt-4 space-y-4">
          {/* カード選択エリア（プレースホルダー） */}
          <div className="w-full h-24 bg-green-50 border-2 border-green-200 rounded-lg flex items-center justify-center">
            <span className="text-green-600 font-medium">カード選択エリア（Phase 2で実装予定）</span>
          </div>

          {/* 操作ボタン */}
          <div className="flex space-x-4 justify-center pb-4">
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