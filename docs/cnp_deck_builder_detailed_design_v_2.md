# CNP TCG Deck Builder — Detailed Design Document

*Version 2.0 – 2025‑07‑27*

---

## 📋 Version 2.0 更新内容

### 🆕 主要変更点
- **レイキカードシステム** - 15枚の色リソース管理機能
- **統合UI設計** - 2カラムレイアウト（Disney Lorcana参考）
- **データ構造拡張** - メインデッキ + レイキデッキ統合管理
- **型定義拡張** - ReikiCard、拡張Deck interface

---

## 0. 目次

1. **外部設計 (UI / UX)**
   - 1.1 画面遷移図
   - 1.2 統合UI ワイヤーフレーム
   - 1.3 レイキカード管理 UI
   - 1.4 非機能 UX 要件

2. **内部設計 (アーキ / データ / コンポーネント)**
   - 2.1 技術スタックとフォルダ構成
   - 2.2 React コンポーネント詳細
   - 2.3 Zustand ストア設計（拡張版）
   - 2.4 レイキカード状態管理
   - 2.5 バリデーションロジック（レイキ対応）
   - 2.6 PWA キャッシュ戦略

3. **テスト & 運用**
   - 3.1 単体テスト（レイキ機能含む）
   - 3.2 E2E テスト
   - 3.3 CI / CD

4. **付録**
   - 4.1 TypeScript 型定義（v2.0）
   - 4.2 実装フェーズ計画

---

## 1. 外部設計 (UI / UX)

### 1.1 画面遷移図 (Site Map)

```
/home ─┬─ /deck-builder  (統合メイン画面)
       │
       ├─ /match-log     (戦績一覧)
       │    └─ /match-log/:id (詳細/編集)
       │
       └─ /stats         (統計チャート)
```

**🆕 変更点**: タブ切り替え廃止、/deck-builderが統合画面に

### 1.2 🆕 統合UI ワイヤーフレーム

#### /deck-builder (統合レイアウト)

```
┌ Header ─────────────────────────────────────────────────────────┐
│  [CNP TCG] [Deck Builder] [Match Log] [Stats]                  │
└─────────────────────────────────────────────────────────────────┘
┌ FilterBar ─────────────────────────────────┬ Deck Stats ─────────┐
│ 🔍 [検索...] 🟢🔴🟡🔵 コスト0-9 レア度▼    │ メイン 32/50        │
│ [ ] フレーバーテキスト含む                   │ レイキ 12/15        │
└─────────────────────────────────────────┘                      │
┌ Card Grid (flex-1, 3×5 display)            │ 色均衡              │
│                                            │ 🟢10 🔴8 🟡7 🔵7   │
│  ┌─────┐ ┌─────┐ ┌─────┐               │                      │
│  │IMAGE│ │IMAGE│ │IMAGE│               │ ▼ メインデッキ         │
│  │ +   │ │ +   │ │ +   │               │ ┌──┐×3 リーリー       │
│  │2/4 ⓘ│ │1/2 ⓘ│ │0/4 ⓘ│               │ ┌──┐×2 ブレイズ       │
│  └─────┘ └─────┘ └─────┘               │ ┌──┐×1 マカミ         │
│                                            │                      │
│  ┌─────┐ ┌─────┐ ┌─────┐               │ ▼ レイキデッキ         │
│  │IMAGE│ │IMAGE│ │IMAGE│               │ 🟢🟢🟢🟢🟢           │
│  │ +   │ │ +   │ │ +   │               │ 🔴🔴🔴🔴             │
│  │1/4 ⓘ│ │0/4 ⓘ│ │3/4 ⓘ│               │ 🟡🟡🟡               │
│  └─────┘ └─────┘ └─────┘               │                      │
│                                            │ [推奨配分適用]        │
│ (Infinite scroll, lazy loading)            │ CLEAR  EXPORT       │
└─────────────────────────────────────────┴────────────────────┘
```

### 1.3 🆕 レイキカード管理 UI

```
┌ レイキデッキ管理 ─────────────────────────────┐
│ 現在: 12/15 枚                              │
├─────────────────────────────────────────┤
│ 手動調整:                                  │
│ 🔴 [−] 4 [+]  🔵 [−] 3 [+]              │
│ 🟢 [−] 3 [+]  🟡 [−] 2 [+]              │
├─────────────────────────────────────────┤
│ 推奨配分 (メインデッキ色比率ベース):           │
│ 🔴5 🔵4 🟢3 🟡3                         │
│ [自動適用] [リセット]                      │
└─────────────────────────────────────────┘
```

### 1.4 UX 非機能要件

- **レスポンシブ**: ≥1024px 統合表示 / <768px DeckPanel を下部移動
- **アクセシビリティ**: レイキ色選択でスクリーンリーダー対応
- **パフォーマンス**: 116枚 + レイキUI で LCP < 2.5s 維持
- **Undo/Redo**: メイン・レイキ両方の操作履歴管理

