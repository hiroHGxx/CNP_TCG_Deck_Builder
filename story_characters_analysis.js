import fs from 'fs';
const cards = JSON.parse(fs.readFileSync('src/data/cards.json', 'utf8'));

console.log('=== CNP TCG キャラクター・勢力関係分析 ===\n');

// 公式設定に基づいたキーキャラクター分析
console.log('=== 主要キャラクター詳細分析 ===');
const mainCharacters = ['リーリー', 'ルナ', 'ミナモ', 'セイドウ', 'テンシュ', 'ミタマ', 'ナルカミ', 'セツナ', 'トワ'];

mainCharacters.forEach(charName => {
  const mentions = cards.filter(card => 
    card.flavorText.includes(charName) || card.name.includes(charName)
  );
  
  if (mentions.length > 0) {
    console.log(`\n【${charName}】 - ${mentions.length}回言及`);
    mentions.forEach(card => {
      console.log(`- ${card.name} (${card.color}/${card.cardType})`);
      console.log(`  "${card.flavorText.substring(0, 100)}..."`);
    });
  }
});

console.log('\n\n=== セイドウ勢力vs解放勢力 分析 ===');

// セイドウ関連
const seidouCards = cards.filter(card => 
  card.flavorText.includes('セイドウ') || 
  card.flavorText.includes('圧政') ||
  card.flavorText.includes('支配')
);

console.log(`\n【セイドウ勢力】 ${seidouCards.length}枚`);
seidouCards.slice(0, 5).forEach(card => {
  console.log(`- ${card.name}: ${card.flavorText.substring(0, 80)}...`);
});

// 抵抗・解放勢力
const liberationCards = cards.filter(card => 
  card.flavorText.includes('協力') || 
  card.flavorText.includes('守る') ||
  card.flavorText.includes('戦う') ||
  card.flavorText.includes('討伐')
);

console.log(`\n【解放・抵抗勢力】 ${liberationCards.length}枚`);
liberationCards.slice(0, 5).forEach(card => {
  console.log(`- ${card.name}: ${card.flavorText.substring(0, 80)}...`);
});

console.log('\n\n=== 各大陸・文明の状況分析 ===');

const civilizations = {
  'アクアノーヴァ(青)': cards.filter(card => card.color === 'blue' && card.flavorText.includes('アクアノーヴァ')),
  'カグツチ(赤)': cards.filter(card => card.color === 'red' && card.flavorText.includes('カグツチ')),
  'メテオラス(緑)': cards.filter(card => card.color === 'green' && card.flavorText.includes('メテオラス')),
  'ミッドガン(紫)': cards.filter(card => card.color === 'purple' && card.flavorText.includes('ミッドガン'))
};

Object.entries(civilizations).forEach(([civName, civCards]) => {
  console.log(`\n【${civName}】 ${civCards.length}枚`);
  civCards.forEach(card => {
    console.log(`- ${card.name}: ${card.flavorText.substring(0, 70)}...`);
  });
});

// 異次元・協力者の分析
console.log('\n\n=== 異次元要素・協力者分析 ===');
const dimensionalCards = cards.filter(card => 
  card.flavorText.includes('異次元') || 
  card.flavorText.includes('異世界') ||
  card.flavorText.includes('協力者') ||
  card.flavorText.includes('ミナモ')
);

dimensionalCards.forEach(card => {
  console.log(`- ${card.name} (${card.color}): ${card.flavorText.substring(0, 90)}...`);
});