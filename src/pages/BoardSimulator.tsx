import React, { useState } from 'react';
import { useCardDB } from '@/hooks/useCardDB';
import { REIKI_IMAGE_PATHS, REIKI_COLOR_NAMES } from '@/utils/reikiAssets';
import type { ReikiColor } from '@/types/reiki';
import type { Card } from '@/types/card';

type CardType = 'main' | 'reiki';

interface AreaInfo {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  shape?: 'circle' | 'rectangle';
}

interface PlacedCard {
  id: string;
  card?: Card;
  reikiData?: {
    color: ReikiColor;
    name: string;
    imageUrl: string;
  };
  x: number;
  y: number;
  areaId?: string; // どのエリアに配置されたかの情報（オプション）
}

const BoardSimulator: React.FC = () => {
  const [selectedCardType, setSelectedCardType] = useState<CardType>('main');
  const [placedCards, setPlacedCards] = useState<PlacedCard[]>([]);
  const { cards, loading, error } = useCardDB();
  
  const reikiColors: ReikiColor[] = ['red', 'blue', 'green', 'yellow'];

  // エリア情報定義（元のプレイマットレイアウトに基づく正確な配置）
  const playmartAreas: AreaInfo[] = [
    // 相手エリア（上段）：サポーター・イベント、レイキエリア
    { id: 'opponent-reiki', name: 'レイキ', x: 520, y: 30, width: 160, height: 60, color: 'bg-red-100 border-red-300' },
    { id: 'opponent-support', name: 'サポーター・イベント', x: 100, y: 30, width: 400, height: 60, color: 'bg-red-200 border-red-400' },
    
    // 相手ゲージエリア（横幅70%増加：80→136、左右に28px拡張）
    { id: 'opponent-gauge-1', name: 'ゲージ1', x: 452, y: 110, width: 136, height: 80, color: 'bg-red-50 border-red-200' },
    { id: 'opponent-gauge-2', name: 'ゲージ2', x: 282, y: 110, width: 136, height: 80, color: 'bg-red-50 border-red-200' },
    { id: 'opponent-gauge-3', name: 'ゲージ3', x: 112, y: 110, width: 136, height: 80, color: 'bg-red-50 border-red-200' },
    
    // 相手アタックエリア（ゲージと接続、縦幅20%増加：80→96、横幅80に戻す）
    { id: 'opponent-attack-1', name: 'アタック1', x: 480, y: 190, width: 80, height: 96, color: 'bg-red-100 border-red-300' },
    { id: 'opponent-attack-2', name: 'アタック2', x: 310, y: 190, width: 80, height: 96, color: 'bg-red-100 border-red-300' },
    { id: 'opponent-attack-3', name: 'アタック3', x: 140, y: 190, width: 80, height: 96, color: 'bg-red-100 border-red-300' },
    
    // 共有拠点エリア（中央境界線）- 80×80円形表示
    { id: 'base-1', name: '拠点1', x: 140, y: 300, width: 80, height: 80, color: 'bg-yellow-200 border-yellow-400', shape: 'circle' },
    { id: 'base-2', name: '拠点2', x: 310, y: 300, width: 80, height: 80, color: 'bg-yellow-200 border-yellow-400', shape: 'circle' },
    { id: 'base-3', name: '拠点3', x: 480, y: 300, width: 80, height: 80, color: 'bg-yellow-200 border-yellow-400', shape: 'circle' },
    
    // 自分アタックエリア（ゲージと接続、縦幅20%増加：80→96、横幅80に戻す）
    { id: 'player-attack-1', name: 'アタック1', x: 140, y: 394, width: 80, height: 96, color: 'bg-blue-100 border-blue-300' },
    { id: 'player-attack-2', name: 'アタック2', x: 310, y: 394, width: 80, height: 96, color: 'bg-blue-100 border-blue-300' },
    { id: 'player-attack-3', name: 'アタック3', x: 480, y: 394, width: 80, height: 96, color: 'bg-blue-100 border-blue-300' },
    
    // 自分ゲージエリア（アタックと接続、横幅70%増加：80→136）
    { id: 'player-gauge-1', name: 'ゲージ1', x: 112, y: 490, width: 136, height: 80, color: 'bg-blue-50 border-blue-200' },
    { id: 'player-gauge-2', name: 'ゲージ2', x: 282, y: 490, width: 136, height: 80, color: 'bg-blue-50 border-blue-200' },
    { id: 'player-gauge-3', name: 'ゲージ3', x: 452, y: 490, width: 136, height: 80, color: 'bg-blue-50 border-blue-200' },
    
    // 自分エリア（下段）：サポーター・イベント、レイキエリア
    { id: 'player-support', name: 'サポーター・イベント', x: 100, y: 610, width: 400, height: 60, color: 'bg-blue-200 border-blue-400' },
    { id: 'player-reiki', name: 'レイキ', x: 520, y: 610, width: 160, height: 60, color: 'bg-blue-100 border-blue-300' },
  ];

  // カードがどのエリアに配置されたかを判定する関数
  const getAreaFromPosition = (x: number, y: number): string | undefined => {
    for (const area of playmartAreas) {
      if (x >= area.x && x <= area.x + area.width &&
          y >= area.y && y <= area.y + area.height) {
        return area.id;
      }
    }
    return undefined; // どのエリアにも属さない場合
  };

  const handleCardDrop = (x: number, y: number, data: any) => {
    const areaId = getAreaFromPosition(x, y);
    
    const newCard: PlacedCard = {
      id: `card-${Date.now()}`,
      x,
      y,
      areaId, // エリア情報を追加
      ...(data.type === 'main-card' 
        ? { card: data.card }
        : { reikiData: { color: data.color, name: data.name, imageUrl: data.imageUrl } }
      )
    };
    
    setPlacedCards(prev => [...prev, newCard]);
    
    // エリア情報を含むログ出力
    const areaName = areaId ? playmartAreas.find(area => area.id === areaId)?.name : 'フリーエリア';
    console.log('✅ カード配置:', {
      ...newCard,
      areaName
    });
  };

  // 自由配置プレイマットコンポーネント（エリア背景付き）
  const FreeFormPlaymat: React.FC = () => {
    return (
      <div 
        className="w-full h-full bg-gray-50 border-2 border-gray-300 rounded-lg relative overflow-hidden"
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }}
        onDrop={(e) => {
          e.preventDefault();
          try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            handleCardDrop(x, y, data);
          } catch (error) {
            console.error('❌ ドロップデータ解析エラー:', error);
          }
        }}
      >
        {/* 中央分割線（拠点を通る点線）- エリアの下レイヤー */}
        <div 
          className="absolute pointer-events-none"
          style={{
            left: '10%',
            right: '10%',
            top: 340,
            height: 2,
            backgroundImage: 'repeating-linear-gradient(to right, #6b7280 0, #6b7280 8px, transparent 8px, transparent 16px)',
            zIndex: 5
          }}
        />

        {/* 相手・自分エリア表示テキスト */}
        <div 
          className="absolute left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded text-xs font-semibold text-red-600 pointer-events-none" 
          style={{ top: 320, zIndex: 15 }}
        >
          相手
        </div>
        <div 
          className="absolute left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded text-xs font-semibold text-blue-600 pointer-events-none" 
          style={{ top: 385, zIndex: 15 }}
        >
          自分
        </div>

        {/* エリア背景描画 */}
        {playmartAreas.map((area) => (
          <div
            key={area.id}
            className={`absolute border-2 ${area.color} opacity-60 pointer-events-none ${
              area.shape === 'circle' ? 'rounded-full' : 'rounded-lg'
            }`}
            style={{
              left: area.x,
              top: area.y,
              width: area.width,
              height: area.height,
              zIndex: area.shape === 'circle' ? 10 : 8, // 拠点を点線より上に
              ...(area.shape === 'circle' ? {
                // 二重丸効果のためのボックスシャドウ
                boxShadow: `inset 0 0 0 3px ${area.color.includes('yellow-200') ? '#fbbf24' : '#ffffff'}`
              } : {})
            }}
          >
            {/* エリア名表示 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-700 text-center px-1">
                {area.name}
              </span>
            </div>
          </div>
        ))}

        {/* 配置されたカードの表示 */}
        {placedCards.map((placedCard) => (
          <div
            key={placedCard.id}
            className="absolute w-16 h-20 border-2 border-white rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            style={{
              left: placedCard.x - 32, // カード幅の半分だけオフセット
              top: placedCard.y - 40,  // カード高さの半分だけオフセット
              zIndex: 30
            }}
            onClick={() => {
              // カード削除機能（クリックで削除）
              setPlacedCards(prev => prev.filter(card => card.id !== placedCard.id));
            }}
            title={`${placedCard.card?.name || placedCard.reikiData?.name || ''} | エリア: ${
              placedCard.areaId ? playmartAreas.find(area => area.id === placedCard.areaId)?.name : 'フリーエリア'
            } | クリックで削除`}
          >
            <img
              src={placedCard.card?.imageUrl || placedCard.reikiData?.imageUrl || ''}
              alt={placedCard.card?.name || placedCard.reikiData?.name || ''}
              className="w-full h-full object-cover rounded-lg"
            />
            {/* カード名表示 */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 rounded-b-lg">
              <div className="truncate">
                {placedCard.card?.name || placedCard.reikiData?.name || ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
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

      {/* メインレイアウト：自由配置プレイマット */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-[700px]">
          <FreeFormPlaymat />
        </div>

        {/* 下部：カード選択エリアと操作ボタン */}
        <div className="mt-4 space-y-4">
          {/* カードスライダー - タブ付き */}
          <div className="w-full bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
            {/* カードタイプ切り替えタブ */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setSelectedCardType('main')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  selectedCardType === 'main'
                    ? 'bg-blue-500 text-white border-b-2 border-blue-600'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                メインカード
              </button>
              <button
                onClick={() => setSelectedCardType('reiki')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  selectedCardType === 'reiki'
                    ? 'bg-yellow-500 text-white border-b-2 border-yellow-600'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                レイキカード
              </button>
            </div>

            {/* カード一覧エリア */}
            <div className="p-4 h-40 bg-gray-50">
              {selectedCardType === 'main' ? (
                <div className="h-full">
                  {loading ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <span>カード読み込み中...</span>
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center h-full text-red-500">
                      <span>カード読み込みエラー</span>
                    </div>
                  ) : (
                    <div className="h-full overflow-x-auto">
                      <div className="flex space-x-2 h-full">
                        {cards.map((card) => (
                          <div
                            key={card.cardId}
                            className="flex-shrink-0 w-20 h-full bg-white border border-gray-300 rounded-lg p-1 hover:shadow-md hover:border-blue-400 transition-all cursor-grab active:cursor-grabbing"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('application/json', JSON.stringify({
                                type: 'main-card',
                                card: card
                              }));
                              e.dataTransfer.effectAllowed = 'copy';
                            }}
                            title={`${card.name} - コスト:${card.cost} BP:${card.bp || 'なし'}`}
                          >
                            <div className="w-full h-16 mb-1 rounded overflow-hidden">
                              <img
                                src={card.imageUrl}
                                alt={card.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                            <div className="text-xs text-center truncate">
                              {card.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full overflow-x-auto">
                  <div className="flex space-x-4 h-full items-center justify-center">
                    {reikiColors.map((color) => (
                      <div
                        key={color}
                        className="flex-shrink-0 w-20 h-full bg-white border border-gray-300 rounded-lg p-2 hover:shadow-md hover:border-yellow-400 transition-all cursor-grab active:cursor-grabbing"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/json', JSON.stringify({
                            type: 'reiki-card',
                            color: color,
                            name: REIKI_COLOR_NAMES[color],
                            imageUrl: REIKI_IMAGE_PATHS[color]
                          }));
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        title={`${REIKI_COLOR_NAMES[color]} - レイキカード`}
                      >
                        <div className="w-full h-16 mb-2 rounded overflow-hidden">
                          <img
                            src={REIKI_IMAGE_PATHS[color]}
                            alt={REIKI_COLOR_NAMES[color]}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="text-xs text-center">
                          {REIKI_COLOR_NAMES[color]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 操作ボタンとエリア統計 */}
          <div className="space-y-4 pb-4">
            {/* エリア別統計 */}
            {placedCards.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">配置状況</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  {Object.entries(
                    placedCards.reduce((acc, card) => {
                      const areaName = card.areaId 
                        ? playmartAreas.find(area => area.id === card.areaId)?.name || 'フリーエリア'
                        : 'フリーエリア';
                      acc[areaName] = (acc[areaName] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([areaName, count]) => (
                    <div key={areaName} className="bg-gray-50 px-2 py-1 rounded">
                      <span className="font-medium">{areaName}:</span> {count}枚
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 操作ボタン */}
            <div className="flex space-x-4 justify-center">
              <button
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  if (confirm('すべてのカードをクリアしますか？')) {
                    setPlacedCards([]);
                  }
                }}
                disabled={placedCards.length === 0}
              >
                すべてクリア ({placedCards.length}枚)
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
    </div>
  );
};

export default BoardSimulator;