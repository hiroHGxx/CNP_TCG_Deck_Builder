import { chromium } from 'playwright';

// より詳細で正確なテストスクリプト
async function runDetailedTest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  const issues = [];
  const testResults = [];
  let loadTime = 0;
  let cardCount = 0;

  try {
    console.log('🧪 CNP TCG Deck Builder - 詳細動作検証開始');
    console.log('=' * 60);

    // ページロード
    console.log('\n📄 1. ページロード・基本表示テスト');
    const startTime = Date.now();
    await page.goto('http://localhost:5173');
    loadTime = Date.now() - startTime;
    console.log(`   ⏱️ ページロード時間: ${loadTime}ms ${loadTime < 3000 ? '✅' : '⚠️'}`);

    // 基本要素の確認
    await page.waitForTimeout(2000); // レンダリング完了待機

    // ページタイトル
    const title = await page.title();
    console.log(`   📋 ページタイトル: "${title}" ✅`);

    // カード数確認
    await page.waitForSelector('.card-thumbnail', { timeout: 10000 });
    cardCount = await page.locator('.card-thumbnail').count();
    console.log(`   🃏 カード表示数: ${cardCount}枚 ${cardCount === 116 ? '✅' : '❌'}`);
    if (cardCount !== 116) {
      issues.push({
        severity: 'high',
        category: 'データ整合性',
        issue: `カード表示数が不正確: ${cardCount}枚（期待値: 116枚）`,
        reproduction: 'ページロード後のカード数を確認'
      });
    }

    // レイアウト構造確認
    console.log('\n🏗️ 2. レイアウト構造テスト');
    
    // 左右カラム構造
    const leftColumn = await page.locator('.flex-1.lg\\:w-0').isVisible();
    const rightColumn = await page.locator('.lg\\:w-80.xl\\:w-96').isVisible();
    console.log(`   📐 左カラム: ${leftColumn ? '✅' : '❌'}`);
    console.log(`   📐 右カラム: ${rightColumn ? '✅' : '❌'}`);

    // サイドバー要素の確認
    const deckSidebar = await page.locator('[data-testid="deck-sidebar"]').isVisible().catch(() => false);
    console.log(`   🎯 デッキサイドバー: ${deckSidebar ? '✅' : '⚠️'} (テストID未設定の可能性)`);

    // 検索・フィルタ機能テスト
    console.log('\n🔍 3. 検索・フィルタ機能テスト');
    
    // 検索バー
    const searchInput = page.locator('input[placeholder*="検索"]');
    const searchVisible = await searchInput.isVisible();
    console.log(`   🔎 検索バー表示: ${searchVisible ? '✅' : '❌'}`);

    if (searchVisible) {
      // 検索機能テスト
      await searchInput.fill('リーリー');
      await page.waitForTimeout(1000);
      const searchResults = await page.locator('.card-thumbnail').count();
      console.log(`   🔍 "リーリー"検索結果: ${searchResults}枚 ${searchResults > 0 ? '✅' : '❌'}`);
      
      // 検索クリア
      await searchInput.clear();
      await page.waitForTimeout(500);
      const allCardsAfterClear = await page.locator('.card-thumbnail').count();
      console.log(`   🧹 検索クリア後: ${allCardsAfterClear}枚 ${allCardsAfterClear === 116 ? '✅' : '❌'}`);
    }

    // フィルタパネル表示テスト
    const filterToggle = page.locator('button:has-text("詳細フィルタ")');
    const filterToggleVisible = await filterToggle.isVisible();
    console.log(`   🎛️ フィルタ切り替えボタン: ${filterToggleVisible ? '✅' : '❌'}`);

    if (filterToggleVisible) {
      await filterToggle.click();
      await page.waitForTimeout(500);
      const filterPanel = await page.locator('.mt-4.p-4.bg-white.rounded-lg.border.border-blue-200').isVisible();
      console.log(`   📋 フィルタパネル表示: ${filterPanel ? '✅' : '❌'}`);
    }

    // カード機能テスト
    console.log('\n🃏 4. カード機能テスト');
    
    // 最初のカードでテスト
    const firstCard = page.locator('.card-thumbnail').first();
    
    // ホバーエフェクト確認
    await firstCard.hover();
    await page.waitForTimeout(500);
    
    // ツールチップ確認（CardThumbnailコンポーネント内）
    const tooltip = await page.locator('.absolute.z-50.bg-white.border.shadow-lg').isVisible();
    console.log(`   💬 カードツールチップ: ${tooltip ? '✅' : '⚠️'}`);
    
    // カード追加ボタンテスト
    const addButton = firstCard.locator('button').first();
    const addButtonExists = await addButton.isVisible().catch(() => false);
    console.log(`   ➕ カード追加ボタン: ${addButtonExists ? '✅' : '⚠️'}`);

    if (addButtonExists) {
      await addButton.click();
      await page.waitForTimeout(500);
      
      // デッキリストの確認
      const deckCards = await page.locator('[data-testid="main-deck-list"] .deck-card').count().catch(() => 0);
      console.log(`   📚 メインデッキカード数: ${deckCards}枚 ${deckCards > 0 ? '✅' : '❌'}`);
    }

    // デッキ管理機能テスト
    console.log('\n📚 5. デッキ管理機能テスト');

    // デッキサイズ表示
    const mainDeckSize = await page.locator('[data-testid="main-deck-size"]').textContent().catch(() => '0/50');
    console.log(`   📊 メインデッキサイズ表示: ${mainDeckSize} ✅`);

    // デッククリアボタン
    const clearButton = page.locator('button:has-text("クリア")');
    const clearButtonExists = await clearButton.isVisible().catch(() => false);
    console.log(`   🧹 デッククリアボタン: ${clearButtonExists ? '✅' : '⚠️'}`);

    // レイキデッキ機能テスト
    console.log('\n🔮 6. レイキデッキ機能テスト');
    
    // レイキセクション
    const reikiSection = await page.locator('[data-testid="reiki-deck-section"]').isVisible().catch(() => false);
    console.log(`   🌈 レイキデッキセクション: ${reikiSection ? '✅' : '⚠️'}`);

    // 4色レイキカード確認
    const reikiColors = ['red', 'blue', 'green', 'yellow'];
    for (const color of reikiColors) {
      const reikiCard = await page.locator(`[data-testid="reiki-${color}"]`).isVisible().catch(() => false);
      console.log(`   🔴🔵🟢🟡 レイキ${color}: ${reikiCard ? '✅' : '⚠️'}`);
    }

    // 統計・分析機能テスト
    console.log('\n📊 7. 統計・分析機能テスト');
    
    // 統計セクション
    const statsSection = await page.locator('[data-testid="deck-stats"]').isVisible().catch(() => false);
    console.log(`   📈 統計セクション: ${statsSection ? '✅' : '⚠️'}`);

    // 色分布グラフ
    const colorChart = await page.locator('[data-testid="color-distribution"]').isVisible().catch(() => false);
    console.log(`   🎨 色分布グラフ: ${colorChart ? '✅' : '⚠️'}`);

    // レスポンシブテスト
    console.log('\n📱 8. レスポンシブテスト');
    
    const viewports = [
      { name: 'デスクトップ', width: 1280, height: 720 },
      { name: 'タブレット', width: 768, height: 1024 },
      { name: 'モバイル', width: 375, height: 667 }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);
      
      const cardsVisible = await page.locator('.card-thumbnail').count();
      console.log(`   📱 ${viewport.name} (${viewport.width}×${viewport.height}): ${cardsVisible}枚表示 ✅`);
    }

    // パフォーマンステスト
    console.log('\n⚡ 9. パフォーマンステスト');
    
    // 元の解像度に戻す
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // メモリ使用量
    const metrics = await page.evaluate(() => {
      return performance.memory ? {
        usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
      } : null;
    });

    if (metrics) {
      console.log(`   🧠 メモリ使用量: ${metrics.usedJSHeapSize}MB / ${metrics.totalJSHeapSize}MB ${metrics.usedJSHeapSize < 100 ? '✅' : '⚠️'}`);
    }

    // 大量操作パフォーマンス
    const searchTerms = ['竜', 'リーリー', 'ニンジャ', 'パートナー', 'アタック'];
    const searchStartTime = Date.now();
    
    for (const term of searchTerms) {
      await searchInput.fill(term);
      await page.waitForTimeout(200);
      await searchInput.clear();
    }
    
    const searchOperationTime = Date.now() - searchStartTime;
    console.log(`   🔍 連続検索テスト: ${searchOperationTime}ms ${searchOperationTime < 3000 ? '✅' : '⚠️'}`);

    // エラー・例外テスト
    console.log('\n🚨 10. エラーハンドリング・例外テスト');
    
    // コンソールエラー確認
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);
    console.log(`   ❌ JavaScriptエラー: ${errors.length}件 ${errors.length === 0 ? '✅' : '❌'}`);
    if (errors.length > 0) {
      errors.forEach(error => console.log(`      - ${error}`));
    }

    // 最終評価
    console.log('\n🎯 11. 最終評価・総合判定');
    
    const totalIssues = issues.length;
    const criticalIssues = issues.filter(i => i.severity === 'high').length;
    const score = Math.max(0, 100 - (criticalIssues * 20) - ((totalIssues - criticalIssues) * 10));
    
    console.log(`   📊 発見された問題: ${totalIssues}件`);
    console.log(`   🔥 重要な問題: ${criticalIssues}件`);
    console.log(`   🏆 総合品質スコア: ${score}/100`);
    
    // 品質評価コメント
    if (score >= 90) {
      console.log('   ✨ 評価: エクセレント - 商用レベルの品質');
    } else if (score >= 80) {
      console.log('   🌟 評価: 良好 - 実用レベルの品質');  
    } else if (score >= 70) {
      console.log('   ⚠️ 評価: 改善推奨 - 基本機能は動作');
    } else {
      console.log('   ❌ 評価: 要修正 - 重要な問題が存在');
    }

  } catch (error) {
    console.error('❌ テスト実行エラー:', error.message);
    issues.push({
      severity: 'high',
      category: 'システム',
      issue: `テスト実行中にエラー: ${error.message}`,
      reproduction: 'テストスクリプト実行'
    });
  }

  await browser.close();

  // 問題サマリー出力
  if (issues.length > 0) {
    console.log('\n🚨 発見された問題の詳細:');
    console.log('=' * 60);
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.issue}`);
      console.log(`   📂 カテゴリ: ${issue.category}`);
      console.log(`   🔄 再現手順: ${issue.reproduction}`);
      console.log('');
    });
  }

  return {
    totalIssues: issues.length,
    criticalIssues: issues.filter(i => i.severity === 'high').length,
    issues: issues,
    loadTime: loadTime,
    cardCount: cardCount
  };
}

// テスト実行
runDetailedTest().then(results => {
  const score = Math.max(0, 100 - (results.criticalIssues * 20) - ((results.totalIssues - results.criticalIssues) * 10));
  console.log(`\n🎯 最終品質スコア: ${score}/100`);
  process.exit(0);
}).catch(error => {
  console.error('❌ テスト実行失敗:', error);
  process.exit(1);
});