import type { 
  ReikiCard, 
  ReikiColor, 
  ColorDistribution, 
  ReikiValidationResult, 
  ReikiSuggestion 
} from '@/types/reiki'

/**
 * レイキ配分推奨アルゴリズム
 * メインデッキの色分布に基づいて最適なレイキ配分を計算
 */
export const calculateSuggestedReiki = (mainColors: ColorDistribution): ReikiCard[] => {
  const totalColorCards = Object.entries(mainColors)
    .filter(([color]) => color !== 'colorless')
    .reduce((sum, [, count]) => sum + count, 0);
    
  if (totalColorCards === 0) {
    // 無色デッキ: 均等配分
    return [
      { color: 'red', count: 4 },
      { color: 'blue', count: 4 },
      { color: 'green', count: 4 },
      { color: 'yellow', count: 3 }
    ];
  }
  
  // 色比率ベース配分
  const suggestions: ReikiCard[] = [];
  let remaining = 15;
  
  (['red', 'blue', 'green', 'yellow'] as const).forEach(color => {
    const ratio = mainColors[color] / totalColorCards;
    const suggested = Math.max(0, Math.floor(ratio * 15));
    suggestions.push({ color, count: suggested });
    remaining -= suggested;
  });
  
  // 余りを主要色に配分
  if (remaining > 0) {
    const sortedColors = (['red', 'blue', 'green', 'yellow'] as const)
      .map(color => ({ color, count: mainColors[color] }))
      .sort((a, b) => b.count - a.count);
    
    // 上位の色に順番に余りを配分
    for (let i = 0; i < sortedColors.length && remaining > 0; i++) {
      const { color } = sortedColors[i];
      const cardIndex = suggestions.findIndex(s => s.color === color);
      if (cardIndex !== -1) {
        const toAdd = Math.min(remaining, 15 - suggestions[cardIndex].count);
        suggestions[cardIndex].count += toAdd;
        remaining -= toAdd;
      }
    }
  }
  
  return suggestions;
};

/**
 * レイキデッキバリデーション
 * 15枚制限、色制限、推奨事項の検証
 */
export const validateReikiDeck = (cards: ReikiCard[]): ReikiValidationResult => {
  const total = cards.reduce((sum, card) => sum + card.count, 0);
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 基本検証
  if (total !== 15) {
    if (total < 15) {
      errors.push(`レイキデッキは15枚である必要があります (現在: ${total}枚、あと${15 - total}枚必要)`);
    } else {
      errors.push(`レイキデッキは15枚である必要があります (現在: ${total}枚、${total - 15}枚多い)`);
    }
  }
  
  // 色制限検証
  cards.forEach(card => {
    if (card.count < 0) {
      errors.push(`${card.color}の枚数が負の値です`);
    }
    if (card.count > 15) {
      errors.push(`${card.color}の枚数が上限を超えています (${card.count}/15)`);
    }
  });
  
  // 色均衡の警告（削除：単色戦略は正当）
  // const emptyColors = cards.filter(c => c.count === 0);
  // 警告は削除済み（単色戦略は正当）
  
  // 極端な偏りの警告
  const maxCount = Math.max(...cards.map(c => c.count));
  const nonZeroColors = cards.filter(c => c.count > 0);
  if (nonZeroColors.length > 0 && maxCount > 12) {
    warnings.push('特定の色に偏りすぎています。バランスを見直してください。');
  }
  
  // 推奨事項生成
  const suggestions: string[] = [];
  if (total < 15) {
    suggestions.push(`あと${15 - total}枚追加してください`);
  }
  if (total > 15) {
    suggestions.push(`${total - 15}枚減らしてください`);
  }
  // 単色戦略推奨も削除（ユーザー要望により）
  // if (emptyColors.length >= 2) {
  //   suggestions.push('最低2色は1枚以上入れることを推奨します');
  // }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    totalCards: total,
    colorBalance: cards.reduce((acc, card) => {
      acc[card.color] = card.count;
      return acc;
    }, {} as Record<ReikiColor, number>),
    suggestions
  };
};

/**
 * レイキ推奨情報生成
 * メインデッキの色分布分析と推奨理由の生成
 */
export const generateReikiSuggestion = (mainColors: ColorDistribution): ReikiSuggestion => {
  const distribution = calculateSuggestedReiki(mainColors);
  const totalMainCards = Object.entries(mainColors)
    .filter(([color]) => color !== 'colorless')
    .reduce((sum, [, count]) => sum + count, 0);
  
  let reasoning = '';
  let confidence = 0.8;
  
  if (totalMainCards === 0) {
    reasoning = '無色デッキのため4色均等配分を推奨します';
    confidence = 0.6;
  } else {
    // 主要色の分析
    const colorEntries = Object.entries(mainColors)
      .filter(([color]) => color !== 'colorless')
      .sort(([, a], [, b]) => b - a);
    
    const dominantColors = colorEntries.filter(([, count]) => count > 0);
    
    if (dominantColors.length === 1) {
      reasoning = `単色デッキ（${dominantColors[0][0]}）のため、主色重視配分を推奨`;
      confidence = 0.9;
    } else if (dominantColors.length === 2) {
      reasoning = `2色デッキ（${dominantColors.map(([color]) => color).join('、')}）のため、主色比率ベース配分を推奨`;
      confidence = 0.85;
    } else {
      reasoning = `多色デッキ（${dominantColors.length}色）のため、色比率バランス配分を推奨`;
      confidence = 0.75;
    }
  }
  
  return {
    distribution,
    reasoning,
    confidence
  };
};

/**
 * カラー配分統計計算
 * デッキの色分布から統計情報を算出
 */
export const calculateColorStats = (mainCards: Record<string, number>, allCards: any[]): ColorDistribution => {
  const distribution: ColorDistribution = {
    red: 0,
    blue: 0,
    green: 0,
    yellow: 0,
    colorless: 0
  };
  
  // カード情報のマップを作成
  const cardMap = new Map(allCards.map(card => [card.cardId, card]));
  
  // 各カードの色分布を集計
  Object.entries(mainCards).forEach(([cardId, count]) => {
    const card = cardMap.get(cardId);
    if (card && card.color) {
      const color = card.color as keyof ColorDistribution;
      // colorlessは除外してレイキに関連する4色のみを集計
      if (color in distribution && color !== 'colorless') {
        distribution[color] += count;
      }
    }
  });
  
  // colorlessを除外した結果を返す（colorless: 0を含む完全なColorDistribution）
  return {
    red: distribution.red,
    blue: distribution.blue,
    green: distribution.green,
    yellow: distribution.yellow,
    colorless: 0 // 常に0（レイキでは使用しない）
  };
};

/**
 * レイキ最適化提案
 * 現在の配分から改善提案を生成
 */
export const generateOptimizationSuggestions = (
  currentReiki: ReikiCard[], 
  mainColors: ColorDistribution
): string[] => {
  const suggestions: string[] = [];
  const optimal = calculateSuggestedReiki(mainColors);
  
  // 現在の配分と最適配分の比較
  currentReiki.forEach(current => {
    const optimalCard = optimal.find(o => o.color === current.color);
    if (optimalCard) {
      const diff = optimalCard.count - current.count;
      if (Math.abs(diff) >= 2) {
        if (diff > 0) {
          suggestions.push(`${current.color}を${diff}枚増やすことを推奨`);
        } else {
          suggestions.push(`${current.color}を${Math.abs(diff)}枚減らすことを推奨`);
        }
      }
    }
  });
  
  return suggestions;
};