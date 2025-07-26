#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * CNP TCG カードデータ変換スクリプト
 * テキストファイル → JSON形式に変換
 */

// 色の正規化マッピング
const colorMap = {
  '赤': 'red',
  '青': 'blue', 
  '緑': 'green',
  '黄': 'yellow',
  '無色': 'colorless'
};

// レアリティの正規化
const rarityMap = {
  'C': 'common',
  'R': 'rare', 
  'RR': 'rare_rare',
  'SR': 'super_rare',
  'UR': 'ultra_rare'
};

// カード種の正規化
const cardTypeMap = {
  'ユニット': 'unit',
  'サポーター': 'supporter',  
  'イベント': 'event'
};

function parseCardData(textData) {
  const cards = [];
  const cardBlocks = textData.split('---').filter(block => block.trim());
  
  cardBlocks.forEach((block, index) => {
    const lines = block.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) return;
    
    const card = {
      cardId: '',
      name: '',
      cost: 0,
      color: '',
      bp: null,
      role: [],
      effect: '',
      flavorText: '',
      rarity: '',
      cardType: '',
      colorBalance: '',
      pack: '',
      illustrator: '',
      imageFile: ''
    };
    
    let currentField = '';
    let effectLines = [];
    let flavorLines = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('カード名:')) {
        card.name = trimmed.replace('カード名:', '').trim();
      } else if (trimmed.startsWith('Card ID:')) {
        card.cardId = trimmed.replace('Card ID:', '').trim();
        // 画像ファイル名を生成（例: BT1-116.webp）
        card.imageFile = `${card.cardId}.webp`;
      } else if (trimmed.startsWith('カード種:')) {
        const typeText = trimmed.replace('カード種:', '').trim();
        card.cardType = cardTypeMap[typeText] || typeText;
      } else if (trimmed.startsWith('レアリティ:')) {
        const rarityText = trimmed.replace('レアリティ:', '').trim();
        card.rarity = rarityMap[rarityText] || rarityText;
      } else if (trimmed.startsWith('属性(色):')) {
        const colorText = trimmed.replace('属性(色):', '').trim();
        card.color = colorMap[colorText] || colorText;
      } else if (trimmed.startsWith('コスト:')) {
        const costText = trimmed.replace('コスト:', '').trim();
        card.cost = costText === '-' ? 0 : parseInt(costText) || 0;
      } else if (trimmed.startsWith('BP:')) {
        const bpText = trimmed.replace('BP:', '').trim();
        card.bp = bpText === '-' ? null : parseInt(bpText) || null;
      } else if (trimmed.startsWith('色均衡:')) {
        card.colorBalance = trimmed.replace('色均衡:', '').trim();
      } else if (trimmed.startsWith('特徴(種族):')) {
        const roleText = trimmed.replace('特徴(種族):', '').trim();
        if (roleText !== '-') {
          card.role = roleText.split('/').map(r => r.trim());
        }
      } else if (trimmed.startsWith('収録パック名:')) {
        card.pack = trimmed.replace('収録パック名:', '').trim();
      } else if (trimmed.startsWith('イラストレーター:')) {
        card.illustrator = trimmed.replace('イラストレーター:', '').trim();
      } else if (trimmed === 'カード効果:') {
        currentField = 'effect';
      } else if (trimmed === 'フレイバーテキスト:') {
        currentField = 'flavor';
      } else if (currentField === 'effect' && !trimmed.startsWith('フレイバーテキスト:') && !trimmed.startsWith('イラストレーター:')) {
        effectLines.push(trimmed);
      } else if (currentField === 'flavor' && !trimmed.startsWith('イラストレーター:')) {
        flavorLines.push(trimmed);
      }
    });
    
    // 効果文とフレーバーテキストを結合
    card.effect = effectLines.join(' ').trim();
    card.flavorText = flavorLines.join(' ').trim();
    
    // 必須フィールドのチェック
    if (card.cardId && card.name) {
      cards.push(card);
    } else {
      console.warn(`Warning: Skipping incomplete card at block ${index + 1}`, {
        cardId: card.cardId,
        name: card.name
      });
    }
  });
  
  return cards;
}

function main() {
  const inputFile = path.join(__dirname, '..', 'docs', 'cnp_cards.txt');
  const outputFile = path.join(__dirname, '..', 'data', 'cards.json');
  
  // 出力ディレクトリを作成
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  try {
    console.log('Reading card data from:', inputFile);
    const textData = fs.readFileSync(inputFile, 'utf-8');
    
    console.log('Parsing card data...');
    const cards = parseCardData(textData);
    
    console.log(`Parsed ${cards.length} cards successfully`);
    
    // JSONファイルに出力
    fs.writeFileSync(outputFile, JSON.stringify(cards, null, 2), 'utf-8');
    
    console.log('Card data converted successfully!');
    console.log('Output file:', outputFile);
    
    // 統計情報を表示
    const stats = {
      total: cards.length,
      byColor: {},
      byRarity: {},
      byType: {}
    };
    
    cards.forEach(card => {
      stats.byColor[card.color] = (stats.byColor[card.color] || 0) + 1;
      stats.byRarity[card.rarity] = (stats.byRarity[card.rarity] || 0) + 1;
      stats.byType[card.cardType] = (stats.byType[card.cardType] || 0) + 1;
    });
    
    console.log('\nStatistics:');
    console.log('Total cards:', stats.total);
    console.log('By color:', stats.byColor);
    console.log('By rarity:', stats.byRarity);
    console.log('By type:', stats.byType);
    
    // サンプルカードを表示
    if (cards.length > 0) {
      console.log('\nSample card:');
      console.log(JSON.stringify(cards[0], null, 2));
    }
    
  } catch (error) {
    console.error('Error converting card data:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseCardData };