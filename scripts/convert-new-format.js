#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 新形式CNP TCGカードデータ変換スクリプト
 * 新形式CSV（cnp_cards_full3.csv）→ 旧形式CSV統合
 * P-レアリティ除外 + 差分抽出 + データ統合
 */

// 色の正規化マッピング（旧形式統一）
const colorMap = {
  '赤': '赤',
  '青': '青', 
  '緑': '緑',
  '黄': '黄',
  '紫': '紫',
  '無色': '無色',
  'red': '赤',
  'blue': '青',
  'green': '緑',
  'yellow': '黄',
  'colorless': '無色'
};

// レアリティの正規化（旧形式統一）
const rarityMap = {
  'C': 'C',
  'R': 'R', 
  'RR': 'RR',
  'RRR': 'RRR',
  'SR': 'SR',
  'UR': 'UR',
  'common': 'C',
  'rare': 'R',
  'rare_rare': 'RR',
  'triple_rare': 'RRR',
  'super_rare': 'SR',
  'ultra_rare': 'UR'
};

// カード種の正規化（旧形式統一）
const cardTypeMap = {
  'ユニット': 'ユニット',
  'サポーター': 'サポーター',  
  'イベント': 'イベント',
  'unit': 'ユニット',
  'supporter': 'サポーター',
  'event': 'イベント'
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

function parseNewFormatCSV(csvData) {
  // 改行を含む複数行フィールドに対応したCSVパーサー
  const result = [];
  const headers = [];
  let currentRecord = [];
  let currentField = '';
  let inQuotes = false;
  let isFirstRow = true;
  
  // BOM除去
  const cleanData = csvData.replace(/^\ufeff/, '');
  
  for (let i = 0; i < cleanData.length; i++) {
    const char = cleanData[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      currentRecord.push(currentField.trim());
      currentField = '';
    } else if (char === '\n' && !inQuotes) {
      // 行の終端
      currentRecord.push(currentField.trim());
      
      if (isFirstRow) {
        // ヘッダー行
        headers.push(...currentRecord);
        isFirstRow = false;
      } else if (currentRecord.length >= headers.length) {
        // データ行（ヘッダー数以上のフィールドがある場合のみ）
        const rowData = {};
        headers.forEach((header, index) => {
          rowData[header] = currentRecord[index] || '';
        });
        result.push(rowData);
      }
      
      currentRecord = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  
  // 最後のレコード処理
  if (currentField || currentRecord.length > 0) {
    currentRecord.push(currentField.trim());
    if (!isFirstRow && currentRecord.length >= headers.length) {
      const rowData = {};
      headers.forEach((header, index) => {
        rowData[header] = currentRecord[index] || '';
      });
      result.push(rowData);
    }
  }
  
  console.log('新形式CSV Headers:', headers);
  console.log(`総データ行数: ${result.length}`);
  
  return result;
}

function filterParallelCards(cards) {
  // P-レアリティとSP-RRRを除外
  const filtered = cards.filter(card => 
    !card.rarity.startsWith('P-') && 
    card.rarity !== 'SP-RRR'
  );
  console.log(`P-カード・SP-RRR除外: ${cards.length}枚 → ${filtered.length}枚`);
  return filtered;
}

function convertToOldFormat(newCard) {
  // 画像URL選択（優先順位: image_normal > image_thumbnail > image_hologram_front）
  const imageUrl = newCard.image_normal || 
                   newCard.image_thumbnail || 
                   newCard.image_hologram_front || 
                   '';
  
  // テキストフィールドの改行を半角スペースに置換（CSV用クリーンアップ）
  const cleanText = (text) => {
    return text ? text.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim() : '';
  };
  
  return {
    cardId: newCard.cardNumber || '',
    name: cleanText(newCard.name || ''),
    cardType: cardTypeMap[newCard.cardType] || newCard.cardType || '',
    rarity: rarityMap[newCard.rarity] || newCard.rarity || '',
    cost: newCard.cost === '' || newCard.cost === '-' ? 0 : parseInt(newCard.cost) || 0,
    color: colorMap[newCard.color1] || newCard.color1 || '',
    bp: newCard.bp === '' || newCard.bp === '-' || newCard.bp === '0' ? null : parseInt(newCard.bp) || null,
    assist: newCard.rp === '' || newCard.rp === '-' || newCard.rp === '0' ? null : parseInt(newCard.rp) || null,
    colorRestriction: newCard.colorRestriction || '',
    trait: cleanText(newCard.trait === '' || newCard.trait === '-' ? '' : newCard.trait),
    series: newCard.seriesName || '',
    effect: cleanText(newCard.effect || ''),
    flavor: cleanText(newCard.flavorText || ''),
    illustrator: cleanText(newCard.illustrator || ''),
    imageUrl: imageUrl
  };
}

function loadExistingCards() {
  const existingFile = path.join(__dirname, '..', 'cnp_cards_full.csv');
  
  try {
    const csvData = fs.readFileSync(existingFile, 'utf-8');
    const lines = csvData.split('\n').filter(line => line.trim());
    const headers = parseCSVLine(lines[0].replace(/^\ufeff/, ''));
    
    const existingCards = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length >= headers.length) {
        const rowData = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index] || '';
        });
        existingCards.push(rowData);
      }
    }
    
    console.log(`既存データ読み込み: ${existingCards.length}枚`);
    return { headers, cards: existingCards };
  } catch (error) {
    console.error('既存データ読み込みエラー:', error);
    return { headers: [], cards: [] };
  }
}

