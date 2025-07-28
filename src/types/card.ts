/**
 * CNP TCG カード関連の型定義
 */

export interface Card {
  cardId: string;           // 例: "BT1-116"
  name: string;             // カード名
  cost: number;             // コスト
  color: CardColor;         // 属性（色）
  bp: number | null;        // バトルポイント（サポーター/イベントの場合null）
  supportBP: number | null; // 助太刀BP（ユニットカードの場合のみ。例: 1000, 2000）
  role: string[];           // 特徴（種族）の配列
  effect: string;           // カード効果テキスト
  flavorText: string;       // フレーバーテキスト
  rarity: CardRarity;       // レアリティ
  cardType: CardType;       // カード種
  colorBalance: string;     // 色均衡（例: "緑4"）
  pack: string;             // 収録パック名
  illustrator: string;      // イラストレーター
  imageFile: string;        // 画像ファイル名
  imageUrl: string;         // 画像URL（Supabase CDN）
}

export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'colorless';

export type CardRarity = 'common' | 'rare' | 'rare_rare' | 'triple_rare' | 'super_rare' | 'ultra_rare' | 'RRR';

export type CardType = 'unit' | 'supporter' | 'event';

/**
 * デッキ関連の型定義 v2.0
 */
export interface Deck {
  deckId: string;
  name: string;
  
  // v2.0: メインデッキ（50枚）
  mainCards: Record<string, number>; // cardId → 枚数のマッピング
  
  // v2.0: レイキデッキ（15枚）
  reikiCards: import('./reiki').ReikiCard[];
  
  // メタデータ
  createdAt: string;
  updatedAt: string;
  version: string; // "2.0"
}

/**
 * v1.0互換用（廃止予定）
 */
export interface LegacyDeck {
  deckId: string;
  name: string;
  cards: Record<string, number>; // v1.0形式
  createdAt: string;
  updatedAt: string;
}

/**
 * デッキ内のカード情報（表示用）
 */
export interface DeckCardEntry {
  card: Card;
  count: number;
}

/**
 * 現在編集中のデッキ状態 v1.0互換（実装中）
 */
export interface CurrentDeck {
  name: string;
  
  // v1.0形式（現在の実装）
  cards: Record<string, number>; // cardId → 枚数
  
  lastModified: string;
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
 * デッキバリデーション結果 v2.0
 */
export interface DeckValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  
  // メインデッキ
  mainDeck: {
    totalCards: number;
    isValidCount: boolean;
    cardLimitViolations: string[];
    colorBalance: Record<CardColor, number>;
    costCurve: Record<number, number>;
  };
  
  // レイキデッキ
  reikiDeck: {
    totalCards: number;
    isValidCount: boolean;
    colorBalance: Record<import('./reiki').ReikiColor, number>;
  };
  
  // 全体統合
  overall: {
    colorAlignment: boolean;
    suggestions: string[];
  };
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
 * 助太刀BP分布統計
 */
export interface SupportBPDistribution {
  bp1000: number;  // BP:1000の枚数
  bp2000: number;  // BP:2000の枚数  
  bp3000: number;  // BP:3000の枚数
  bp4000: number;  // BP:4000の枚数
  bp5000: number;  // BP:5000の枚数
  total: number;   // 助太刀可能カード総数
  average: number; // 平均助太刀BP
}

/**
 * 統計情報 v2.0
 */
export interface DeckStats {
  // メインデッキ統計
  mainDeck: {
    totalCards: number;
    colorDistribution: Record<CardColor, number>;
    costCurve: Record<number, number>;
    typeDistribution: Record<CardType, number>;
    averageCost: number;
    // v2.0: 助太刀BP統計追加
    supportBPDistribution: SupportBPDistribution;
  };
  
  // レイキデッキ統計  
  reikiDeck: {
    totalCards: number;
    colorDistribution: Record<import('./reiki').ReikiColor, number>;
  };
  
  // 統合統計
  overall: {
    totalCards: number; // main + reiki
    colorAlignment: import('./reiki').ColorDistribution;
  };
}

export interface MatchStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  deckPerformance: Record<string, { wins: number; losses: number; winRate: number }>;
}