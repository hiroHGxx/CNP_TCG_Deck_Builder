# Board Simulator 設計書

*作成日: 2025-08-05*
*プロジェクト: CNP TCG Deck Builder*
*バージョン: v1.0*

## 📋 要件定義

### 🎯 プロジェクト概要
CNP TCG Deck Builderに新機能「Board Simulator」を追加し、ユーザーが自由に盤面を作成してスクリーンショット共有できるシステムを構築する。

### 🎮 機能要件

#### コア機能
1. **盤面構築機能**
   - 横長プレイマット（公式レイアウト準拠）
   - 相手手札エリア（プレイマット上部）
   - 自分手札エリア（プレイマット下部）
   - ドラッグ&ドロップによるカード配置

2. **カード操作機能**
   - 下部横スライダーでのカード選択（メイン・レイキカード）
   - ダブルクリックによる90度回転（レスト状態）
   - ドラッグによるカード削除（元の位置に戻す）
   - 裏向きカード機能（2種類：ゴールド・グレー）

3. **出力機能**
   - スクリーンショット機能
   - 高解像度画像出力（SNS投稿用）

#### 非機能要件
- **パフォーマンス**: スムーズなドラッグ&ドロップ操作
- **互換性**: 既存デッキビルダーへの影響なし
- **保守性**: 独立したコンポーネント設計
- **拡張性**: 将来のオンライン共有機能準備

### 🚫 スコープ外
- オンライン共有機能（将来機能として検討）
- 自動SNS投稿機能
- 複数ユーザー同時編集
- 盤面データの永続化（localStorage以外）

---

## 🎨 UI/UX設計

### 🖼️ レイアウト構成

```
┌─────────────────────────────────────────────────────────────────┐
│ CNP TCG Deck Builder - Board Simulator                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │           相手手札エリア（横長・薄グレー）                     │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │                                                           │   │
│  │           横長プレイマット（公式レイアウト）                  │   │
│  │                                                           │   │
│  │   [トラッシュ]  [レイキエリア]      [デッキ]               │   │
│  │                                                           │   │
│  │      [ゲージ1]  [ゲージ2]  [ゲージ3]                      │   │
│  │                                                           │   │
│  │  [ユニット1][ユニット2][ユニット3][ユニット4][ユニット5]   │   │
│  │                                                           │   │
│  │           [サポーター・イベントエリア]                      │   │
│  │                                                           │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │            自分手札エリア（横長・薄ブルー）                   │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  [メイン] [レイキ] [裏面]  ◀──── カードスライダー ────▶      │   │
│  │  [カード1][カード2][カード3][カード4][カード5]...           │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [クリアボタン] [スクリーンショット] [ヘルプ]                    │
└─────────────────────────────────────────────────────────────────┘
```

### 🎛️ インタラクション設計

#### ドラッグ&ドロップ操作
1. **カード選択**: 下部スライダーからカードを選択
2. **ドラッグ開始**: マウスダウンでドラッグ開始、半透明表示
3. **ドロップターゲット**: 有効エリアはハイライト表示
4. **配置完了**: ドロップでカード配置、元の位置は空になる
5. **削除操作**: カードを下部エリアにドラッグして削除

#### カード操作
- **ダブルクリック**: 90度時計回りに回転（レスト状態切り替え）
- **右クリック**: コンテキストメニュー表示（削除・回転・裏返し）
- **ホバー**: カード詳細ツールチップ表示（既存機能活用）

### 🎨 ビジュアルデザイン

#### カラーパレット
```css
/* プレイマット */
--playmat-background: #f8f9fa;
--playmat-border: #dee2e6;
--drop-zone-active: #e3f2fd;
--drop-zone-hover: #bbdefb;

/* 手札エリア */
--opponent-hand: #ffebee;
--player-hand: #e8f5e9;

/* カードスライダー */
--slider-background: #ffffff;
--slider-shadow: rgba(0, 0, 0, 0.1);
```

#### スペーシング
- プレイマット: 1200px × 800px
- カードサイズ: 既存CardThumbnailサイズ準拠
- ドロップゾーン: 100px × 140px（カードサイズ + マージン）
- 手札エリア: 1200px × 80px

---

## 💻 技術仕様

### 🏗️ アーキテクチャ設計

#### コンポーネント構成
```
src/
├── pages/
│   └── BoardSimulator.tsx              # メインページ
├── components/
│   └── board/
│       ├── PlaymatArea.tsx             # プレイマット本体
│       ├── HandArea.tsx                # 手札エリア
│       ├── CardSlider.tsx              # カード選択スライダー
│       ├── DropZone.tsx                # ドロップ可能エリア
│       ├── DraggableCard.tsx           # ドラッグ可能カード
│       └── ScreenshotButton.tsx        # スクリーンショット機能
├── hooks/
│   ├── useDragAndDrop.ts               # D&D状態管理
│   ├── useBoardState.ts                # 盤面状態管理
│   └── useScreenshot.ts                # スクリーンショット機能
├── types/
│   └── board.ts                        # Board Simulator専用型定義
└── utils/
    ├── boardLayout.ts                  # レイアウト計算
    └── cardRotation.ts                 # カード回転処理
```