function extractNewCards(convertedCards, existingCards) {
  // 除外対象のcardIdを定義
  const excludeCardIds = ['BT2-201', 'BE01-1', 'P-1'];
  
  // 除外対象を先にフィルタリング
  const filteredCards = convertedCards.filter(card => !excludeCardIds.includes(card.cardId));
  console.log(`除外対象cardId (${excludeCardIds.join(', ')}) を削除: ${convertedCards.length}枚 → ${filteredCards.length}枚`);
  
  const existingCardIds = existingCards.map(card => card.cardId);
  const newCards = filteredCards.filter(card => !existingCardIds.includes(card.cardId));
  const duplicates = filteredCards.filter(card => existingCardIds.includes(card.cardId));
  
  console.log(`差分抽出結果:`);
  console.log(`- 新規カード: ${newCards.length}枚`);
  console.log(`- 重複カード: ${duplicates.length}枚`);
  
  if (duplicates.length > 0) {
    console.log('重複カード一覧:');
    duplicates.forEach(card => {
      console.log(`  - ${card.cardId}: ${card.name}`);
    });
  }
  
  return newCards;
}

function mergeData(existingCards, newCards) {
  const merged = [...existingCards, ...newCards];
  
  console.log(`データ統合完了:`);
  console.log(`- 既存: ${existingCards.length}枚`);
  console.log(`- 新規: ${newCards.length}枚`);
  console.log(`- 総計: ${merged.length}枚`);
  
  return merged;
}

function generateCSV(headers, cards) {
  const csvLines = [headers.join(',')];
  
  cards.forEach(card => {
    const values = headers.map(header => {
      const value = card[header] || '';
      // 値にカンマが含まれる場合はダブルクォートで囲む
      return value.toString().includes(',') ? `"${value}"` : value;
    });
    csvLines.push(values.join(','));
  });
  
  return csvLines.join('\n');
}

function generateCSVWithBOM(headers, cards) {
  const csvContent = generateCSV(headers, cards);
  // UTF-8 BOMを追加（Excel用）
  const BOM = '\uFEFF';
  return BOM + csvContent;
}

function validateData(cards) {
  const validation = {
    total: cards.length,
    withCardId: 0,
    withName: 0,
    withImageUrl: 0,
    bySeries: {},
    byColor: {},
    byRarity: {}
  };
  
  cards.forEach(card => {
    if (card.cardId) validation.withCardId++;
    if (card.name) validation.withName++;
    if (card.imageUrl) validation.withImageUrl++;
    
    validation.bySeries[card.series] = (validation.bySeries[card.series] || 0) + 1;
    validation.byColor[card.color] = (validation.byColor[card.color] || 0) + 1;
    validation.byRarity[card.rarity] = (validation.byRarity[card.rarity] || 0) + 1;
  });
  
  return validation;
}

function main() {
  console.log('=== CNP TCG 新カードデータ統合処理開始 ===\n');
  
  // 1. 新形式データ読み込み
  const newFormatFile = path.join(__dirname, '..', 'cnp_cards_full3.csv');
  
  try {
    console.log('1. 新形式データ読み込み中...');
    const newFormatData = fs.readFileSync(newFormatFile, 'utf-8');
    const rawNewCards = parseNewFormatCSV(newFormatData);
    
    // 2. P-レアリティフィルタリング
    console.log('\n2. P-レアリティフィルタリング中...');
    const filteredCards = filterParallelCards(rawNewCards);
    
    // 3. 旧形式に変換
    console.log('\n3. 旧形式変換中...');
    const convertedCards = filteredCards.map(convertToOldFormat);
    console.log(`変換完了: ${convertedCards.length}枚`);
    
    // 4. 既存データ読み込み
    console.log('\n4. 既存データ読み込み中...');
    const existingData = loadExistingCards();
    
    // 5. 差分抽出
    console.log('\n5. 差分抽出中...');
    const newOnlyCards = extractNewCards(convertedCards, existingData.cards);
    
    // 6. データ統合
    console.log('\n6. データ統合中...');
    const mergedCards = mergeData(existingData.cards, newOnlyCards);
    
    // 7. 統合CSVファイル出力
    console.log('\n7. 統合CSVファイル出力中...');
    const outputFile = path.join(__dirname, '..', 'cnp_cards_full_merged.csv');
    const csvContent = generateCSVWithBOM(existingData.headers, mergedCards);
    fs.writeFileSync(outputFile, csvContent, 'utf-8');
    
    // 8. 検証レポート
    console.log('\n8. データ検証中...');
    const validation = validateData(mergedCards);
    
    console.log('\n=== 統合処理完了 ===');
    console.log(`出力ファイル: ${outputFile}`);
    console.log('\n統計情報:');
    console.log(`- 総カード数: ${validation.total}枚`);
    console.log(`- CardID有り: ${validation.withCardId}枚`);
    console.log(`- カード名有り: ${validation.withName}枚`);
    console.log(`- 画像URL有り: ${validation.withImageUrl}枚`);
    console.log('\nシリーズ別:');
    Object.entries(validation.bySeries).forEach(([series, count]) => {
      console.log(`  - ${series}: ${count}枚`);
    });
    console.log('\n色別:');
    Object.entries(validation.byColor).forEach(([color, count]) => {
      console.log(`  - ${color}: ${count}枚`);
    });
    console.log('\nレアリティ別:');
    Object.entries(validation.byRarity).forEach(([rarity, count]) => {
      console.log(`  - ${rarity}: ${count}枚`);
    });
    
    console.log('\n✅ 統合データ作成完了！');
    console.log('次のステップ: cnp_cards_full_merged.csvのassist列を手動メンテナンスしてください。');
    
  } catch (error) {
    console.error('❌ エラー発生:', error);
    process.exit(1);
  }
}

main();