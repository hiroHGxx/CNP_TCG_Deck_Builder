# CNP TCG Deck Builder — Technical Specifications v2.0

*Version 2.0 – 2025‑07‑27*

---

## 📋 概要

レイキカードシステムと統合UI設計のための技術仕様書。実装時の詳細ガイドラインと実装例を提供。

---

## 🎯 1. レイキカードシステム実装仕様

### 1.1 データ構造

```typescript
// types/reiki.ts
export interface ReikiCard {
  color: 'red' | 'blue' | 'green' | 'yellow';
  count: number; // 0-15
}

export interface ColorDistribution {
  red: number;
  blue: number; 
  green: number;
  yellow: number;
  colorless: number;
}
```

### 1.2 推奨アルゴリズム

```typescript
// utils/reikiCalculation.ts
export const calculateSuggestedReiki = (
  mainColors: ColorDistribution
): ReikiCard[] => {
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
    const suggested = Math.floor(ratio * 15);
    suggestions.push({ color, count: suggested });
    remaining -= suggested;
  });
  
  // 余りを主要色に配分
  const primaryColor = (['red', 'blue', 'green', 'yellow'] as const)
    .reduce((a, b) => mainColors[a] > mainColors[b] ? a : b);
  const primaryIndex = suggestions.findIndex(s => s.color === primaryColor);
  suggestions[primaryIndex].count += remaining;
  
  return suggestions;
};
```

### 1.3 バリデーションルール

```typescript
// utils/reikiValidation.ts
export const validateReikiDeck = (cards: ReikiCard[]): ReikiValidationResult => {
  const total = cards.reduce((sum, card) => sum + card.count, 0);
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 基本検証
  if (total !== 15) {
    errors.push(`レイキデッキは15枚である必要があります (現在: ${total}枚)`);
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
  
  // 推奨事項
  const emptyColors = cards.filter(c => c.count === 0);
  if (emptyColors.length >= 3) {
    warnings.push('3色以上が0枚です。色均衡を考慮してください。');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    totalCards: total,
    colorBalance: cards.reduce((acc, card) => {
      acc[card.color] = card.count;
      return acc;
    }, {} as Record<ReikiColor, number>),
    suggestions: generateSuggestions(cards)
  };
};
```

---

## 🎨 2. 統合UI実装仕様

### 2.1 レイアウト構造

```tsx
// components/layout/IntegratedLayout.tsx
export const IntegratedLayout: React.FC = () => {
  return (
    <div className="h-screen flex flex-col">
      {/* ヘッダー */}
      <header className="bg-white border-b px-6 py-4">
        <h1>CNP TCG Deck Builder</h1>
      </header>
      
      {/* メインコンテンツ */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左側: カードエリア */}
        <main className="flex-1 flex flex-col">
          <FilterBar />
          <div className="flex-1 overflow-auto p-6">
            <CardGrid />
          </div>
        </main>
        
        {/* 右側: デッキエリア */}
        <aside className="w-80 bg-gray-50 border-l flex flex-col">
          <DeckSidebar />
        </aside>
      </div>
    </div>
  );
};
```

### 2.2 DeckSidebar設計

```tsx
// components/deck/DeckSidebar.tsx
export const DeckSidebar: React.FC = () => {
  const { mainCards, reikiCards } = useDeckStore();
  const mainTotal = Object.values(mainCards).reduce((sum, count) => sum + count, 0);
  const reikiTotal = reikiCards.reduce((sum, card) => sum + card.count, 0);
  
  return (
    <div className="flex-1 flex flex-col p-4 space-y-6">
      {/* ヘッダー統計 */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">デッキ構築</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>メイン: {mainTotal}/50</div>
          <div>レイキ: {reikiTotal}/15</div>
        </div>
        <DeckProgressBar main={mainTotal} reiki={reikiTotal} />
      </div>
      
      {/* 色均衡表示 */}
      <ColorBalanceDisplay />
      
      {/* メインデッキリスト */}
      <div className="flex-1 space-y-4 overflow-auto">
        <MainDeckList />
        <ReikiDeckManager />
      </div>
      
      {/* アクションボタン */}
      <div className="space-y-2">
        <button className="w-full btn-primary">デッキ保存</button>
        <button className="w-full btn-secondary">エクスポート</button>
        <button className="w-full btn-danger">クリア</button>
      </div>
    </div>
  );
};
```

### 2.3 CardThumbnail拡張

