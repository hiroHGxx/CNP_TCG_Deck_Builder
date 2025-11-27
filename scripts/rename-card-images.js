import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// カードデータの読み込み
const cardsPath = path.join(__dirname, '../src/data/cards.json');
const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf-8'));

// 画像ディレクトリ
const imagesDir = path.join(__dirname, '../public/images/cards');

// ファイル名に使用できない文字を置換
function sanitizeFilename(name) {
  return name
    .replace(/[/\\?%*:|"<>]/g, '_') // 使用できない文字を_に
    .replace(/\s+/g, '_')            // スペースを_に
    .replace(/！/g, '')               // 全角！を削除
    .replace(/!+/g, '')               // !を削除
    .replace(/:/g, '')                // :を削除
    .replace(/・/g, '_')              // ・を_に
    .replace(/__+/g, '_')            // 連続する_を1つに
    .replace(/^_|_$/g, '');          // 先頭末尾の_を削除
}

// メイン処理
async function main() {
  console.log(`📝 カード画像ファイル名変更開始: ${cards.length}枚\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const { cardId, name } = card;

    const oldFilename = `${cardId}.png`;
    const oldPath = path.join(imagesDir, oldFilename);

    // ファイルが存在しない場合はスキップ
    if (!fs.existsSync(oldPath)) {
      console.log(`⚠️  [${i + 1}/${cards.length}] ${cardId}: ファイルが存在しません`);
      skipCount++;
      continue;
    }

    const sanitizedName = sanitizeFilename(name);
    const newFilename = `${cardId}_${sanitizedName}.png`;
    const newPath = path.join(imagesDir, newFilename);

    // すでに変更済みの場合はスキップ
    if (fs.existsSync(newPath)) {
      console.log(`⏭️  [${i + 1}/${cards.length}] ${cardId}: すでに変更済み`);
      skipCount++;
      continue;
    }

    try {
      fs.renameSync(oldPath, newPath);
      console.log(`✅ [${i + 1}/${cards.length}] ${oldFilename} → ${newFilename}`);
      successCount++;
    } catch (error) {
      console.error(`❌ [${i + 1}/${cards.length}] ${cardId}: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n📊 ファイル名変更完了');
  console.log(`✅ 変更: ${successCount}枚`);
  console.log(`⏭️  スキップ: ${skipCount}枚`);
  console.log(`❌ エラー: ${errorCount}枚`);
}

main().catch(console.error);
