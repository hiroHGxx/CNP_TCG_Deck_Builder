/**
 * レイキカード関連の型定義
 * CNP TCG v2.0 - レイキカードシステム対応
 */

export type ReikiColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple';

/**
 * レイキカード（色リソース）
 */
export interface ReikiCard {
  color: ReikiColor;
  count: number;
}

/**
 * 色分布統計
 */
export interface ColorDistribution {
  red: number;
  blue: number;
  green: number;
  yellow: number;
  purple: number;
  colorless: number;
}

/**
 * レイキデッキバリデーション結果
 */
export interface ReikiValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  totalCards: number;
  colorBalance: Record<ReikiColor, number>;
  suggestions: string[];
}

/**
 * レイキ配分推奨設定
 */
export interface ReikiSuggestion {
  distribution: ReikiCard[];
  reasoning: string;
  confidence: number; // 0-1, 推奨度
}

/**
 * レイキストア状態
 */
export interface ReikiState {
  cards: ReikiCard[];
  
  // 基本操作
  setColor: (color: ReikiColor, count: number) => void;
  increment: (color: ReikiColor) => void;
  decrement: (color: ReikiColor) => void;
  clear: () => void;
  
  // 推奨機能
  applySuggestion: (mainColors: ColorDistribution) => void;
  getSuggestion: (mainColors: ColorDistribution) => ReikiSuggestion;
  
  // バリデーション
  validate: () => ReikiValidationResult;
  isValid: () => boolean;
  getTotalCount: () => number;
  getColorCount: (color: ReikiColor) => number;
}