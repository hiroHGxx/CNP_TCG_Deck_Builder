# CNP TCG Deck Builder — Detailed Design Document

*Version 1.0 – 2025‑07‑25*

---

## 0. 目次

1. 外部設計 (UI / UX) 1.1 画面遷移図 1.2 画面ワイヤーフレーム 1.3 モーダル & ダイアログ仕様 1.4 非機能 UX 要件
2. 内部設計 (アーキ / データ / コンポーネント) 2.1 技術スタックとフォルダ構成 2.2 React コンポーネント詳細 2.3 Zustand ストア設計 2.4 IndexedDB スキーマ 2.5 バリデーションロジック 2.6 PWA キャッシュ戦略
3. テスト & 運用 3.1 単体テスト 3.2 E2E テスト 3.3 CI / CD
4. 付録 4.1 TypeScript 型定義 4.2 API エンドポイント（拡張用）

---

## 1. 外部設計 (UI / UX)

### 1.1 画面遷移図 (Site Map)

```
/home ─┬─ /deck-builder  (メイン)
       │
       ├─ /match-log     (戦績一覧)
       │    └─ /match-log/:id (詳細/編集)
       │
       └─ /stats         (統計チャート)
```

### 1.2 主要ワイヤーフレーム

#### /deck-builder

```
┌ Header ───────────────────────────────┐
│  [LOGO]  [Deck Builder] [Match Log]   │
└───────────────────────────────────────┘
┌ FilterBar (検索 + 色 + コスト) ───────┐
│ 🔍  [text] 🟢🔴🟡🔵  cost 0–9 slider │
└───────────────────────────────────────┘
┌ CardGrid (left, flex‑1)               │
│  (virtual grid 5×N)                   │
└───────────────────────────────────────┘
┌ DeckPanel (right, fixed 320px) ───────┐
│  Deck 12/50 / 色均衡 / コスト曲線      │
│  ─────────────────────────────────── │
│  ◇ card name ×N ……                   │
│  CLEAR   EXPORT                       │
└───────────────────────────────────────┘
```

#### /match-log (一覧)

```
[ + ADD MATCH ]
┌─────────────┬────────┬────┬────┐
│ Date        │ Opponent│W/L│Deck│
├─────────────┼────────┼────┼────┤
│ 2025‑07‑20  │ ヨシ     │ 〇 │ A  │
└─────────────┴────────┴────┴────┘
```

#### /match-log/\:id (詳細/編集)

フォーム + 削除ボタン。勝敗はラジオ、Deck はドロップダウン。

### 1.3 モーダル / ダイアログ仕様

| モーダル            | Trigger         | Fields                                      | Actions       |
| --------------- | --------------- | ------------------------------------------- | ------------- |
| CardDetailModal | Thumbnail click | 大画像 / 効果 / フレーバー                            | Close         |
| AddMatchModal   | +ADD MATCH      | DatePicker, Opponent, DeckSelect, W/L, Memo | Save / Cancel |

### 1.4 UX 非機能

- **レスポンシブ** : ≥1024px split view / <768px DeckPanel を Drawer に。
- **Undo/Redo** : Ctrl‑Z/Y で deck state 巻き戻し (Zustand devtools)。
- **i18n** : `en_US` stub (将来)。

---

## 2. 内部設計 (アーキ / データ / コンポーネント)

### 2.1 技術スタック & フォルダ

```
/ public
  └ card-img/ *.webp
/ data
  ├ cards.json
  └ role-tags.json (拡張用)
/ src
  ├ components/
  │   CardThumbnail.tsx
  │   CardGrid.tsx
  │   FilterBar.tsx
  │   DeckPanel.tsx
  │   CardDetailModal.tsx
  │   MatchForm.tsx
  ├ hooks/
  │   useCardDB.ts
  │   useDeck.ts
  │   useMatch.ts
  ├ pages/
  │   DeckBuilder.tsx
  │   MatchLog.tsx
  │   Stats.tsx
  ├ utils/
  │   validators.ts (Yup)
  │   storage.ts (idb-keyval wrapper)
  └ main.tsx
```

### 2.2 コンポーネント詳細 (サンプル)

```ts
// CardThumbnail.tsx
interface Props { card: Card; onAdd: (id:string)=>void }
function CardThumbnail({card,onAdd}:Props){
  return (
    <div className="w-32" onClick={()=>onAdd(card.cardId)}>
      <img src={`/card-img/${card.imageFile}`} loading="lazy" />
      <p className="text-xs text-center">{card.name}</p>
    </div>) }
```

### 2.3 Zustand ストア

```ts
interface DeckState {
  cards: Record<string, number>; // cardId → 枚数
  add(id: string): void;
  remove(id: string): void;
  clear(): void;
  validate(): DeckValidationResult;
}
```

### 2.4 IndexedDB (idb-keyval)

| Store     | Key    | Value                                   |
| --------- | ------ | --------------------------------------- |
| `matches` | uuid   | `{ date, opponent, deckId, win, memo }` |
| `decks`   | deckId | `{ name, cards[] }`                     |

### 2.5 バリデーション (Yup)

```ts
import * as yup from 'yup';
export const deckSchema = yup.object({
  cards: yup.array().of(yup.string()).max(50),
}).test('color-balance','色均衡不足', cards=> checkBalance(cards));
```

### 2.6 PWA キャッシュ

- `workbox` injectManifest
- runtime caching `/card-img/*` (CacheFirst, maxEntries 300)
- fallback HTML for offline routes

---

## 3. テスト & 運用

### 3.1 Jest + React Testing Library

- `CardGrid` filter → 正しい件数
- `useDeck` add/remove/validate

### 3.2 E2E (Playwright)

- モバイル幅 375px Deck 作成→保存→リロード保持

### 3.3 CI/CD (GitHub Actions)

```yml
- run: pnpm test
- run: pnpm build && npx lighthouse-ci https://localhost:4173
- run: vercel deploy --prod
```

---

## 4. 付録

### 4.1 TypeScript 型

```ts
export interface Card {
  cardId: string; name: string; cost: number; color: string;
  bp: number; role: string[]; effect: string; imageFile: string;
}
export interface Deck { deckId: string; name: string; cards: string[]; }
export interface Match { id:string; date:string; opponent:string; deckId:string; win:boolean; memo:string;}
```

### 4.2 将来 API (Supabase 例)

`POST /rpc/upsert_match` で JWT ユーザの行だけ upsert など。

