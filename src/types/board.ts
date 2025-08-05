// Board Simulator専用型定義
import { Card, ReikiCard } from './card';

export interface BoardState {
  // プレイマット上のカード配置
  playmat: {
    trashArea: PlacedCard[];
    reikiArea: PlacedCard[];
    deckArea: PlacedCard[];
    gaugeAreas: {
      area1: PlacedCard[];
      area2: PlacedCard[];
      area3: PlacedCard[];
    };
    unitArea: Record<1 | 2 | 3 | 4 | 5, PlacedCard | null>;
    supporterEventArea: PlacedCard[];
  };
  
  // 手札エリア
  handAreas: {
    opponent: PlacedCard[];
    player: PlacedCard[];
  };
  
  // UI状態
  ui: {
    selectedCardType: 'main' | 'reiki' | 'back';
    selectedBackType: 'gold' | 'gray';
    dragState: DragState | null;
  };
}

export interface PlacedCard {
  id: string;                    // 一意ID（配置インスタンス用）
  card: Card | BackCard;         // カードデータ
  position: CardPosition;        // 配置位置
  rotation: 0 | 90 | 180 | 270;  // 回転角度
  isRested: boolean;             // レスト状態
}

export interface CardPosition {
  area: PlaymatArea;
  slot?: number;                 // ユニットエリアの場合のスロット番号
  x?: number;                    // 自由配置の場合の座標
  y?: number;
}

export interface BackCard {
  id: 'back-gold' | 'back-gray';
  name: '裏面（ゴールド）' | '裏面（グレー）';
  imageUrl: string;
  type: 'back';
}

export type PlaymatArea = 
  | 'trashArea' 
  | 'reikiArea' 
  | 'deckArea' 
  | 'gaugeArea1' 
  | 'gaugeArea2' 
  | 'gaugeArea3' 
  | 'unitArea' 
  | 'supporterEventArea'
  | 'opponentHand'
  | 'playerHand';

export interface DragState {
  isDragging: boolean;
  draggedCard: Card | BackCard | null;
  sourceArea: PlaymatArea | null;
  sourcePosition?: number;
}

// レイアウト関連の定数
export const PLAYMAT_DIMENSIONS = {
  width: 1200,
  height: 800,
} as const;

export const CARD_DIMENSIONS = {
  width: 100,
  height: 140,
} as const;

export const HAND_AREA_DIMENSIONS = {
  width: 1200,
  height: 80,
} as const;