### 🔧 技術スタック

#### 既存技術の活用
- **React 18**: 既存のコンポーネントシステム
- **TypeScript**: 型安全性確保
- **Tailwind CSS**: 既存デザインシステム準拠
- **Zustand**: 状態管理（新規ストア作成）

#### 新規導入予定
- **react-dnd**: ドラッグ&ドロップライブラリ
- **html2canvas**: スクリーンショット生成
- **react-slider**: カードスライダー実装

### 📊 データ構造設計

#### 型定義
```typescript
// Board Simulator専用型定義
interface BoardState {
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

interface PlacedCard {
  id: string;                    // 一意ID（配置インスタンス用）
  card: Card | BackCard;         // カードデータ
  position: CardPosition;        // 配置位置
  rotation: 0 | 90 | 180 | 270;  // 回転角度
  isRested: boolean;             // レスト状態
}

interface CardPosition {
  area: PlaymatArea;
  slot?: number;                 // ユニットエリアの場合のスロット番号
  x?: number;                    // 自由配置の場合の座標
  y?: number;
}

interface BackCard {
  id: 'back-gold' | 'back-gray';
  name: '裏面（ゴールド）' | '裏面（グレー）';
  imageUrl: string;
  type: 'back';
}

type PlaymatArea = 
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
```

#### 状態管理パターン
```typescript
// Zustand ストア設計
interface BoardStore {
  // 状態
  boardState: BoardState;
  
  // アクション
  placeCard: (card: Card | BackCard, position: CardPosition) => void;
  removeCard: (cardId: string) => void;
  rotateCard: (cardId: string) => void;
  clearBoard: () => void;
  
  // UI操作
  setCardType: (type: 'main' | 'reiki' | 'back') => void;
  setBackType: (type: 'gold' | 'gray') => void;
  setDragState: (state: DragState | null) => void;
}
```

### 🔄 実装フロー

#### Phase 1: 基盤構築（2-3時間）
1. ✅ BoardSimulator.tsx ページ作成
2. ✅ 基本レイアウト実装（プレイマット・手札エリア）
3. ✅ Navigation追加（既存Layout.tsx修正）
4. ✅ 基本ルーティング設定

#### Phase 2: カード選択システム（2-3時間）
1. ✅ CardSlider.tsx 実装
2. ✅ メイン・レイキカード切り替え
3. ✅ 裏面カード選択機能
4. ✅ スライダー操作UI

#### Phase 3: ドラッグ&ドロップ（3-4時間）
1. ✅ react-dnd セットアップ
2. ✅ DraggableCard.tsx 実装
3. ✅ DropZone.tsx 実装
4. ✅ 盤面状態管理統合

#### Phase 4: 高度な操作（2-3時間）
1. ✅ カード回転機能（ダブルクリック）
2. ✅ カード削除機能（逆ドラッグ）
3. ✅ コンテキストメニュー
4. ✅ キーボードショートカット

#### Phase 5: 出力機能（1-2時間）
1. ✅ html2canvas 統合
2. ✅ 高解像度スクリーンショット
3. ✅ ファイル名生成・ダウンロード
4. ✅ エラーハンドリング

### 🧪 テスト戦略

#### 機能テスト項目
- [ ] カードドラッグ&ドロップ操作
- [ ] カード回転機能（90度刻み）
- [ ] 裏面カード配置
- [ ] スクリーンショット生成
- [ ] 異なるブラウザでの互換性
- [ ] モバイル端末での操作性

#### パフォーマンステスト
- [ ] 多数カード配置時のレスポンス
- [ ] スクリーンショット生成時間
- [ ] メモリ使用量監視

---

## 🚀 実装計画

### 📅 開発スケジュール
**総予想時間**: 10-15時間
**実装期間**: 2-3日（集中開発の場合）

### 🔀 ブランチ戦略
- **新機能ブランチ**: `feature/board-simulator`
- **メインブランチ**: `main`（安定版保持）
- **マージ戦略**: Pull Request レビュー後マージ

### 🔧 開発環境セットアップ
```bash
# 新規パッケージインストール
npm install react-dnd react-dnd-html5-backend html2canvas

# TypeScript型定義
npm install --save-dev @types/html2canvas
```

### 📋 リスク対策
- **既存機能への影響**: 完全独立設計により回避
- **パフォーマンス問題**: メモ化・最適化で対応
- **ブラウザ互換性**: プログレッシブエンハンスメント適用

---

## 🔄 将来拡張計画

### Phase 2（中期）
- **盤面データ共有**: Convex/Supabase統合
- **リアルタイム協調**: 複数ユーザー同時編集
- **テンプレート機能**: よく使う盤面の保存・読み込み

### Phase 3（長期）
- **AI支援機能**: 盤面分析・最適手順提案
- **動画キャプチャ**: 盤面変化のアニメーション記録
- **コミュニティ機能**: 投稿・評価・コメント機能

---

**設計完了日**: 2025-08-05
**次の作業**: ブランチ作成・開発環境準備
**承認者**: プロジェクトオーナー