---

## 2. 内部設計 (アーキ / データ / コンポーネント)

### 2.1 🆕 技術スタック & フォルダ構成

```
/ public
  └ card-img/ *.webp
/ data
  ├ cards.json (116枚のユニット・イベントカード)
  └ reiki-config.json (レイキカード設定)
/ src
  ├ components/
  │   ├ layout/
  │   │   IntegratedLayout.tsx      🆕
  │   │   DeckSidebar.tsx           🆕
  │   ├ cards/
  │   │   CardThumbnail.tsx         (拡張)
  │   │   CardGrid.tsx              (拡張)
  │   │   CardDetailModal.tsx
  │   ├ deck/
  │   │   DeckPanel.tsx             (再設計)
  │   │   ReikiManager.tsx          🆕
  │   │   DeckStatistics.tsx        🆕
  │   ├ filters/
  │   │   FilterBar.tsx             (拡張)
  │   │   SearchBar.tsx
  │   └ match/
  │       MatchForm.tsx
  ├ hooks/
  │   ├ useCardDB.ts
  │   ├ useDeck.ts                  (拡張)
  │   ├ useReiki.ts                 🆕
  │   └ useMatch.ts
  ├ stores/
  │   ├ deckStore.ts                (拡張)
  │   └ reikiStore.ts               🆕
  ├ types/
  │   ├ card.ts                     (拡張)
  │   └ reiki.ts                    🆕
  ├ utils/
  │   ├ deckValidation.ts           (拡張)
  │   ├ reikiCalculation.ts         🆕
  │   └ storage.ts
  └ pages/
      ├ DeckBuilder.tsx             (統合版)
      ├ MatchLog.tsx
      └ Stats.tsx
```

### 2.2 🆕 コンポーネント詳細

#### IntegratedLayout.tsx (新規)
```typescript
interface IntegratedLayoutProps {
  children: React.ReactNode
}

export const IntegratedLayout: React.FC<IntegratedLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen">
      {/* 左側: カードエリア */}
      <main className="flex-1 flex flex-col">
        <FilterBar />
        <CardGrid />
      </main>
      
      {/* 右側: デッキエリア */}
      <aside className="w-80 border-l bg-gray-50">
        <DeckSidebar />
      </aside>
    </div>
  )
}
```

#### ReikiManager.tsx (新規)
```typescript
interface ReikiManagerProps {
  reikiCards: ReikiCard[]
  onReikiChange: (cards: ReikiCard[]) => void
  mainDeckColors: ColorDistribution
}

export const ReikiManager: React.FC<ReikiManagerProps> = ({
  reikiCards, onReikiChange, mainDeckColors
}) => {
  const suggestedDistribution = calculateSuggestedReiki(mainDeckColors)
  
  return (
    <div className="space-y-4">
      <h3>レイキデッキ {getTotalReiki(reikiCards)}/15</h3>
      
      {/* 手動調整 */}
      <ReikiColorAdjuster 
        reikiCards={reikiCards}
        onChange={onReikiChange}
      />
      
      {/* 推奨配分 */}
      <ReikiSuggestion
        suggested={suggestedDistribution}
        onApply={() => onReikiChange(suggestedDistribution)}
      />
    </div>
  )
}
```

### 2.3 🆕 Zustand ストア設計（拡張版）

```typescript
// deckStore.ts (拡張)
interface DeckState {
  // メインデッキ
  mainCards: Record<string, number>  // cardId → 枚数
  
  // レイキデッキ
  reikiCards: ReikiCard[]
  
  // 操作
  addMainCard: (cardId: string) => void
  removeMainCard: (cardId: string) => void
  setMainCardCount: (cardId: string, count: number) => void
  
  // レイキ操作
  setReikiCount: (color: ReikiColor, count: number) => void
  applyReikiSuggestion: (colors: ColorDistribution) => void
  
  // バリデーション
  validateDeck: () => DeckValidationResult
  
  // 永続化
  saveDeck: () => string
  loadDeck: (deckId: string) => void
  
  // 統計
  getColorDistribution: () => ColorDistribution
  getCostCurve: () => number[]
  getTotalCards: () => { main: number, reiki: number }
}
```

### 2.4 🆕 レイキカード状態管理

```typescript
// reikiStore.ts (新規)
interface ReikiState {
  cards: ReikiCard[]
  
  // 基本操作
  setColor: (color: ReikiColor, count: number) => void
  increment: (color: ReikiColor) => void
  decrement: (color: ReikiColor) => void
  clear: () => void
  
  // 推奨機能
  applySuggestion: (mainColors: ColorDistribution) => void
  
  // バリデーション
  validate: () => ReikiValidationResult
  isValid: () => boolean
  getTotalCount: () => number
}
```