```tsx
// components/cards/CardThumbnail.tsx (拡張)
export const CardThumbnail: React.FC<CardThumbnailProps> = ({ 
  card, onAdd, showCount 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const deckCount = useDeckStore(state => state.mainCards[card.cardId] || 0);
  const maxCopies = getMaxCopies(card.rarity);
  
  return (
    <div 
      className="relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onAdd?.(card.cardId)}
    >
      {/* カード画像 */}
      <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100">
        <img 
          src={card.imageUrl}
          alt={card.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* +ボタンオーバーレイ */}
        {isHovered && deckCount < maxCopies && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
              +
            </div>
          </div>
        )}
        
        {/* 枚数バッジ */}
        {deckCount > 0 && (
          <div className="absolute bottom-1 right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center">
            {deckCount}/{maxCopies}
          </div>
        )}
      </div>
      
      {/* カード情報 */}
      <div className="p-2 space-y-1">
        <h3 className="text-sm font-semibold text-gray-900 truncate">
          {card.name}
        </h3>
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>コスト: {card.cost}</span>
          <span className="capitalize">{card.rarity}</span>
        </div>
      </div>
    </div>
  );
};
```

---

## 🔧 3. 状態管理実装仕様

### 3.1 ReikiStore実装

```typescript
// stores/reikiStore.ts
interface ReikiState {
  cards: ReikiCard[];
  
  // Actions
  setColor: (color: ReikiColor, count: number) => void;
  increment: (color: ReikiColor) => void;
  decrement: (color: ReikiColor) => void;
  clear: () => void;
  applySuggestion: (mainColors: ColorDistribution) => void;
  
  // Getters
  getTotalCount: () => number;
  getColorCount: (color: ReikiColor) => number;
  validate: () => ReikiValidationResult;
  isValid: () => boolean;
}

export const useReikiStore = create<ReikiState>((set, get) => ({
  cards: [
    { color: 'red', count: 0 },
    { color: 'blue', count: 0 },
    { color: 'green', count: 0 },
    { color: 'yellow', count: 0 }
  ],
  
  setColor: (color, count) => {
    const clampedCount = Math.max(0, Math.min(15, count));
    set(state => ({
      cards: state.cards.map(card => 
        card.color === color ? { ...card, count: clampedCount } : card
      )
    }));
  },
  
  increment: (color) => {
    const current = get().getColorCount(color);
    const total = get().getTotalCount();
    if (total < 15 && current < 15) {
      get().setColor(color, current + 1);
    }
  },
  
  decrement: (color) => {
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
  
  applySuggestion: (mainColors) => {
    const suggested = calculateSuggestedReiki(mainColors);
    set({ cards: suggested });
  },
  
  getTotalCount: () => {
    return get().cards.reduce((sum, card) => sum + card.count, 0);
  },
  
  getColorCount: (color) => {
    return get().cards.find(card => card.color === color)?.count || 0;
  },
  
  validate: () => {
    return validateReikiDeck(get().cards);
  },
  
  isValid: () => {
    return get().validate().isValid;
  }
}));
```

### 3.2 DeckStore拡張

```typescript
// stores/deckStore.ts (拡張)
interface DeckState {
  // v2.0: 分離されたデッキ
  mainCards: Record<string, number>;
  reikiCards: ReikiCard[];
  name: string;
  
  // メインデッキ操作
  addMainCard: (cardId: string) => void;
  removeMainCard: (cardId: string) => void;
  setMainCardCount: (cardId: string, count: number) => void;
  clearMainDeck: () => void;
  
  // レイキデッキ操作
  setReikiCards: (cards: ReikiCard[]) => void;
  clearReikiDeck: () => void;
  
  // 統合操作
  clearAllDecks: () => void;
  validateFullDeck: () => DeckValidationResult;
  
  // 永続化
  saveDeck: () => string;
  loadDeck: (deckId: string) => Promise<void>;
  exportDeck: () => string;
  importDeck: (data: string) => void;
  
  // 統計
  getMainDeckStats: () => MainDeckStats;
  getReikiDeckStats: () => ReikiDeckStats;
  getOverallStats: () => OverallDeckStats;
}
```

---

## 📱 4. レスポンシブ対応仕様

### 4.1 ブレークポイント設計

