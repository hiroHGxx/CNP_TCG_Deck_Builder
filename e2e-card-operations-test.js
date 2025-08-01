import { chromium } from 'playwright';

// カード操作に特化した詳細テスト
async function runCardOperationsTest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  const issues = [];
  let testPassed = 0;
  let testTotal = 0;

  console.log('🧪 CNP TCG Deck Builder - カード操作詳細テスト');
  console.log('=' * 60);

  try {
    // ページロード
    await page.goto('http://localhost:5173');
    await page.waitForSelector('.card-thumbnail', { timeout: 10000 });
    await page.waitForTimeout(2000);

    console.log('\n🃏 カード操作機能の詳細検証');

    // 1. カードホバー・ツールチップテスト
    console.log('\n1️⃣ カードホバー・ツールチップ機能');
    testTotal++;
    const firstCard = page.locator('.card-thumbnail').first();
    await firstCard.hover();
    await page.waitForTimeout(800);
    
    // 複数のツールチップセレクタを試す
    const tooltipSelectors = [
      '.card-tooltip',
      '.absolute.z-50',
      '[role="tooltip"]',
      '.tooltip',
      '.absolute.bg-white.shadow-lg'
    ];
    
    let tooltipFound = false;
    for (const selector of tooltipSelectors) {
      const tooltip = await page.locator(selector).isVisible().catch(() => false);
      if (tooltip) {
        tooltipFound = true;
        console.log(`   ✅ ツールチップ表示確認 (${selector})`);
        break;
      }
    }
    
    if (!tooltipFound) {
      console.log('   ⚠️ ツールチップが見つからない - DOM構造を確認');
      // DOM構造の詳細確認
      const cardHTML = await firstCard.innerHTML();
      console.log('   📋 カードHTML構造の一部:', cardHTML.substring(0, 200) + '...');
    } else {
      testPassed++;
    }

    // 2. カード追加ボタンテスト
    console.log('\n2️⃣ カード追加ボタン機能');
    testTotal++;
    
    // カード内のボタンを探す（+ボタン）
    const addButtons = await firstCard.locator('button').all();
    console.log(`   🔍 カード内ボタン数: ${addButtons.length}個`);
    
    if (addButtons.length > 0) {
      const addButton = addButtons[0]; // 最初のボタンが+ボタンと仮定
      await addButton.click();
      await page.waitForTimeout(500);
      
      // デッキに追加されたかをいくつかの方法で確認
      const deckCheckMethods = [
        async () => await page.locator('[data-testid="main-deck-list"] .deck-card').count(),
        async () => await page.locator('.deck-card').count(),
        async () => await page.locator('.main-deck .deck-card').count(),
        async () => {
          const deckSizeText = await page.locator('*:has-text("/50")').first().textContent().catch(() => '0/50');
          return parseInt(deckSizeText.split('/')[0]) || 0;
        }
      ];
      
      let deckCount = 0;
      for (const method of deckCheckMethods) {
        try {
          deckCount = await method();
          if (deckCount > 0) break;
        } catch (e) {
          // 次の方法を試す
        }
      }
      
      console.log(`   📚 デッキに追加されたカード数: ${deckCount}枚`);
      if (deckCount > 0) {
        console.log('   ✅ カード追加機能動作確認');
        testPassed++;
      } else {
        console.log('   ❌ カード追加機能が動作していない');
        issues.push({
          severity: 'high',
          category: 'カード操作',
          issue: 'カード追加ボタンをクリックしてもデッキに追加されない',
          reproduction: '任意のカードの+ボタンをクリック'
        });
      }
    } else {
      console.log('   ❌ カード内に追加ボタンが見つからない');
      issues.push({
        severity: 'high',
        category: 'UI構造',
        issue: 'カード内に追加ボタンが存在しない',
        reproduction: 'カードコンポーネントの構造を確認'
      });
    }

    // 3. 4枚制限テスト
    console.log('\n3️⃣ 4枚制限機能');
    testTotal++;
    
    if (addButtons.length > 0) {
      const addButton = addButtons[0];
      
      // 同じカードを4回追加してみる
      for (let i = 0; i < 4; i++) {
        await addButton.click();
        await page.waitForTimeout(200);
      }
      
      // 5回目の追加を試す
      await addButton.click();
      await page.waitForTimeout(500);
      
      // 実際のデッキ内のそのカードの枚数を確認
      const cardName = await firstCard.locator('.card-name, h3, .font-bold').first().textContent().catch(() => '');
      console.log(`   🎯 テスト対象カード: "${cardName}"`);
      
      // デッキ内のカード枚数確認（4枚以下かチェック）
      let cardCountInDeck = 0;
      try {
        // カード名でデッキ内を検索
        if (cardName) {
          const deckCardElements = await page.locator(`.deck-card:has-text("${cardName}")`).all();
          if (deckCardElements.length > 0) {
            const countText = await deckCardElements[0].locator('.card-count, .badge, .quantity').textContent().catch(() => '1');
            cardCountInDeck = parseInt(countText) || 1;
          }
        }
      } catch (e) {
        console.log('   ⚠️ デッキ内カード枚数の取得に失敗');
      }
      
      console.log(`   📊 デッキ内のカード枚数: ${cardCountInDeck}枚`);
      if (cardCountInDeck <= 4) {
        console.log('   ✅ 4枚制限機能動作確認');
        testPassed++;
      } else {
        console.log('   ❌ 4枚制限が機能していない');
        issues.push({
          severity: 'medium',
          category: 'ゲームルール',
          issue: '同名カードの4枚制限が機能していない',
          reproduction: '同じカードを5回以上追加を試行'
        });
      }
    }

    // 4. 検索機能詳細テスト
    console.log('\n4️⃣ 検索機能詳細テスト');
    testTotal++;
    
    const searchInput = page.locator('input[placeholder*="検索"]');
    const searchTests = [
      { term: 'リーリー', expectedMin: 1, expectedMax: 10 },
      { term: '竜人', expectedMin: 1, expectedMax: 20 },
      { term: 'アタック', expectedMin: 10, expectedMax: 50 },
      { term: 'NotExistCard', expectedMin: 0, expectedMax: 0 }
    ];
    
    let searchTestsPassed = 0;
    for (const test of searchTests) {
      await searchInput.fill(test.term);
      await page.waitForTimeout(800);
      const resultCount = await page.locator('.card-thumbnail').count();
      
      const passed = resultCount >= test.expectedMin && resultCount <= test.expectedMax;
      console.log(`   🔍 "${test.term}": ${resultCount}件 ${passed ? '✅' : '❌'}`);
      
      if (passed) {
        searchTestsPassed++;
      }
      
      await searchInput.clear();
      await page.waitForTimeout(300);
    }
    
    if (searchTestsPassed === searchTests.length) {
      console.log('   ✅ 検索機能総合評価: 合格');
      testPassed++;
    } else {
      console.log(`   ⚠️ 検索機能総合評価: ${searchTestsPassed}/${searchTests.length} 部分的動作`);
      issues.push({
        severity: 'medium',
        category: '検索機能',
        issue: '一部の検索テストで期待される結果と異なる',
        reproduction: '各種検索キーワードでのテスト実行'
      });
    }

    // 5. フィルタ機能詳細テスト
    console.log('\n5️⃣ フィルタ機能詳細テスト');
    testTotal++;
    
    // フィルタパネルを開く
    const filterToggle = page.locator('button:has-text("詳細フィルタ")');
    await filterToggle.click();
    await page.waitForTimeout(500);
    
    // 色フィルタテスト
    const colorButtons = await page.locator('button[data-color]').all();
    console.log(`   🎨 色フィルタボタン数: ${colorButtons.length}個`);
    
    if (colorButtons.length > 0) {
      // 赤色フィルタをテスト
      const redButton = page.locator('button[data-color="red"]');
      if (await redButton.isVisible()) {
        await redButton.click();
        await page.waitForTimeout(800);
        
        const filteredCount = await page.locator('.card-thumbnail').count();
        console.log(`   🔴 赤色フィルタ結果: ${filteredCount}枚`);
        
        if (filteredCount > 0 && filteredCount < 116) {
          console.log('   ✅ 色フィルタ機能動作確認');
          testPassed++;
        } else {
          console.log('   ❌ 色フィルタが正常に動作していない');
          issues.push({
            severity: 'medium',
            category: 'フィルタ機能',
            issue: '色フィルタが期待通りに動作しない',
            reproduction: '詳細フィルタの色ボタンをクリック'
          });
        }
        
        // フィルタクリア
        await redButton.click();
        await page.waitForTimeout(500);
      }
    }

    // 6. デッククリア機能テスト
    console.log('\n6️⃣ デッククリア機能テスト');
    testTotal++;
    
    const clearButtons = await page.locator('button:has-text("クリア")').all();
    console.log(`   🧹 クリアボタン数: ${clearButtons.length}個`);
    
    if (clearButtons.length > 0) {
      await clearButtons[0].click();
      await page.waitForTimeout(500);
      
      const deckCountAfterClear = await page.locator('.deck-card').count();
      console.log(`   📚 クリア後のデッキカード数: ${deckCountAfterClear}枚`);
      
      if (deckCountAfterClear === 0) {
        console.log('   ✅ デッククリア機能動作確認');
        testPassed++;
      } else {
        console.log('   ❌ デッククリア機能が正常に動作していない');
        issues.push({
          severity: 'medium',
          category: 'デッキ管理',
          issue: 'デッククリアボタンが正常に動作しない',
          reproduction: 'デッククリアボタンをクリック'
        });
      }
    } else {
      console.log('   ⚠️ クリアボタンが見つからない');
    }

    // 7. レスポンシブ動作確認
    console.log('\n7️⃣ レスポンシブ動作確認');
    testTotal++;
    
    const mobileViewport = { width: 375, height: 667 };
    await page.setViewportSize(mobileViewport);
    await page.waitForTimeout(1000);
    
    const mobileCardCount = await page.locator('.card-thumbnail').count();
    const mobileSearchVisible = await page.locator('input[placeholder*="検索"]').isVisible();
    
    console.log(`   📱 モバイル表示: カード${mobileCardCount}枚, 検索バー${mobileSearchVisible ? '表示' : '非表示'}`);
    
    if (mobileCardCount === 116 && mobileSearchVisible) {
      console.log('   ✅ レスポンシブ対応確認');
      testPassed++;
    } else {
      console.log('   ⚠️ レスポンシブ対応に問題がある可能性');
      issues.push({
        severity: 'low',
        category: 'レスポンシブ',
        issue: 'モバイル表示で一部機能が正常に表示されない',
        reproduction: 'ブラウザを375px幅に縮小'
      });
    }
    
    // 元のサイズに戻す
    await page.setViewportSize({ width: 1280, height: 720 });

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

  // 結果サマリー
  console.log('\n📊 テスト結果サマリー');
  console.log('=' * 40);
  console.log(`✅ 成功: ${testPassed}/${testTotal} テスト`);
  console.log(`❌ 問題: ${issues.length}件`);
  
  const successRate = testTotal > 0 ? Math.round((testPassed / testTotal) * 100) : 0;
  console.log(`📈 成功率: ${successRate}%`);

  // 品質評価
  let qualityGrade = 'D';
  if (successRate >= 90) qualityGrade = 'A';
  else if (successRate >= 80) qualityGrade = 'B';
  else if (successRate >= 70) qualityGrade = 'C';
  
  console.log(`🏆 品質グレード: ${qualityGrade}`);

  // 問題詳細
  if (issues.length > 0) {
    console.log('\n🚨 発見された問題:');
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.issue}`);
      console.log(`   📂 カテゴリ: ${issue.category}`);
      console.log(`   🔄 再現手順: ${issue.reproduction}`);
      console.log('');
    });
  }

  return {
    testPassed,
    testTotal,
    successRate,
    qualityGrade,
    issues
  };
}

// テスト実行
runCardOperationsTest().then(results => {
  console.log(`\n🎯 最終評価: ${results.qualityGrade}グレード (${results.successRate}%)`);
  process.exit(0);
}).catch(error => {
  console.error('❌ テスト実行失敗:', error);
  process.exit(1);
});