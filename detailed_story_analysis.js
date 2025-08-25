import fs from 'fs';
const cards = JSON.parse(fs.readFileSync('src/data/cards.json', 'utf8'));

console.log('=== CNP TCG 詳細ストーリー分析 ===\n');

// プロローグシリーズの抽出
const prologueCards = cards.filter(card => 
  card.flavorText.includes('プロローグ')
).sort((a, b) => {
  const aNum = a.flavorText.match(/プロローグ[①-⑨]/);
  const bNum = b.flavorText.match(/プロローグ[①-⑨]/);
  if (aNum && bNum) {
    return aNum[0].localeCompare(bNum[0]);
  }
  return 0;
});

console.log('=== プロローグストーリー（時系列順） ===');
prologueCards.forEach((card, index) => {
  console.log(`${index + 1}. ${card.name} (${card.color})`);
  console.log(`   ${card.flavorText}\n`);
});

// キャラクター・場所・概念の詳細分析
console.log('=== 重要キーワード詳細分析 ===');
const keywords = {
  '人物・勢力': ['セイドウ', 'CNP', 'ミタマ', 'セツナ', 'トワ', 'ナルカミ'],
  '場所・文明': ['カグツチ', 'ミズチ', 'フジン', 'イナリ', 'アクアノーヴァ', 'メテオラス', 'ミッドガン'],
  '重要アイテム': ['三種の神器', '神器', '形代', '式神'],
  '種族': ['ドワーフ', 'オーガ', 'エルフ', 'フェアリー', 'ウッドレイス', 'エイリアン'],
  '概念': ['守り神', '冥導士', '魂魄', '貿易', '次元', '異世界']
};

Object.entries(keywords).forEach(([category, words]) => {
  console.log(`\n【${category}】`);
  words.forEach(word => {
    const mentions = cards.filter(card => card.flavorText.includes(word));
    if (mentions.length > 0) {
      console.log(`${word}: ${mentions.length}回登場`);
      // 最も興味深い言及を1つ表示
      const example = mentions[0];
      const excerpt = example.flavorText.length > 80 
        ? example.flavorText.substring(0, 80) + '...' 
        : example.flavorText;
      console.log(`  例: "${excerpt}" (${example.name})`);
    }
  });
});

// BT2シリーズ（魂魄の冥導士）の特徴分析
console.log('\n=== BT2「魂魄の冥導士」シリーズ分析 ===');
const bt2Cards = cards.filter(card => card.pack === '魂魄の冥導士');
console.log(`BT2カード数: ${bt2Cards.length}枚`);

const bt2Keywords = ['冥導士', '魂魄', '貿易', 'ミッドガン', 'コロニー', 'エイリアン'];
bt2Keywords.forEach(keyword => {
  const count = bt2Cards.filter(card => card.flavorText.includes(keyword)).length;
  if (count > 0) {
    console.log(`${keyword}: ${count}回登場`);
  }
});