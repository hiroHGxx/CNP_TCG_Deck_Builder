const fs = require('fs');
const path = require('path');

// JSONファイルのパス
const cardsJsonPath = path.join(__dirname, '..', 'src', 'data', 'cards.json');

// 色の優先順序を定義（赤・青・緑・黄・紫の順）
const colorOrder = {
  'red': 1,
  'blue': 2, 
  'green': 3,
  'yellow': 4,
  'purple': 5
};

// カードタイプの優先順序を定義（ユニット→イベント→サポーター）
const cardTypeOrder = {
  'unit': 1,
  'event': 2,
  'supporter': 3
};

function sortCardsByColor() {
  try {
    // JSONファイルを読み込み
    console.log('📖 カードデータを読み込み中...');
    const cardsData = JSON.parse(fs.readFileSync(cardsJsonPath, 'utf8'));
    
    console.log(`📊 読み込み完了: ${cardsData.length}枚のカード`);
    
    // 色別・タイプ別枚数を表示
    const colorCounts = {};
    const typeCounts = {};
    cardsData.forEach(card => {
      colorCounts[card.color] = (colorCounts[card.color] || 0) + 1;
      typeCounts[card.cardType] = (typeCounts[card.cardType] || 0) + 1;
    });
    
    console.log('📈 色別枚数:');
    Object.entries(colorCounts).forEach(([color, count]) => {
      console.log(`  ${color}: ${count}枚`);
    });
    
    console.log('📈 タイプ別枚数:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}枚`);
    });
    
    // カードを色順 → タイプ順 → コスト順 → cardID順でソート
    const sortedCards = cardsData.sort((a, b) => {
      // まず色で比較
      const colorCompare = (colorOrder[a.color] || 999) - (colorOrder[b.color] || 999);
      if (colorCompare !== 0) return colorCompare;
      
      // 同じ色の場合はカードタイプで比較（ユニット→イベント→サポーター）
      const typeCompare = (cardTypeOrder[a.cardType] || 999) - (cardTypeOrder[b.cardType] || 999);
      if (typeCompare !== 0) return typeCompare;
      
      // 同じタイプの場合はコスト順
      const costCompare = a.cost - b.cost;
      if (costCompare !== 0) return costCompare;
      
      // 同じコストの場合はcardID順
      return a.cardId.localeCompare(b.cardId);
    });
    
    // ソート結果をバックアップ
    const backupPath = cardsJsonPath + '.backup';
    fs.writeFileSync(backupPath, fs.readFileSync(cardsJsonPath));
    console.log(`💾 バックアップ作成: ${backupPath}`);
    
    // ソート済みデータを保存
    fs.writeFileSync(cardsJsonPath, JSON.stringify(sortedCards, null, 2));
    
    console.log('✅ カードデータを色順・タイプ順でソート完了！');
    console.log('📋 ソート順序: 赤 → 青 → 緑 → 黄 → 紫');
    console.log('📋 各色内: ユニット → イベント → サポーター');
    console.log('📋 各タイプ内: コスト順 → cardID順');
    
    // ソート結果のサンプルを表示
    console.log('\n📝 ソート結果サンプル（最初の15枚）:');
    sortedCards.slice(0, 15).forEach((card, index) => {
      console.log(`  ${index + 1}. ${card.cardId} (${card.color}/${card.cardType}) - ${card.name} [コスト${card.cost}]`);
    });
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
  }
}

// スクリプト実行
if (require.main === module) {
  sortCardsByColor();
}

module.exports = { sortCardsByColor };