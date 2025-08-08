// ゲージカード用のアセット管理

export const GAUGE_IMAGE_PATHS = {
  player: '/images/gauge/gauge_back_player.png',      // 自分用（茶色）
  opponent: '/images/gauge/gauge_back_opponent.png',  // 相手用（グレー）
} as const;

export const GAUGE_ROTATION = {
  player: -90,   // 自分側：反時計回りに90度
  opponent: 90,  // 相手側：時計回りに90度
} as const;

export type GaugeOwner = 'player' | 'opponent';
export type GaugeSlot = 'gauge-1' | 'gauge-2' | 'gauge-3';

// ゲージエリアのID一覧
export const GAUGE_AREA_IDS = {
  player: ['player-gauge-1', 'player-gauge-2', 'player-gauge-3'],
  opponent: ['opponent-gauge-1', 'opponent-gauge-2', 'opponent-gauge-3'],
} as const;

// ゲージカード情報の型定義
export interface GaugeCard {
  id: string;
  owner: GaugeOwner;
  areaId: string;
  imageUrl: string;
  rotation: number;
  stackIndex: number; // 重なり順序（0が一番下）
}