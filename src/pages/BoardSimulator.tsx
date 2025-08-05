import React, { useState } from 'react';
import { useCardDB } from '@/hooks/useCardDB';
import { REIKI_IMAGE_PATHS, REIKI_COLOR_NAMES } from '@/utils/reikiAssets';
import type { ReikiColor } from '@/types/reiki';
import type { Card } from '@/types/card';

type CardType = 'main' | 'reiki';

interface PlacedCard {
  id: string;
  card?: Card;
  reikiData?: {
    color: ReikiColor;
    name: string;
    imageUrl: string;
  };
  position: string;
}

const BoardSimulator: React.FC = () => {
  const [selectedCardType, setSelectedCardType] = useState<CardType>('main');
  const [placedCards, setPlacedCards] = useState<PlacedCard[]>([]);
  const { cards, loading, error } = useCardDB();
  
  const reikiColors: ReikiColor[] = ['red', 'blue', 'green', 'yellow'];

  const handleCardDrop = (position: string, data: any) => {
    const newCard: PlacedCard = {
      id: `${position}-${Date.now()}`,
      position,
      ...(data.type === 'main-card' 
        ? { card: data.card }
        : { reikiData: { color: data.color, name: data.name, imageUrl: data.imageUrl } }
      )
    };
    
    setPlacedCards(prev => [...prev, newCard]);
    console.log('✅ カード配置:', newCard);
  };

  const getCardsInPosition = (position: string) => {
    return placedCards.filter(card => card.position === position);
  };

  const DropZone: React.FC<{
    position: string;
    label: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    hoverBg: string;
    hoverBorder: string;
  }> = ({ position, label, bgColor, borderColor, textColor, hoverBg, hoverBorder }) => {
    const cardsInThisPosition = getCardsInPosition(position);
    
    return (
      <div 
        className={`${bgColor} border ${borderColor} rounded flex flex-col items-center justify-center min-h-[60px] relative transition-colors hover:${hoverBg} p-1`}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
          e.currentTarget.classList.add(hoverBg.replace('hover:', ''), hoverBorder, 'shadow-lg');
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove(hoverBg.replace('hover:', ''), hoverBorder, 'shadow-lg');
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove(hoverBg.replace('hover:', ''), hoverBorder, 'shadow-lg');
          try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            handleCardDrop(position, data);
          } catch (error) {
            console.error('❌ ドロップデータ解析エラー:', error);
          }
        }}
      >
        {cardsInThisPosition.length === 0 ? (
          <span className={`text-xs ${textColor} pointer-events-none`}>{label}</span>
        ) : (
          <div className="flex flex-wrap gap-1 w-full h-full overflow-hidden">
            {cardsInThisPosition.map((placedCard, index) => (
              <div key={placedCard.id} className="w-8 h-8 relative">
                <img
                  src={placedCard.card?.imageUrl || placedCard.reikiData?.imageUrl || ''}
                  alt={placedCard.card?.name || placedCard.reikiData?.name || ''}
                  className="w-full h-full object-cover rounded border"
                  style={{ zIndex: index }}
                />
              </div>
            ))}
          </div>
        )}
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

      {/* メインレイアウト：左側プレイマット、右側手札エリア */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-4 gap-4 h-[700px]">
          
          {/* 左側：プレイマット（3/4幅） */}
          <div className="col-span-3 bg-white border-2 border-gray-300 rounded-lg p-4 relative">
            {/* 相手エリア表示 */}
            <div className="absolute top-2 left-2 bg-red-200 text-red-800 px-2 py-1 rounded text-xs font-semibold z-10">
              相手
            </div>
            
            <div className="h-full grid grid-rows-[1fr_1.3fr_1.3fr_1fr_1.3fr_1.3fr_1fr] gap-2">
              
              {/* 上段：サポーター・イベント、レイキエリア */}
              <div className="grid grid-cols-5 gap-2">
                <div className="col-span-2">
                  <DropZone
                    position="opponent-reiki"
                    label="レイキエリア"
                    bgColor="bg-red-100"
                    borderColor="border-red-300"
                    textColor="text-red-600"
                    hoverBg="bg-red-200"
                    hoverBorder="border-red-400"
                  />
                </div>
                <div className="col-span-3">
                  <DropZone
                    position="opponent-support"
                    label="サポーター・イベントエリア"
                    bgColor="bg-red-200"
                    borderColor="border-red-400"
                    textColor="text-red-700"
                    hoverBg="bg-red-300"
                    hoverBorder="border-red-500"
                  />
                </div>
              </div>

              {/* ゲージエリア（縦30%増・アタックエリアに幅統一） */}
              <div className="flex justify-center">
                <div className="grid grid-cols-3 gap-4 w-[70%]">
                  <DropZone
                    position="opponent-gauge-3"
                    label="ゲージ3"
                    bgColor="bg-red-50"
                    borderColor="border-red-200"
                    textColor="text-red-500"
                    hoverBg="bg-red-100"
                    hoverBorder="border-red-300"
                  />
                  <DropZone
                    position="opponent-gauge-2"
                    label="ゲージ2"
                    bgColor="bg-red-50"
                    borderColor="border-red-200"
                    textColor="text-red-500"
                    hoverBg="bg-red-100"
                    hoverBorder="border-red-300"
                  />
                  <DropZone
                    position="opponent-gauge-1"
                    label="ゲージ1"
                    bgColor="bg-red-50"
                    borderColor="border-red-200"
                    textColor="text-red-500"
                    hoverBg="bg-red-100"
                    hoverBorder="border-red-300"
                  />
                </div>
              </div>

              {/* アタックエリア（縦30%増・横30%短縮・間隔2倍） */}
              <div className="flex justify-center">
                <div className="grid grid-cols-3 gap-4 w-[70%]">
                  <DropZone
                    position="opponent-attack-3"
                    label="アタック3"
                    bgColor="bg-red-100"
                    borderColor="border-red-300"
                    textColor="text-red-600"
                    hoverBg="bg-red-200"
                    hoverBorder="border-red-400"
                  />
                  <DropZone
                    position="opponent-attack-2"
                    label="アタック2"
                    bgColor="bg-red-100"
                    borderColor="border-red-300"
                    textColor="text-red-600"
                    hoverBg="bg-red-200"
                    hoverBorder="border-red-400"
                  />
                  <DropZone
                    position="opponent-attack-1"
                    label="アタック1"
                    bgColor="bg-red-100"
                    borderColor="border-red-300"
                    textColor="text-red-600"
                    hoverBg="bg-red-200"
                    hoverBorder="border-red-400"
                  />
                </div>
              </div>

              {/* 共有拠点エリア（境界線上・アタックエリアに幅統一） */}
              <div className="flex justify-center border-t-2 border-b-2 border-gray-400 bg-yellow-50 py-2">
                <div className="grid grid-cols-3 gap-4 w-[70%]">
                  <DropZone
                    position="base-1"
                    label="拠点1"
                    bgColor="bg-yellow-200"
                    borderColor="border-yellow-400"
                    textColor="text-yellow-800"
                    hoverBg="bg-yellow-300"
                    hoverBorder="border-yellow-500"
                  />
                  <DropZone
                    position="base-2"
                    label="拠点2"
                    bgColor="bg-yellow-200"
                    borderColor="border-yellow-400"
                    textColor="text-yellow-800"
                    hoverBg="bg-yellow-300"
                    hoverBorder="border-yellow-500"
                  />
                  <DropZone
                    position="base-3"
                    label="拠点3"
                    bgColor="bg-yellow-200"
                    borderColor="border-yellow-400"
                    textColor="text-yellow-800"
                    hoverBg="bg-yellow-300"
                    hoverBorder="border-yellow-500"
                  />
                </div>
              </div>

              {/* アタックエリア（縦30%増・横30%短縮・間隔2倍） */}
              <div className="flex justify-center">
                <div className="grid grid-cols-3 gap-4 w-[70%]">
                  <DropZone
                    position="player-attack-1"
                    label="アタック1"
                    bgColor="bg-blue-100"
                    borderColor="border-blue-300"
                    textColor="text-blue-600"
                    hoverBg="bg-blue-200"
                    hoverBorder="border-blue-400"
                  />
                  <DropZone
                    position="player-attack-2"
                    label="アタック2"
                    bgColor="bg-blue-100"
                    borderColor="border-blue-300"
                    textColor="text-blue-600"
                    hoverBg="bg-blue-200"
                    hoverBorder="border-blue-400"
                  />
                  <DropZone
                    position="player-attack-3"
                    label="アタック3"
                    bgColor="bg-blue-100"
                    borderColor="border-blue-300"
                    textColor="text-blue-600"
                    hoverBg="bg-blue-200"
                    hoverBorder="border-blue-400"
                  />
                </div>
              </div>

              {/* ゲージエリア（縦30%増・アタックエリアに幅統一） */}
              <div className="flex justify-center">
                <div className="grid grid-cols-3 gap-4 w-[70%]">
                  <DropZone
                    position="player-gauge-1"
                    label="ゲージ1"
                    bgColor="bg-blue-50"
                    borderColor="border-blue-200"
                    textColor="text-blue-500"
                    hoverBg="bg-blue-100"
                    hoverBorder="border-blue-300"
                  />
                  <DropZone
                    position="player-gauge-2"
                    label="ゲージ2"
                    bgColor="bg-blue-50"
                    borderColor="border-blue-200"
                    textColor="text-blue-500"
                    hoverBg="bg-blue-100"
                    hoverBorder="border-blue-300"
                  />
                  <DropZone
                    position="player-gauge-3"
                    label="ゲージ3"
                    bgColor="bg-blue-50"
                    borderColor="border-blue-200"
                    textColor="text-blue-500"
                    hoverBg="bg-blue-100"
                    hoverBorder="border-blue-300"
                  />
                </div>
              </div>

              {/* 自分のサポーター・イベント、レイキエリア */}
              <div className="grid grid-cols-5 gap-2">
                <div className="col-span-3">
                  <DropZone
                    position="player-support"
                    label="サポーター・イベントエリア"
                    bgColor="bg-blue-200"
                    borderColor="border-blue-400"
                    textColor="text-blue-700"
                    hoverBg="bg-blue-300"
                    hoverBorder="border-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <DropZone
                    position="player-reiki"
                    label="レイキエリア"
                    bgColor="bg-blue-100"
                    borderColor="border-blue-300"
                    textColor="text-blue-600"
                    hoverBg="bg-blue-200"
                    hoverBorder="border-blue-400"
                  />
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