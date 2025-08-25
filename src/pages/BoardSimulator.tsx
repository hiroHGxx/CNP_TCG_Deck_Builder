import React, { useState, useEffect } from 'react';
import { useCardDB } from '@/hooks/useCardDB';
import { REIKI_IMAGE_PATHS, REIKI_COLOR_NAMES } from '@/utils/reikiAssets';
import { GAUGE_IMAGE_PATHS, GAUGE_ROTATION, type GaugeOwner } from '@/utils/gaugeAssets';
// import type { ReikiColor } from '@/types/reiki'; // 一時的にコメントアウト - Vercel環境での型認識問題回避
import type { Card } from '@/types/card';

type CardType = 'main' | 'reiki';
type ReikiColorLocal = 'red' | 'blue' | 'green' | 'yellow' | 'purple';

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
    color: ReikiColorLocal;
    name: string;
    imageUrl: string;
    count?: number; // レイキカードの枚数管理用
  };
  gaugeData?: {
    owner: GaugeOwner;
    imageUrl: string;
    stackIndex: number; // ゲージエリア内での重なり順序
  };
  x: number;
  y: number;
  areaId?: string; // どのエリアに配置されたかの情報（オプション）
  isEnlarged?: boolean; // 拡大表示フラグ（配置後も維持）
  rotation?: number; // 回転角度（度単位、0, 90, 180, 270）
}

