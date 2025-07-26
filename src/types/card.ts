/**
 * CNP TCG カード関連の型定義
 */

export interface Card {
  cardId: string;           // 例: "BT1-116"
  name: string;             // カード名
  cost: number;             // コスト
  color: CardColor;         // 属性（色）
  bp: number | null;        // バトルポイント（サポーター/イベントの場合null）
  role: string[];           // 特徴（種族）の配列
  effect: string;           // カード効果テキスト
  flavorText: string;       // フレーバーテキスト
  rarity: CardRarity;       // レアリティ
  cardType: CardType;       // カード種
  colorBalance: string;     // 色均衡（例: "緑4"）
  pack: string;             // 収録パック名
  illustrator: string;      // イラストレーター
  imageFile: string;        // 画像ファイル名
}

export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'colorless';

export type CardRarity = 'common' | 'rare' | 'rare_rare' | 'super_rare' | 'ultra_rare' | 'RRR';

export type CardType = 'unit' | 'supporter' | 'event';

/**
 * デッキ関連の型定義
 */
export interface Deck {
  deckId: string;
  name: string;
  cards: Record<string, number>; // cardId → 枚数のマッピング
  createdAt: string;
  updatedAt: string;
}

/**
 * 戦績関連の型定義
 */
export interface Match {
  id: string;
  date: string;
  opponent: string;
  deckId: string;
  win: boolean;
  memo: string;
  createdAt: string;
}

/**
 * デッキバリデーション結果
 */
export interface DeckValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  totalCards: number;
  colorBalance: Record<CardColor, number>;
  costCurve: Record<number, number>;
}

/**
 * カード検索・フィルタ関連
 */
export interface CardFilter {
  searchText?: string;
  colors?: CardColor[];
  minCost?: number;
  maxCost?: number;
  cardTypes?: CardType[];
  rarities?: CardRarity[];
  roles?: string[];
}

export interface SearchResult {
  cards: Card[];
  totalCount: number;
  page: number;
  hasMore: boolean;
}

/**
 * 統計情報
 */
export interface DeckStats {
  totalCards: number;
  colorDistribution: Record<CardColor, number>;
  costCurve: Record<number, number>;
  typeDistribution: Record<CardType, number>;
  averageCost: number;
}

export interface MatchStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  deckPerformance: Record<string, { wins: number; losses: number; winRate: number }>;
}