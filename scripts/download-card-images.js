import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// カードデータの読み込み
const cardsPath = path.join(__dirname, '../src/data/cards.json');
const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf-8'));

// 保存先ディレクトリ
const outputDir = path.join(__dirname, '../public/images/cards');

// ディレクトリ作成
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 画像ダウンロード関数
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${url} (Status: ${response.statusCode})`));
        return;
      }

      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(filepath, () => {}); // エラー時はファイル削除
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// メイン処理
async function main() {
  console.log(`📥 カード画像ダウンロード開始: ${cards.length}枚`);
  console.log(`📁 保存先: ${outputDir}\n`);

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const { cardId, imageUrl, name } = card;

    if (!imageUrl) {
      console.log(`⚠️  [${i + 1}/${cards.length}] ${cardId}: 画像URLなし`);
      errorCount++;
      continue;
    }

    const filename = `${cardId}.png`;
    const filepath = path.join(outputDir, filename);

    // すでに存在する場合はスキップ
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  [${i + 1}/${cards.length}] ${cardId}: すでに存在`);
      successCount++;
      continue;
    }

    try {
      await downloadImage(imageUrl, filepath);
      console.log(`✅ [${i + 1}/${cards.length}] ${cardId}: ${name}`);
      successCount++;

      // サーバー負荷軽減のため少し待機
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ [${i + 1}/${cards.length}] ${cardId}: ${error.message}`);
      errorCount++;
      errors.push({ cardId, name, error: error.message });
    }
  }

  console.log('\n📊 ダウンロード完了');
  console.log(`✅ 成功: ${successCount}枚`);
  console.log(`❌ 失敗: ${errorCount}枚`);

  if (errors.length > 0) {
    console.log('\n⚠️  エラー詳細:');
    errors.forEach(({ cardId, name, error }) => {
      console.log(`  - ${cardId} (${name}): ${error}`);
    });
  }
}

main().catch(console.error);
