import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  calculateSuggestedReiki, 
  validateReikiDeck, 
  generateReikiSuggestion 
} from '@/utils/reikiCalculation'
import type { 
  ReikiColor, 
  ColorDistribution, 
  ReikiState
} from '@/types/reiki'

/**
 * Zustand レイキストア実装
 */
export const useReikiStore = create<ReikiState>()(
  persist(
    (set, get) => ({
      // 初期状態: 全色0枚
      cards: [
        { color: 'red', count: 0 },
        { color: 'blue', count: 0 },
        { color: 'green', count: 0 },
        { color: 'yellow', count: 0 },
        { color: 'purple', count: 0 }
      ],
      
      // 基本操作
      setColor: (color: ReikiColor, count: number) => {
        const clampedCount = Math.max(0, Math.min(15, count));
        set(state => ({
          cards: state.cards.map(card => 
            card.color === color ? { ...card, count: clampedCount } : card
          )
        }));
      },
      
      increment: (color: ReikiColor) => {
        const current = get().getColorCount(color);
        const total = get().getTotalCount();
        if (total < 15 && current < 15) {
          get().setColor(color, current + 1);
        }
      },
      
      decrement: (color: ReikiColor) => {
        const current = get().getColorCount(color);
        if (current > 0) {
          get().setColor(color, current - 1);
        }
      },
      
      clear: () => {
        set(state => ({
          cards: state.cards.map(card => ({ ...card, count: 0 }))
        }));
      },
      
      // 推奨機能
      applySuggestion: (mainColors: ColorDistribution) => {
        const suggested = calculateSuggestedReiki(mainColors);
        set({ cards: suggested });
      },
      
      getSuggestion: (mainColors: ColorDistribution) => {
        return generateReikiSuggestion(mainColors);
      },
      
      // バリデーション・取得
      getTotalCount: () => {
        return get().cards.reduce((sum, card) => sum + card.count, 0);
      },
      
      getColorCount: (color: ReikiColor) => {
        return get().cards.find(card => card.color === color)?.count || 0;
      },
      
      validate: () => {
        return validateReikiDeck(get().cards);
      },
      
      isValid: () => {
        return get().validate().isValid;
      }
    }),
    {
      name: 'reiki-storage', // localStorageのキー名
      partialize: (state) => ({
        cards: state.cards
      })
    }
  )
);