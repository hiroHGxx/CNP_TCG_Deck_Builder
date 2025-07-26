# CNP TCG Deck Builder

ブラウザで動くCNP TCG専用のデッキビルダー＆戦績トラッカー

## 概要

- **デッキ構築**: カード検索・フィルタリング機能付きのビジュアルなデッキビルダー
- **戦績管理**: 試合結果の記録と統計表示
- **PWA対応**: オフラインでも利用可能
- **レスポンシブ**: デスクトップ・モバイル両対応

## 技術スタック

- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **状態管理**: Zustand
- **データ**: IndexedDB (idb-keyval)
- **検索**: Fuse.js
- **PWA**: Workbox

## プロジェクト構成

```
├── docs/                    # 設計書・仕様書
│   ├── cnp_deck_builder_prd_v_1.md
│   ├── cnp_deck_builder_detailed_design_v_1.md
│   └── cnp_cards.txt
├── scripts/                 # 開発用スクリプト
│   └── convert-cards.js
├── src/                     # ソースコード
│   ├── components/          # Reactコンポーネント
│   ├── hooks/              # カスタムフック
│   ├── pages/              # ページコンポーネント
│   ├── types/              # TypeScript型定義
│   └── utils/              # ユーティリティ関数
├── data/                   # カードデータ
│   └── cards.json
├── public/                 # 静的ファイル
│   └── images/
│       └── cards/          # カード画像
└── README.md
```

## 開発手順

### 1. セットアップ
```bash
npm install
```

### 2. 開発サーバー起動
```bash
npm run dev
```

### 3. カードデータ変換（必要時）
```bash
node scripts/convert-cards.js
```

## 主要機能

### MVP
- [x] カードデータのJSON化（116枚）
- [ ] デッキビルダーUI
- [ ] カード検索・フィルタ
- [ ] 戦績記録機能
- [ ] PWA対応

### 将来拡張
- クラウド同期
- QRコード共有
- NFT連携
- 多言語対応

## 開発ステータス

現在: データ変換完了、プロジェクト構造整備中

詳細は `docs/` フォルダ内の設計書を参照してください。