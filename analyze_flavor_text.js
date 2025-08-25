import fs from 'fs';
const cards = JSON.parse(fs.readFileSync('src/data/cards.json', 'utf8'));

console.log('=== フレーバーテキスト分析 ===');
console.log('総カード数: ' + cards.length + '枚');

const withFlavor = cards.filter(card => card.flavorText && card.flavorText.trim() !== '');
console.log('フレーバーテキスト有り: ' + withFlavor.length + '枚');

console.log('\n=== 各色のフレーバーテキスト サンプル ===');
['red', 'blue', 'green', 'yellow', 'purple'].forEach(color => {
  const colorCards = withFlavor.filter(card => card.color === color);
  console.log('\n【' + color + '】 ' + colorCards.length + '枚');
  
  colorCards.slice(0, 3).forEach(card => {
    const preview = card.flavorText.length > 50 ? card.flavorText.substring(0, 50) + '...' : card.flavorText;
    console.log('- ' + card.name + ': ' + preview);
  });
});

console.log('\n=== 世界観キーワード分析 ===');
const allFlavorTexts = withFlavor.map(card => card.flavorText).join(' ');

// 頻出キーワードの簡単な抽出
const keywords = ['セイドウ', 'カグツチ', 'ミズチ', 'フジン', 'イナリ', '守り神', '冥導士', '魂魄', '次元'];
keywords.forEach(keyword => {
  const count = (allFlavorTexts.match(new RegExp(keyword, 'g')) || []).length;
  if (count > 0) {
    console.log(keyword + ': ' + count + '回登場');
  }
});