const BoardSimulator: React.FC = () => {
  const [selectedCardType, setSelectedCardType] = useState<CardType>('main');
  const [placedCards, setPlacedCards] = useState<PlacedCard[]>([]);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const { cards, loading, error } = useCardDB();
  
  // ゲージカード管理用の状態
  const [gaugeCounts, setGaugeCounts] = useState<Record<string, number>>({
    'player-gauge-1': 0,
    'player-gauge-2': 0,
    'player-gauge-3': 0,
    'opponent-gauge-1': 0,
    'opponent-gauge-2': 0,
    'opponent-gauge-3': 0,
  });
  
  // ドラッグ強制リセット用タイマー参照
  const dragResetTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // カスタムドラッグシステム用状態
  const [isDragMode, setIsDragMode] = useState(false);
  const [dragCurrentPos, setDragCurrentPos] = useState({ x: 0, y: 0 });
  
  // ダブルクリック判定用タイマー
  const clickTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isWaitingForDoubleClick, setIsWaitingForDoubleClick] = useState(false);
  
  // クリック情報保存用
  const pendingClickRef = React.useRef<{ cardId: string; event: { clientX: number; clientY: number } } | null>(null);
  
  const reikiColors: readonly ReikiColorLocal[] = ['red', 'blue', 'green', 'yellow', 'purple'] as const;

  // カスタムドラッグシステム：確実なドラッグ処理
  const startCustomDrag = (cardId: string, event: React.MouseEvent) => {
    console.log('🎯 カスタムドラッグ開始:', { cardId, x: event.clientX, y: event.clientY });
    
    // 既存のドラッグをクリア
    if (draggingCardId && dragResetTimerRef.current) {
      clearTimeout(dragResetTimerRef.current);
      dragResetTimerRef.current = null;
    }
    
    setDraggingCardId(cardId);
    setIsDragMode(true);
    setDragCurrentPos({ x: event.clientX, y: event.clientY });
    
    // 2秒後の強制リセット（保険）
    dragResetTimerRef.current = setTimeout(() => {
      console.log('⏰ カスタムドラッグタイムアウト - 強制リセット実行:', cardId);
      finishCustomDrag();
    }, 2000);
  };


  const finishCustomDrag = (targetEvent?: React.MouseEvent) => {
    if (!isDragMode || !draggingCardId) return;
    
    console.log('🏁 カスタムドラッグ終了:', { 
      cardId: draggingCardId,
      hasTarget: !!targetEvent,
      x: targetEvent?.clientX,
      y: targetEvent?.clientY 
    });
    
    // タイマークリア
    if (dragResetTimerRef.current) {
      clearTimeout(dragResetTimerRef.current);
      dragResetTimerRef.current = null;
    }
    
    // ドロップ先判定
    if (targetEvent) {
      // プレイマット要素を取得
      const playmapElement = document.querySelector('[data-playmat="true"]') as HTMLElement;
      if (playmapElement) {
        const rect = playmapElement.getBoundingClientRect();
        const x = targetEvent.clientX - rect.left;
        const y = targetEvent.clientY - rect.top;
        
        // 範囲内チェック
        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
          console.log('✅ プレイマット内ドロップ - カード移動実行');
          const dragData = {
            type: 'placed-card',
            placedCardId: draggingCardId
          };
          handleCardDrop(x, y, dragData);
        } else {
          console.log('🗑️ プレイマット外ドロップ - カード削除実行');
          setPlacedCards(prev => prev.filter(card => card.id !== draggingCardId));
        }
      }
    }
    
    // 状態リセット
    setDraggingCardId(null);
    setIsDragMode(false);
    setDragCurrentPos({ x: 0, y: 0 });
  };

  // グローバルマウスイベントでカスタムドラッグ制御
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragMode && draggingCardId) {
        setDragCurrentPos({ x: e.clientX, y: e.clientY });
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isDragMode && draggingCardId) {
        console.log('🌐 グローバルマウスアップ - カスタムドラッグ終了');
        finishCustomDrag(e as any); // MouseEvent to React.MouseEvent conversion
      }
    };

    // グローバルイベントリスナー追加
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      
      // 真のコンポーネントアンマウント時のみタイマークリア
      if (dragResetTimerRef.current) {
        clearTimeout(dragResetTimerRef.current);
        dragResetTimerRef.current = null;
        console.log('🧹 真のコンポーネントアンマウント - ドラッグタイマークリア');
      }
      
      // ダブルクリック判定タイマーもクリア
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
        console.log('🧹 真のコンポーネントアンマウント - クリックタイマークリア');
      }
    };
  }, [isDragMode, draggingCardId]); // カスタムドラッグ状態に依存

  // エリア情報定義（元のプレイマットレイアウトに基づく正確な配置）
  const playmartAreas: AreaInfo[] = [
    // 相手エリア（上段）：サポーター・イベント、レイキエリア（位置交換）
    { id: 'opponent-support', name: 'サポーター・イベント', x: 280, y: 30, width: 400, height: 60, color: 'bg-red-200 border-red-400' },
    { id: 'opponent-reiki', name: 'レイキ', x: 100, y: 30, width: 160, height: 60, color: 'bg-red-100 border-red-300' },
    
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
    
    // 手札エリア（レイキエリアより右側）- 縦：ゲージ+アタック(176px)、横：サポーター70%(280px)
    { id: 'opponent-hand', name: '手札', x: 700, y: 110, width: 280, height: 176, color: 'bg-red-100 border-red-300' },
    { id: 'player-hand', name: '手札', x: 700, y: 394, width: 280, height: 176, color: 'bg-blue-100 border-blue-300' },
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
    
    // 配置済みカードの移動処理
    if (data.type === 'placed-card' && data.placedCardId) {
      setPlacedCards(prev => prev.map(card => 
        card.id === data.placedCardId 
          ? { ...card, x, y, areaId, isEnlarged: true } // 移動後も拡大維持
          : card
      ));
      console.log('🔄 カード移動:', { placedCardId: data.placedCardId, x, y, areaId });
      
      // 強制リセットタイマーのクリア
      if (dragResetTimerRef.current) {
        clearTimeout(dragResetTimerRef.current);
        dragResetTimerRef.current = null;
        console.log('⏰ カード移動完了 - 強制リセットタイマークリア');
      }
      
      // ドラッグ状態を即座にリセット
      setDraggingCardId(null);
      return;
    }
    
    // 新しいカード配置の場合
    if (data.type === 'main-card' || data.type === 'reiki-card') {
      // レイキカードの1枚制限チェック
      if (data.type === 'reiki-card') {
        const existingReiki = placedCards.find(
          card => card.reikiData?.color === data.color
        );
        
        if (existingReiki) {
          // 既存のレイキカードがある場合は枚数増加（上限15枚）
          const currentCount = existingReiki.reikiData?.count || 1;
          if (currentCount < 15) {
            setPlacedCards(prev => prev.map(card => 
              card.id === existingReiki.id 
                ? { ...card, reikiData: { ...card.reikiData!, count: currentCount + 1 } }
                : card
            ));
            console.log('📈 レイキカード枚数増加:', existingReiki.reikiData?.color, `${currentCount} → ${currentCount + 1}`);
          } else {
            console.log('⚠️ レイキカード上限達成:', existingReiki.reikiData?.color, '15枚');
          }
          return;
        }
      }
      
      const newCard: PlacedCard = {
        id: `card-${Date.now()}`,
        x,
        y,
        areaId,
        isEnlarged: true, // 新規配置カードは拡大表示
        rotation: 0, // 初期回転角度は0度
        ...(data.type === 'main-card' 
          ? { card: data.card }
          : { reikiData: { color: data.color, name: data.name, imageUrl: data.imageUrl, count: 1 } }
        )
      };
      
      setPlacedCards(prev => [...prev, newCard]);
      
      const areaName = areaId ? playmartAreas.find(area => area.id === areaId)?.name : 'フリーエリア';
      console.log('✅ カード配置:', { ...newCard, areaName });
    }
  };
  
  // レイキカードの枚数変更（+/-ボタン用）
  const updateReikiCount = (cardId: string, delta: number) => {
    setPlacedCards(prev => prev.map(card => {
      if (card.id === cardId && card.reikiData) {
        const currentCount = card.reikiData.count || 1;
        const newCount = Math.max(1, Math.min(15, currentCount + delta));
        return { ...card, reikiData: { ...card.reikiData, count: newCount } };
      }
      return card;
    }));
  };

  // カード回転機能（ダブルクリックで90度時計回り）
  const rotateCard = (cardId: string) => {
    setPlacedCards(prev => prev.map(card => {
      if (card.id === cardId) {
        const currentRotation = card.rotation || 0;
        const newRotation = (currentRotation + 90) % 360;
        console.log('🔄 カード回転:', {
          cardId,
          cardName: card.card?.name || card.reikiData?.name || card.gaugeData?.owner,
          currentRotation,
          newRotation
        });
        return { ...card, rotation: newRotation };
      }
      return card;
    }));
  };

  // ゲージカード追加・削除機能
  const updateGaugeCount = (areaId: string, delta: number) => {
    setGaugeCounts(prev => {
      const currentCount = prev[areaId] || 0;
      const newCount = Math.max(0, currentCount + delta);
      
      console.log('📊 ゲージカード数更新:', {
        areaId,
        currentCount,
        newCount,
        delta
      });
      
      // ゲージカードの表示を更新
      if (delta > 0) {
        // カード追加
        addGaugeCard(areaId, newCount - 1);
      } else if (delta < 0 && currentCount > 0) {
        // カード削除（最後のカードを削除）
        removeGaugeCard(areaId, currentCount - 1);
      }
      
      return { ...prev, [areaId]: newCount };
    });
  };

  // ゲージカード追加
  const addGaugeCard = (areaId: string, stackIndex: number) => {
    const owner: GaugeOwner = areaId.startsWith('player') ? 'player' : 'opponent';
    const area = playmartAreas.find(a => a.id === areaId);
    if (!area) return;

    // ゲージエリアの中央位置を計算（テキストの下に配置）
    const baseX = area.x + area.width / 2;
    const baseY = area.y + (owner === 'player' ? area.height - 30 : 30); // 自分側は下寄せ、相手側は上寄せ
    
    // 重なり効果のためのオフセット（2倍拡大：11.2pxずつずらす）
    // 相手側は右下起点で左上方向、自分側は左上起点で右下方向
    const offsetMultiplier = 11.2; // 5.6px → 11.2px（2倍拡大）
    const offsetX = owner === 'opponent' 
      ? stackIndex * (-offsetMultiplier) // 相手側：左方向
      : stackIndex * offsetMultiplier;   // 自分側：右方向
    const offsetY = owner === 'opponent' 
      ? stackIndex * (-offsetMultiplier * 0.6) // 相手側：上方向（少し小さめ）
      : stackIndex * (offsetMultiplier * 0.6); // 自分側：下方向（少し小さめ）

    const newCard: PlacedCard = {
      id: `gauge-${areaId}-${Date.now()}-${stackIndex}`,
      x: baseX + offsetX,
      y: baseY + offsetY,
      areaId,
      rotation: GAUGE_ROTATION[owner], // 自動的に横向きに回転
      isEnlarged: false, // ゲージカードは拡大しない
      gaugeData: {
        owner,
        imageUrl: GAUGE_IMAGE_PATHS[owner],
        stackIndex
      }
    };

    setPlacedCards(prev => [...prev, newCard]);
    console.log('📊 ゲージカード追加:', { areaId, stackIndex, owner });
  };

  // ゲージカード削除
  const removeGaugeCard = (areaId: string, stackIndex: number) => {
    setPlacedCards(prev => prev.filter(card => 
      !(card.gaugeData && card.areaId === areaId && card.gaugeData.stackIndex === stackIndex)
    ));
    console.log('📊 ゲージカード削除:', { areaId, stackIndex });
  };

  // 自由配置プレイマットコンポーネント（エリア背景付き）
  const FreeFormPlaymat: React.FC = () => {
    return (
      <div 
        className="w-full h-full bg-gray-50 border-2 border-gray-300 rounded-lg relative overflow-visible"
        data-playmat="true"
        style={{ zIndex: 1 }} // プレイマットベース: z-index 1
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // ドラッグ中のカードがあるかどうかでエフェクトを設定
          if (draggingCardId) {
            e.dataTransfer.dropEffect = 'move';
          } else {
            e.dataTransfer.dropEffect = 'copy';
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('🎯 プレイマットドロップイベント発生');
          try {
            const dataString = e.dataTransfer.getData('application/json');
            if (!dataString) {
              console.warn('⚠️ ドロップデータが空です');
              return;
            }
            const data = JSON.parse(dataString);
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            console.log('📦 ドロップデータ:', data);
            console.log('📍 ドロップ座標:', { x, y });
            handleCardDrop(x, y, data);
            // handleCardDropで既にリセット処理済み（移動の場合）、新規配置の場合のみここでリセット
            if (data.type !== 'placed-card') {
              setDraggingCardId(null);
            }
          } catch (error) {
            console.error('❌ ドロップデータ解析エラー:', error);
            setDraggingCardId(null); // エラー時もドラッグ状態をリセット
          }
        }}
      >
        {/* 中央分割線（拠点を通る点線）- エリアの下レイヤー、5%延長 */}
        <div 
          className="absolute pointer-events-none"
          style={{
            left: '7.5%',
            right: '7.5%',
            top: 340,
            height: 2,
            backgroundImage: 'repeating-linear-gradient(to right, #6b7280 0, #6b7280 8px, transparent 8px, transparent 16px)',
            zIndex: 5
          }}
        />

        {/* 相手・自分エリア表示テキスト - サポーターエリア左端に右端合わせ */}
        <div 
          className="absolute bg-white px-2 py-1 rounded text-xs font-semibold text-red-600 pointer-events-none" 
          style={{ 
            top: 310, 
            right: `calc(100% - 100px)`, // サポーターエリアの左端(x:100)に右端を合わせ
            zIndex: 15 
          }}
        >
          相手
        </div>
        <div 
          className="absolute bg-white px-2 py-1 rounded text-xs font-semibold text-blue-600 pointer-events-none" 
          style={{ 
            top: 355, 
            right: `calc(100% - 100px)`, // サポーターエリアの左端(x:100)に右端を合わせ
            zIndex: 15 
          }}
        >
          自分
        </div>

        {/* エリア背景描画 */}
        {playmartAreas.map((area) => {
          const isGaugeArea = area.id.includes('gauge');
          const isPlayerGauge = area.id.startsWith('player');
          const isOpponentGauge = area.id.startsWith('opponent');
          const gaugeCount = gaugeCounts[area.id] || 0;
          
          return (
            <div
              key={area.id}
              className={`absolute border-2 ${area.color} ${
                area.shape === 'circle' ? 'rounded-full opacity-100' : 'rounded-lg opacity-60'
              } ${isGaugeArea ? 'pointer-events-auto' : 'pointer-events-none'}`}
              style={{
                left: area.x,
                top: area.y,
                width: area.width,
                height: area.height,
                zIndex: area.shape === 'circle' ? 10 : 8, // 拠点を点線より上に
                ...(area.shape === 'circle' ? {
                  // 二重丸効果のためのボックスシャドウ + 背景で点線を隠す
                  boxShadow: `inset 0 0 0 3px ${area.color.includes('yellow-200') ? '#fbbf24' : '#ffffff'}`,
                  backgroundColor: '#fde68a' // 拠点の背景色で点線を隠す
                } : {})
              }}
            >
              {/* エリア名表示 */}
              <div className={`absolute inset-0 flex ${
                isGaugeArea 
                  ? isPlayerGauge 
                    ? 'items-start justify-between pt-1' // 自分側：上寄せ・ボタン配置
                    : 'items-end justify-between pb-1'   // 相手側：下寄せ・ボタン配置
                  : 'items-center justify-center'        // 通常エリア：中央
              }`}>
                {isGaugeArea ? (
                  <>
                    {/* ゲージエリアのテキスト */}
                    <span className="text-xs font-medium text-gray-700 px-1">
                      {area.name}
                    </span>
                    
                    {/* ゲージエリアの+/-ボタン */}
                    <div className="flex space-x-1 pr-1">
                      <button
                        className="w-4 h-4 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 flex items-center justify-center pointer-events-auto transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          console.log('🔴 ゲージカード減少:', area.id);
                          updateGaugeCount(area.id, -1);
                        }}
                        title={`${area.name}からカードを1枚削除`}
                        disabled={gaugeCount === 0}
                        style={{ opacity: gaugeCount === 0 ? 0.5 : 1 }}
                      >
                        −
                      </button>
                      <button
                        className="w-4 h-4 bg-green-500 text-white text-xs rounded-full hover:bg-green-600 flex items-center justify-center pointer-events-auto transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          console.log('🟢 ゲージカード増加:', area.id);
                          updateGaugeCount(area.id, 1);
                        }}
                        title={`${area.name}にカードを1枚追加`}
                      >
                        ＋
                      </button>
                    </div>
                    
                    {/* ゲージ枚数表示（0枚の時は非表示） */}
                    {gaugeCount > 0 && (
                      <div 
                        className="absolute bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white pointer-events-none"
                        style={{
                          top: isPlayerGauge ? -8 : 'auto',
                          bottom: isOpponentGauge ? -8 : 'auto',
                          right: -8,
                          zIndex: 20
                        }}
                      >
                        {gaugeCount}
                      </div>
                    )}
                  </>
                ) : (
                  // 通常エリア
                  <span className="text-xs font-medium text-gray-700 text-center px-1">
                    {area.name}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* 配置されたカードの表示 */}
        {placedCards.map((placedCard) => {
          const isDragging = draggingCardId === placedCard.id;
          
          // サイズ計算：基本64x80、拡大時83x104（30%拡大）、ゲージカード62x78（30%拡大）
          const baseSize = { width: 64, height: 80 };
          const enlargedSize = { width: 83, height: 104 }; // 30%拡大: 64*1.3=83.2≈83, 80*1.3=104
          const gaugeSize = { width: 62, height: 78 }; // ゲージカード用サイズ（48x60から30%拡大）
          
          const currentSize = placedCard.gaugeData 
            ? gaugeSize  // ゲージカードは小さいサイズ
            : placedCard.isEnlarged 
            ? enlargedSize 
            : baseSize;
          
          // ドラッグ中の位置計算（マウス追従）
          let displayX, displayY;
          
          if (isDragging && isDragMode) {
            // ドラッグ中：プレイマット要素からの相対位置に変換
            const playmapElement = document.querySelector('[data-playmat="true"]') as HTMLElement;
            if (playmapElement) {
              const rect = playmapElement.getBoundingClientRect();
              displayX = dragCurrentPos.x - rect.left - (currentSize.width / 2);
              displayY = dragCurrentPos.y - rect.top - (currentSize.height / 2);
            } else {
              displayX = placedCard.x - (currentSize.width / 2);
              displayY = placedCard.y - (currentSize.height / 2);
            }
          } else {
            // 通常時：元の位置
            displayX = placedCard.x - (currentSize.width / 2);
            displayY = placedCard.y - (currentSize.height / 2);
          }
          
          return (
            <div
              key={placedCard.id}
              className={`group absolute rounded-lg shadow-lg transition-all ${
                isDragging && isDragMode 
                  ? 'cursor-grabbing opacity-75 scale-110 shadow-2xl' // ドラッグ中：半透明・拡大・強い影（z-indexはstyleで設定）
                  : isDragging
                  ? 'cursor-grabbing' // ドラッグ開始時（z-indexはstyleで設定）
                  : 'cursor-grab hover:scale-105 hover:shadow-xl border-2 border-white' // 通常時のみborderクラス
              }`}
              style={{
                left: displayX,
                top: displayY,
                width: currentSize.width,
                height: currentSize.height,
                // z-index階層管理: 
                // - ドラッグ中: 9999（最前面・全要素より上）
                // - 通常時: 30（プレイマット内の他要素より上）
                zIndex: isDragging ? 9999 : 30,
                // デバッグ用：ドラッグ中は境界線を強調
                border: isDragging ? '3px solid #ff0000' : '2px solid white',
                // ドラッグ中のスムーズな追従
                transition: isDragging && isDragMode ? 'none' : 'all 0.2s ease-out',
                // ドラッグ中のポインターイベント無効化（下のカードとの干渉防止）
                pointerEvents: isDragging && isDragMode ? 'none' : 'auto',
                // カード回転のtransform追加
                transform: `rotate(${placedCard.rotation || 0}deg)`,
                transformOrigin: 'center center', // 中心を軸に回転
              }}
              draggable={false} // HTML5 Drag & Dropを無効化
              onMouseDown={(e) => {
                console.log('🔥 配置済みカード MouseDown:', {
                  cardId: placedCard.id,
                  target: (e.target as HTMLElement).tagName,
                  targetClass: (e.target as HTMLElement).className,
                  button: e.button,
                  isWaitingForDoubleClick
                });
                
                // レイキカード+/-ボタンエリアのクリック判定
                if (placedCard.reikiData) {
                  const target = e.target as HTMLElement;
                  // ボタンまたはボタンの子要素の場合はドラッグを開始しない
                  if (target.closest('button')) {
                    console.log('⚠️ レイキボタンエリアクリック - ドラッグ開始回避:', {
                      buttonElement: target.closest('button'),
                      buttonClass: target.closest('button')?.className
                    });
                    e.stopPropagation(); // イベントの伝播を止める
                    return;
                  }
                }
                
                e.preventDefault();
                e.stopPropagation();
                
                // 他のカードがドラッグ中の場合は緊急リセット
                if (draggingCardId && draggingCardId !== placedCard.id) {
                  console.log('🚨 緊急リセット - 他のカードがドラッグ中:', {
                    draggingCard: draggingCardId,
                    currentCard: placedCard.id
                  });
                  if (dragResetTimerRef.current) {
                    clearTimeout(dragResetTimerRef.current);
                    dragResetTimerRef.current = null;
                  }
                  setDraggingCardId(null);
                  return;
                }
                
                // 既にこのカードがドラッグ中の場合は無視
                if (draggingCardId === placedCard.id) {
                  console.log('⚠️ 既にドラッグ中:', placedCard.id);
                  return;
                }
                
                // ダブルクリック判定用のクリック遅延処理
                if (isWaitingForDoubleClick) {
                  // ダブルクリックと判定 - 回転処理を実行
                  console.log('✨ ダブルクリック判定成功 - 回転実行:', placedCard.id);
                  if (clickTimerRef.current) {
                    clearTimeout(clickTimerRef.current);
                    clickTimerRef.current = null;
                  }
                  setIsWaitingForDoubleClick(false);
                  
                  // 保存された情報をクリア（ドラッグ開始を防ぐため）
                  pendingClickRef.current = null;
                  
                  // 回転実行
                  rotateCard(placedCard.id);
                  return;
                }
                
                // 1回目のクリック - ダブルクリック待機開始
                setIsWaitingForDoubleClick(true);
                
                // クリック情報を保存
                pendingClickRef.current = {
                  cardId: placedCard.id,
                  event: { clientX: e.clientX, clientY: e.clientY }
                };
                
                // 300ms後にシングルクリック処理（ドラッグ開始）
                clickTimerRef.current = setTimeout(() => {
                  console.log('⏰ シングルクリック判定 - ドラッグ開始:', placedCard.id);
                  setIsWaitingForDoubleClick(false);
                  
                  // ドラッグが既に開始されていない場合のみ開始
                  if (!draggingCardId && pendingClickRef.current) {
                    // 保存された情報でドラッグ開始
                    const mockEvent = {
                      ...e,
                      clientX: pendingClickRef.current.event.clientX,
                      clientY: pendingClickRef.current.event.clientY
                    };
                    startCustomDrag(pendingClickRef.current.cardId, mockEvent);
                  }
                  
                  // 保存された情報をクリア
                  pendingClickRef.current = null;
                }, 300); // 300msのダブルクリック待機時間
                
                console.log('🕐 ダブルクリック待機開始:', placedCard.id);
              }}
              title={`${
                placedCard.card?.name || 
                placedCard.reikiData?.name || 
                (placedCard.gaugeData ? `ゲージカード（${placedCard.gaugeData.owner === 'player' ? '自分' : '相手'}用）` : '')
              } | エリア: ${
                placedCard.areaId ? playmartAreas.find(area => area.id === placedCard.areaId)?.name : 'フリーエリア'
              } | 回転: ${placedCard.rotation || 0}度 | ${
                placedCard.gaugeData ? '重なり順:' + (placedCard.gaugeData.stackIndex + 1) : 'ドラッグで移動・ダブルクリックで回転'
              }`}
            >
              <img
                src={
                  placedCard.card?.imageUrl || 
                  placedCard.reikiData?.imageUrl || 
                  placedCard.gaugeData?.imageUrl || 
                  ''
                }
                alt={
                  placedCard.card?.name || 
                  placedCard.reikiData?.name || 
                  (placedCard.gaugeData ? `ゲージカード（${placedCard.gaugeData.owner}）` : '')
                }
                className="w-full h-full object-cover rounded-lg pointer-events-none select-none"
                draggable={false}
              />
              
              {/* カード名表示（ゲージカード以外） */}
              {!placedCard.gaugeData && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 rounded-b-lg pointer-events-none">
                  <div className="truncate">
                    {placedCard.card?.name || placedCard.reikiData?.name || ''}
                  </div>
                </div>
              )}
              
              {/* レイキカード用の+/-ボタンと枚数表示 */}
              {placedCard.reikiData && (
                <>
                  {/* 枚数表示バッジ - ドラッグ時は非表示 */}
                  <div 
                    className={`absolute -top-2 -right-2 bg-yellow-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white pointer-events-none ${
                      isDragging ? 'opacity-0' : 'opacity-100'
                    }`}
                  >
                    {placedCard.reikiData.count || 1}
                  </div>
                  
                  {/* +/-ボタン（ホバー時表示） - ドラッグ時は完全非表示 */}
                  {!isDragging && draggingCardId !== placedCard.id && (
                    <div className="absolute -top-1 -left-1 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity z-50">
                      <div className="flex space-x-1">
                        <button
                          className="w-4 h-4 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 flex items-center justify-center pointer-events-auto"
                          draggable={false} // ボタン自体のドラッグを完全に無効化
                          onMouseDown={(e) => {
                            e.stopPropagation(); // ドラッグ開始を防止
                            e.preventDefault();
                            console.log('🔴 レイキ減少ボタン MouseDown:', placedCard.id);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            console.log('🔴 レイキ減少処理実行:', {
                              cardId: placedCard.id,
                              currentCount: placedCard.reikiData?.count || 1
                            });
                            
                            // 確実にドラッグ状態をリセット
                            if (draggingCardId) {
                              setDraggingCardId(null);
                              setIsDragMode(false);
                            }
                            
                            if ((placedCard.reikiData?.count || 1) > 1) {
                              updateReikiCount(placedCard.id, -1);
                            } else {
                              setPlacedCards(prev => prev.filter(card => card.id !== placedCard.id));
                              console.log('🔴 レイキカード削除完了:', placedCard.id);
                            }
                          }}
                          title="枚数を減らす"
                        >
                          −
                        </button>
                        <button
                          className={`w-4 h-4 text-white text-xs rounded-full flex items-center justify-center pointer-events-auto transition-colors ${
                            (placedCard.reikiData?.count || 1) >= 15 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : 'bg-green-500 hover:bg-green-600'
                          }`}
                          disabled={(placedCard.reikiData?.count || 1) >= 15}
                          draggable={false} // ボタン自体のドラッグを完全に無効化
                          onMouseDown={(e) => {
                            e.stopPropagation(); // ドラッグ開始を防止
                            e.preventDefault();
                            console.log('🟢 レイキ増加ボタン MouseDown:', placedCard.id);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            console.log('🟢 レイキ増加処理実行:', {
                              cardId: placedCard.id,
                              currentCount: placedCard.reikiData?.count || 1
                            });
                            
                            // 確実にドラッグ状態をリセット
                            if (draggingCardId) {
                              setDraggingCardId(null);
                              setIsDragMode(false);
                            }
                            
                            updateReikiCount(placedCard.id, 1);
                          }}
                          title="枚数を増やす"
                        >
                          ＋
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
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
      <div className="max-w-7xl mx-auto px-4 relative">
        {/* z-index階層: ドラッグ中カード(9999) > プレイマット(5) > カード選択エリア(1) */}
        <div className="h-[700px] relative z-[5]">
          <FreeFormPlaymat />
        </div>

        {/* 下部：カード選択エリアと操作ボタン */}
        <div className="mt-4 space-y-4 relative z-[1]">
          {/* カードスライダー - タブ付き */}
          <div className="w-full bg-white border-2 border-gray-300 rounded-lg overflow-hidden relative" style={{ zIndex: 1 }}>
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

            {/* カード一覧エリア（削除機能付き） */}
            <div className={`p-4 h-40 bg-gray-50 relative border-2 border-dashed transition-colors ${
              draggingCardId 
                ? 'border-red-400 bg-red-50' // ドラッグ中のみ赤色表示
                : 'border-gray-300' // 通常時はグレー
            }`}
                 style={{ zIndex: 1 }} // ドラッグカード（z-index: 9999）より低く設定
                 onDragOver={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   // 配置済みカードのドラッグ時のみ削除エフェクト
                   if (draggingCardId) {
                     e.dataTransfer.dropEffect = 'move';
                   }
                 }}
                 onDrop={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   console.log('🗑️ カード選択エリアドロップ（削除処理）');
                   try {
                     const dataString = e.dataTransfer.getData('application/json');
                     if (!dataString) return;
                     
                     const data = JSON.parse(dataString);
                     console.log('🗑️ 削除対象データ:', data);
                     
                     // 配置済みカードの削除のみ処理
                     if (data.type === 'placed-card' && data.placedCardId) {
                       setPlacedCards(prev => prev.filter(card => card.id !== data.placedCardId));
                       console.log('✅ カード削除完了:', data.placedCardId);
                       
                       // 強制リセットタイマーのクリア
                       if (dragResetTimerRef.current) {
                         clearTimeout(dragResetTimerRef.current);
                         dragResetTimerRef.current = null;
                         console.log('⏰ カード削除完了 - 強制リセットタイマークリア');
                       }
                     }
                     setDraggingCardId(null);
                   } catch (error) {
                     console.error('❌ 削除ドロップエラー:', error);
                     setDraggingCardId(null);
                   }
                 }}
                 title="配置済みカードをここにドロップで削除できます"
            >
              {/* 削除案内表示（ドラッグ中のみ表示） */}
              {draggingCardId && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-100 bg-opacity-80 rounded-lg pointer-events-none z-10">
                  <div className="text-red-700 text-sm font-bold text-center">
                    <div className="text-2xl mb-1">🗑️</div>
                    <div>ここにドロップで削除</div>
                  </div>
                </div>
              )}
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
                              // 緊急リセット：他のカードがドラッグ中の場合
                              if (draggingCardId) {
                                console.log('🚨 緊急リセット - メインカードドラッグ開始時:', {
                                  draggingCard: draggingCardId,
                                  newCard: card.name
                                });
                                if (dragResetTimerRef.current) {
                                  clearTimeout(dragResetTimerRef.current);
                                  dragResetTimerRef.current = null;
                                }
                                setDraggingCardId(null);
                              }
                              
                              e.stopPropagation(); // イベント伝播防止
                              e.dataTransfer.setData('application/json', JSON.stringify({
                                type: 'main-card',
                                card: card
                              }));
                              e.dataTransfer.effectAllowed = 'copy';
                              console.log('📤 メインカードドラッグ開始:', card.name);
                            }}
                            onDragEnd={(e) => {
                              e.stopPropagation();
                              console.log('📤 メインカードドラッグ終了:', card.name);
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
                          // 緊急リセット：他のカードがドラッグ中の場合
                          if (draggingCardId) {
                            console.log('🚨 緊急リセット - レイキカードドラッグ開始時:', {
                              draggingCard: draggingCardId,
                              newCard: REIKI_COLOR_NAMES[color]
                            });
                            if (dragResetTimerRef.current) {
                              clearTimeout(dragResetTimerRef.current);
                              dragResetTimerRef.current = null;
                            }
                            setDraggingCardId(null);
                          }
                          
                          e.stopPropagation(); // イベント伝播防止
                          e.dataTransfer.setData('application/json', JSON.stringify({
                            type: 'reiki-card',
                            color: color,
                            name: REIKI_COLOR_NAMES[color],
                            imageUrl: REIKI_IMAGE_PATHS[color]
                          }));
                          e.dataTransfer.effectAllowed = 'copy';
                          console.log('📤 レイキカードドラッグ開始:', REIKI_COLOR_NAMES[color]);
                        }}
                        onDragEnd={(e) => {
                          e.stopPropagation();
                          console.log('📤 レイキカードドラッグ終了:', REIKI_COLOR_NAMES[color]);
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
              
              {/* デバッグ用：ドラッグ状態リセットボタン */}
              {draggingCardId && (
                <button
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                  onClick={() => {
                    console.log('🔧 手動ドラッグ状態リセット:', draggingCardId);
                    
                    // カスタムドラッグ終了（強制）
                    finishCustomDrag();
                  }}
                  title="ドラッグが固まった時の緊急リセット"
                >
                  🔧 ドラッグリセット
                </button>
              )}
              
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