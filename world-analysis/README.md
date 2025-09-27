# World Analysis Articles

考察記事と執筆プロンプトを本フォルダで管理します。デッキビルダー本体とは分離して運用します。

## フォルダ構成
- `articles/`: 実際の考察記事（Markdown）
- `prompts/`: 執筆のための入力テンプレートや指示書

## 命名規則（articles）
- 形式: `YYYY-MM-DD_slug.md`
  - 例: `2025-09-16_aquanova-analysis.md`
- スラッグは半角英数字・ハイフン推奨（日本語不可）

## 運用ルール
- 事実と仮説を明確に区別（事実＝カード/公式根拠）
- 出典カードIDを本文か末尾リストで明記（例: `(BT1-11)`)
- h2/h3 見出しで構成（h1はタイトルのみ）
- 画像はプレースホルダー「画像」を後置（差し替え時に実画像パスを設定）

## 既存ファイル
- articles/
  - `2025-08-23_why-cnp-fights.md`
  - `2025-08-28_artifacts-mystery.md`
  - `2025-09-16_aquanova-analysis.md`
- prompts/
  - `WORLD_ANALYSIS_PROMPT_TEMPLATE.md`