### 2.5 🆕 バリデーションロジック（レイキ対応）

```typescript
// deckValidation.ts (拡張)
export interface DeckValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  
  // メインデッキ
  mainDeck: {
    totalCards: number
    isValidCount: boolean
    cardLimitViolations: string[]
  }
  
  // レイキデッキ
  reikiDeck: {
    totalCards: number
    isValidCount: boolean
    colorBalance: ReikiColorBalance
  }
  
  // 全体
  overall: {
    colorAlignment: boolean
    suggestions: string[]
  }
}

export const validateFullDeck = (
  mainCards: Record<string, number>,
  reikiCards: ReikiCard[],
  cardDatabase: Card[]
): DeckValidationResult => {
  // 実装詳細...
}
```

---

## 3. テスト & 運用

### 3.1 🆕 単体テスト（レイキ機能含む）

```typescript
// reikiStore.test.ts
describe('ReikiStore', () => {
  test('should apply suggested distribution', () => {
    const store = useReikiStore()
    const mainColors = { red: 10, blue: 8, green: 5, yellow: 2 }
    
    store.applySuggestion(mainColors)
    
    expect(store.getTotalCount()).toBe(15)
    expect(store.cards.find(c => c.color === 'red')?.count).toBeGreaterThan(4)
  })
})

// deckValidation.test.ts
describe('Deck Validation', () => {
  test('should validate complete deck with reiki', () => {
    const result = validateFullDeck(mockMainCards, mockReikiCards, mockCardDB)
    
    expect(result.isValid).toBe(true)
    expect(result.mainDeck.totalCards).toBe(50)
    expect(result.reikiDeck.totalCards).toBe(15)
  })
})
```

### 3.2 E2E テスト（統合UI）

```typescript
// e2e/deck-builder.spec.ts
test('integrated deck building flow', async ({ page }) => {
  await page.goto('/deck-builder')
  
  // カード検索・追加
  await page.fill('[data-testid="search-input"]', 'リーリー')
  await page.click('[data-testid="card-add-button"]:first-child')
  
  // レイキ調整
  await page.click('[data-testid="reiki-red-increment"]')
  await page.click('[data-testid="apply-suggestion"]')
  
  // デッキ保存
  await page.click('[data-testid="save-deck"]')
  
  // 検証
  await expect(page.locator('[data-testid="deck-total"]')).toContainText('51/65')
})
```

---

## 4. 付録

### 4.1 🆕 TypeScript 型定義（v2.0）

```typescript
// types/card.ts (拡張)
export interface Card {
  cardId: string
  name: string
  cost: number
  color: 'red' | 'blue' | 'green' | 'yellow' | 'colorless'
  bp: number | null
  cardType: 'unit' | 'event'
  rarity: 'common' | 'rare' | 'rare_rare' | 'triple_rare' | 'super_rare'
  effect: string
  flavorText?: string
  imageUrl: string
  colorBalance?: string  // "緑4" 形式
  
  // レアリティ別制限
  maxCopies: number  // common: 4, rare: 4, rare_rare: 2, etc.
}

// types/reiki.ts (新規)
export type ReikiColor = 'red' | 'blue' | 'green' | 'yellow'

export interface ReikiCard {
  color: ReikiColor
  count: number
}

export interface ColorDistribution {
  red: number
  blue: number
  green: number
  yellow: number
  colorless: number
}

// types/deck.ts (拡張)
export interface Deck {
  deckId: string
  name: string
  
  // メインデッキ (50枚)
  mainCards: DeckCard[]
  
  // レイキデッキ (15枚)
  reikiCards: ReikiCard[]
  
  // メタデータ
  createdAt: string
  updatedAt: string
  version: string  // "2.0"
}

export interface DeckCard {
  cardId: string
  count: number
}
```

### 4.2 🆕 実装フェーズ計画

#### Phase 1: レイキ基盤実装 (2日)
- [ ] ReikiCard型定義・ストア作成
- [ ] 基本的なレイキ管理UI
- [ ] deckStore拡張（レイキ統合）

#### Phase 2: 統合UIリデザイン (3日)
- [ ] IntegratedLayout実装
- [ ] 2カラムレイアウト構築
- [ ] カードグリッド・デッキサイドバー統合

#### Phase 3: 機能拡張・最適化 (2日)
- [ ] 枚数バッジ・+ボタン追加
- [ ] レイキ推奨機能実装
- [ ] バリデーション・統計強化

#### Phase 4: QA・デプロイ (2日)
- [ ] E2Eテスト拡充
- [ ] パフォーマンス最適化
- [ ] PWA対応・本番デプロイ

---

*最終更新: 2025-07-27*  
*次回更新予定: レイキ機能実装開始時*