```typescript
// styles/responsive.ts
export const breakpoints = {
  mobile: '320px',
  tablet: '768px', 
  desktop: '1024px',
  large: '1280px'
} as const;

export const layouts = {
  mobile: {
    // 縦スタック: フィルタ → カード → デッキ（下部ドロワー）
    direction: 'column',
    deckArea: 'drawer' // 下部スライドアップ
  },
  tablet: {
    // 2カラム: カード（左） + デッキ（右、狭め）
    direction: 'row',
    deckWidth: '240px'
  },
  desktop: {
    // 2カラム: カード（左） + デッキ（右、標準）
    direction: 'row', 
    deckWidth: '320px'
  }
};
```

### 4.2 レスポンシブ実装

```tsx
// hooks/useResponsive.ts
export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) setScreenSize('mobile');
      else if (width < 1024) setScreenSize('tablet');
      else setScreenSize('desktop');
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  return screenSize;
};

// レスポンシブレイアウト
export const ResponsiveLayout: React.FC = () => {
  const screenSize = useResponsive();
  const [isDeckDrawerOpen, setIsDeckDrawerOpen] = useState(false);
  
  if (screenSize === 'mobile') {
    return (
      <MobileLayout 
        isDeckDrawerOpen={isDeckDrawerOpen}
        onToggleDrawer={() => setIsDeckDrawerOpen(!isDeckDrawerOpen)}
      />
    );
  }
  
  return <DesktopLayout deckWidth={layouts[screenSize].deckWidth} />;
};
```

---

## 🧪 5. テスト仕様

### 5.1 単体テスト

```typescript
// tests/reiki/reikiStore.test.ts
describe('ReikiStore', () => {
  beforeEach(() => {
    useReikiStore.getState().clear();
  });
  
  test('should increment color count', () => {
    const { increment, getColorCount } = useReikiStore.getState();
    
    increment('red');
    expect(getColorCount('red')).toBe(1);
  });
  
  test('should not exceed 15 total cards', () => {
    const { setColor, getTotalCount } = useReikiStore.getState();
    
    setColor('red', 10);
    setColor('blue', 6); // Should be clamped
    
    expect(getTotalCount()).toBe(15);
  });
  
  test('should apply suggestion correctly', () => {
    const { applySuggestion, cards } = useReikiStore.getState();
    const mainColors = { red: 20, blue: 15, green: 10, yellow: 5, colorless: 0 };
    
    applySuggestion(mainColors);
    
    expect(cards.find(c => c.color === 'red')?.count).toBeGreaterThan(
      cards.find(c => c.color === 'yellow')?.count
    );
  });
});
```

### 5.2 統合テスト

```typescript
// tests/integration/deckBuilder.test.ts
describe('Deck Builder Integration', () => {
  test('should build complete deck with main and reiki cards', async () => {
    const { addMainCard, setReikiCards, validateFullDeck } = useDeckStore.getState();
    
    // メインデッキ構築
    for (let i = 0; i < 50; i++) {
      addMainCard(`card-${i % 20}`); // 20種類のカードを重複使用
    }
    
    // レイキデッキ設定
    setReikiCards([
      { color: 'red', count: 6 },
      { color: 'blue', count: 4 },
      { color: 'green', count: 3 },
      { color: 'yellow', count: 2 }
    ]);
    
    const validation = validateFullDeck();
    expect(validation.isValid).toBe(true);
    expect(validation.mainDeck.totalCards).toBe(50);
    expect(validation.reikiDeck.totalCards).toBe(15);
  });
});
```

---

## 🚀 6. 実装フェーズ詳細

### Phase 1: 基盤実装 (2日)
```bash
# Day 1: 型定義・ストア
- [x] types/reiki.ts 作成
- [x] card.ts 拡張
- [ ] stores/reikiStore.ts 実装
- [ ] stores/deckStore.ts 拡張

# Day 2: 基本UI
- [ ] ReikiManager コンポーネント
- [ ] 基本バリデーション
- [ ] 推奨アルゴリズム実装
```

### Phase 2: 統合UI (3日)
```bash
# Day 3-4: レイアウト
- [ ] IntegratedLayout 実装
- [ ] DeckSidebar 再設計
- [ ] レスポンシブ対応

# Day 5: カード拡張
- [ ] CardThumbnail 枚数バッジ
- [ ] +ボタンオーバーレイ
- [ ] フィルタ統合
```

### Phase 3: 最適化 (2日)
```bash
# Day 6: 機能強化
- [ ] バリデーション完全実装
- [ ] 統計表示改良
- [ ] エラーハンドリング

# Day 7: テスト・デプロイ
- [ ] E2Eテスト作成
- [ ] パフォーマンス最適化
- [ ] 本番デプロイ
```

---

*最終更新: 2025-07-27*  
*実装開始予定: Phase 1から順次実行*