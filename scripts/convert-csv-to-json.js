#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * CNP TCG カードデータ変換スクリプト（CSV版）
 * CSVファイル → JSON形式（画像URL付き）
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
  'RRR': 'triple_rare',
  'SR': 'super_rare',
  'UR': 'ultra_rare'
};

// カード種の正規化
const cardTypeMap = {
  'ユニット': 'unit',
  'サポーター': 'supporter',  
  'イベント': 'event'
};

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function parseCSVData(csvData) {
  const lines = csvData.split('\n').filter(line => line.trim());
  const headers = parseCSVLine(lines[0].replace(/^\ufeff/, '')); // BOM除去
  
  console.log('CSV Headers:', headers);
  
  const cards = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length < headers.length) {
      console.warn(`Warning: Line ${i + 1} has insufficient columns, skipping`);
      continue;
    }
    
    const rowData = {};
    headers.forEach((header, index) => {
      rowData[header] = values[index] || '';
    });
    
    // カードオブジェクトを構築
    const card = {
      cardId: rowData.cardId || '',
      name: rowData.name || '',
      cost: rowData.cost === '-' ? 0 : parseInt(rowData.cost) || 0,
      color: colorMap[rowData.color] || rowData.color,
      bp: rowData.bp === '-' ? null : parseInt(rowData.bp) || null,
      supportBP: rowData.assist === '-' ? null : parseInt(rowData.assist) || null, // 助太刀BP追加
      role: rowData.trait && rowData.trait !== '-' ? rowData.trait.split('/').map(r => r.trim()) : [],
      effect: rowData.effect || '',
      flavorText: rowData.flavor || '',
      rarity: rarityMap[rowData.rarity] || rowData.rarity,
      cardType: cardTypeMap[rowData.cardType] || rowData.cardType,
      colorBalance: rowData.colorRestriction || '',
      pack: rowData.series || '',
      illustrator: rowData.illustrator || '',
      imageUrl: rowData.imageUrl || '', // 重要: 画像URLを追加
      imageFile: `${rowData.cardId}.webp` // 旧形式との互換性のため保持
    };
    
    // 必須フィールドのチェック
    if (card.cardId && card.name) {
      cards.push(card);
    } else {
      console.warn(`Warning: Skipping incomplete card at line ${i + 1}`, {
        cardId: card.cardId,
        name: card.name
      });
    }
  }
  
  return cards;
}

function main() {
  const inputFile = path.join(__dirname, '..', 'cnp_cards_full.csv');
  const outputFile = path.join(__dirname, '..', 'data', 'cards.json');
  
  // 出力ディレクトリを作成
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  try {
    console.log('Reading CSV data from:', inputFile);
    const csvData = fs.readFileSync(inputFile, 'utf-8');
    
    console.log('Parsing CSV data...');
    const cards = parseCSVData(csvData);
    
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
      byType: {},
      withImages: 0
    };
    
    cards.forEach(card => {
      stats.byColor[card.color] = (stats.byColor[card.color] || 0) + 1;
      stats.byRarity[card.rarity] = (stats.byRarity[card.rarity] || 0) + 1;
      stats.byType[card.cardType] = (stats.byType[card.cardType] || 0) + 1;
      if (card.imageUrl) {
        stats.withImages++;
      }
    });
    
    console.log('\nStatistics:');
    console.log('Total cards:', stats.total);
    console.log('Cards with images:', stats.withImages);
    console.log('By color:', stats.byColor);
    console.log('By rarity:', stats.byRarity);
    console.log('By type:', stats.byType);
    
    // サンプルカードを表示
    if (cards.length > 0) {
      console.log('\nSample card:');
      console.log(JSON.stringify(cards[0], null, 2));
    }
    
  } catch (error) {
    console.error('Error converting CSV data:', error);
    process.exit(1);
  }
}

main();