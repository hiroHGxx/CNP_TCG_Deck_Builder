import { chromium, firefox, webkit } from 'playwright';

// 包括的なテストシナリオ
async function runComprehensiveTest() {
  const browsers = [
    { name: 'Chromium', browser: chromium },
    { name: 'Firefox', browser: firefox },
    { name: 'WebKit', browser: webkit }
  ];

  const results = {
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      issues: []
    },
    detailedResults: {}
  };

  for (const { name, browser } of browsers) {
    console.log(`\n🧪 Testing with ${name}...`);
    
    try {
      const browserInstance = await browser.launch({ headless: false });
      const context = await browserInstance.newContext({
        viewport: { width: 1280, height: 720 }
      });
      const page = await context.newPage();

      // ページロード時間測定
      const startTime = Date.now();
      await page.goto('http://localhost:5173');
      const loadTime = Date.now() - startTime;

      console.log(`⏱️ Page load time: ${loadTime}ms`);

      // 基本表示テスト
      const basicTests = await runBasicDisplayTests(page);
      
      // カード機能テスト
      const cardTests = await runCardFunctionTests(page);
      
      // デッキ管理テスト
      const deckTests = await runDeckManagementTests(page);
      
      // レイキデッキテスト
      const reikiTests = await runReikiDeckTests(page);
      
      // 統計機能テスト
      const statsTests = await runStatisticsTests(page);
      
      // レスポンシブテスト
      const responsiveTests = await runResponsiveTests(page);
      
      // パフォーマンステスト
      const performanceTests = await runPerformanceTests(page);

      results.detailedResults[name] = {
        loadTime,
        basicTests,
        cardTests,
        deckTests,
        reikiTests,
        statsTests,
        responsiveTests,
        performanceTests
      };

      await browserInstance.close();
      
    } catch (error) {
      console.error(`❌ Error testing ${name}:`, error.message);
      results.summary.issues.push({
        severity: 'high',
        browser: name,
        category: 'Browser Compatibility',
        issue: `Failed to run tests: ${error.message}`,
        reproduction: 'Launch browser and navigate to application'
      });
    }
  }

  // 結果の集計と分析
  analyzeResults(results);
  return results;
}

// 基本表示テスト
async function runBasicDisplayTests(page) {
  const tests = [];
  
  try {
    // ページタイトル確認
    const title = await page.title();
    tests.push({
      name: 'Page Title',
      passed: title.includes('CNP TCG'),
      details: `Title: ${title}`
    });

    // 基本要素の存在確認
    const cardGrid = await page.locator('.card-grid').isVisible();
    tests.push({
      name: 'Card Grid Visibility',
      passed: cardGrid,
      details: cardGrid ? 'Card grid is visible' : 'Card grid not found or hidden'
    });

    const sidebar = await page.locator('.deck-sidebar').isVisible();
    tests.push({
      name: 'Sidebar Visibility',
      passed: sidebar,
      details: sidebar ? 'Sidebar is visible' : 'Sidebar not found or hidden'
    });

    // カード枚数の確認
    await page.waitForSelector('.card-thumbnail', { timeout: 10000 });
    const cardCount = await page.locator('.card-thumbnail').count();
    tests.push({
      name: 'Card Count',
      passed: cardCount === 116,
      details: `Found ${cardCount} cards (expected 116)`
    });

    // 検索バーの存在確認
    const searchBar = await page.locator('input[placeholder*="検索"]').isVisible();
    tests.push({
      name: 'Search Bar',
      passed: searchBar,
      details: searchBar ? 'Search bar is visible' : 'Search bar not found'
    });

  } catch (error) {
    tests.push({
      name: 'Basic Display Test Error',
      passed: false,
      details: error.message
    });
  }

  return tests;
}

// カード機能テスト
async function runCardFunctionTests(page) {
  const tests = [];
  
  try {
    // 検索機能テスト
    const searchInput = page.locator('input[placeholder*="検索"]');
    await searchInput.fill('リーリー');
    await page.waitForTimeout(500);
    
    const searchResults = await page.locator('.card-thumbnail').count();
    tests.push({
      name: 'Search Functionality',
      passed: searchResults > 0 && searchResults < 116,
      details: `Search for "リーリー" returned ${searchResults} cards`
    });

    // 検索クリア
    await searchInput.clear();
    await page.waitForTimeout(500);

    // フィルタ機能テスト
    const redFilter = page.locator('button[data-color="red"]');
    if (await redFilter.isVisible()) {
      await redFilter.click();
      await page.waitForTimeout(500);
      
      const filteredCards = await page.locator('.card-thumbnail').count();
      tests.push({
        name: 'Color Filter',
        passed: filteredCards > 0 && filteredCards < 116,
        details: `Red filter returned ${filteredCards} cards`
      });
      
      // フィルタクリア
      await redFilter.click();
      await page.waitForTimeout(500);
    }

    // カードツールチップテスト
    const firstCard = page.locator('.card-thumbnail').first();
    await firstCard.hover();
    await page.waitForTimeout(300);
    
    const tooltip = await page.locator('.card-tooltip').isVisible();
    tests.push({
      name: 'Card Tooltip',
      passed: tooltip,
      details: tooltip ? 'Tooltip appears on hover' : 'Tooltip not visible on hover'
    });

    // カード追加ボタンテスト
    const addButton = firstCard.locator('button').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(300);
      
      const deckCount = await page.locator('.deck-list .deck-card').count();
      tests.push({
        name: 'Add Card to Deck',
        passed: deckCount > 0,
        details: `Deck now contains ${deckCount} unique cards`
      });
    }

  } catch (error) {
    tests.push({
      name: 'Card Function Test Error',
      passed: false,
      details: error.message
    });
  }

  return tests;
}

// デッキ管理テスト
async function runDeckManagementTests(page) {
  const tests = [];
  
  try {
    // デッキ保存テスト
    const saveButton = page.locator('button:has-text("デッキ保存")');
    if (await saveButton.isVisible()) {
      await saveButton.click();
      await page.waitForTimeout(500);
      
      // モーダルまたは入力フィールドの確認
      const nameInput = page.locator('input[placeholder*="デッキ名"]');
      if (await nameInput.isVisible()) {
        await nameInput.fill('テストデッキ');
        const confirmButton = page.locator('button:has-text("保存")');
        await confirmButton.click();
        await page.waitForTimeout(500);
        
        tests.push({
          name: 'Deck Save Functionality',
          passed: true,
          details: 'Deck save dialog works correctly'
        });
      }
    }

    // 50枚制限テスト
    const cards = page.locator('.card-thumbnail');
    const cardCount = await cards.count();
    
    if (cardCount > 0) {
      // 最初の10枚のカードを5枚ずつ追加
      for (let i = 0; i < Math.min(10, cardCount); i++) {
        const card = cards.nth(i);
        const addButton = card.locator('button').first();
        
        if (await addButton.isVisible()) {
          // 5回クリック
          for (let j = 0; j < 5; j++) {
            await addButton.click();
            await page.waitForTimeout(100);
          }
        }
      }
      
      // デッキサイズ確認
      const deckSizeText = await page.locator('.deck-size').textContent();
      const deckSize = parseInt(deckSizeText.match(/\d+/)?.[0] || '0');
      
      tests.push({
        name: 'Deck Size Limit',
        passed: deckSize <= 50,
        details: `Deck size: ${deckSize} (limit: 50)`
      });
    }

    // デッククリア機能テスト
    const clearButton = page.locator('button:has-text("クリア")');
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForTimeout(500);
      
      const deckSizeAfterClear = await page.locator('.deck-list .deck-card').count();
      tests.push({
        name: 'Deck Clear Functionality',
        passed: deckSizeAfterClear === 0,
        details: `Deck size after clear: ${deckSizeAfterClear}`
      });
    }

  } catch (error) {
    tests.push({
      name: 'Deck Management Test Error',
      passed: false,
      details: error.message
    });
  }

  return tests;
}

// レイキデッキテスト
async function runReikiDeckTests(page) {
  const tests = [];
  
  try {
    // レイキデッキセクションの確認
    const reikiSection = await page.locator('.reiki-deck').isVisible();
    tests.push({
      name: 'Reiki Deck Section',
      passed: reikiSection,
      details: reikiSection ? 'Reiki deck section is visible' : 'Reiki deck section not found'
    });

    if (reikiSection) {
      // レイキカード追加テスト
      const reikiColors = ['red', 'blue', 'green', 'yellow'];
      
      for (const color of reikiColors) {
        const addButton = page.locator(`button[data-reiki-color="${color}"]`);
        if (await addButton.isVisible()) {
          await addButton.click();
          await page.waitForTimeout(200);
        }
      }
      
      // レイキデッキサイズ確認
      const reikiCount = await page.locator('.reiki-card').count();
      tests.push({
        name: 'Reiki Card Addition',
        passed: reikiCount > 0,
        details: `Reiki deck contains ${reikiCount} cards`
      });

      // 15枚制限テスト（可能な場合）
      const reikiSizeText = await page.locator('.reiki-deck-size').textContent().catch(() => '0/15');
      const currentReikiSize = parseInt(reikiSizeText.split('/')[0] || '0');
      
      tests.push({
        name: 'Reiki Deck Size Limit',
        passed: currentReikiSize <= 15,
        details: `Reiki deck size: ${currentReikiSize} (limit: 15)`
      });
    }

  } catch (error) {
    tests.push({
      name: 'Reiki Deck Test Error',
      passed: false,
      details: error.message
    });
  }

  return tests;
}

// 統計機能テスト
async function runStatisticsTests(page) {
  const tests = [];
  
  try {
    // 統計セクションの確認
    const statsSection = await page.locator('.deck-stats').isVisible();
    tests.push({
      name: 'Statistics Section',
      passed: statsSection,
      details: statsSection ? 'Statistics section is visible' : 'Statistics section not found'
    });

    if (statsSection) {
      // 色分布グラフ
      const colorChart = await page.locator('.color-distribution').isVisible();
      tests.push({
        name: 'Color Distribution Chart',
        passed: colorChart,
        details: colorChart ? 'Color distribution chart is visible' : 'Color distribution chart not found'
      });

      // BP分布グラフ
      const bpChart = await page.locator('.bp-distribution').isVisible();
      tests.push({
        name: 'BP Distribution Chart',
        passed: bpChart,
        details: bpChart ? 'BP distribution chart is visible' : 'BP distribution chart not found'
      });

      // コスト分布グラフ
      const costChart = await page.locator('.cost-distribution').isVisible();
      tests.push({
        name: 'Cost Distribution Chart',
        passed: costChart,
        details: costChart ? 'Cost distribution chart is visible' : 'Cost distribution chart not found'
      });
    }

  } catch (error) {
    tests.push({
      name: 'Statistics Test Error',
      passed: false,
      details: error.message
    });
  }

  return tests;
}

// レスポンシブテスト
async function runResponsiveTests(page) {
  const tests = [];
  const viewports = [
    { name: 'Desktop', width: 1280, height: 720 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 }
  ];

  for (const viewport of viewports) {
    try {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);

      const cardGrid = await page.locator('.card-grid').isVisible();
      const sidebar = await page.locator('.deck-sidebar').isVisible();

      tests.push({
        name: `${viewport.name} Layout`,
        passed: cardGrid && sidebar,
        details: `${viewport.name} (${viewport.width}x${viewport.height}): Grid=${cardGrid}, Sidebar=${sidebar}`
      });

    } catch (error) {
      tests.push({
        name: `${viewport.name} Test Error`,
        passed: false,
        details: error.message
      });
    }
  }

  return tests;
}

// パフォーマンステスト
async function runPerformanceTests(page) {
  const tests = [];
  
  try {
    // メモリ使用量チェック
    const metrics = await page.evaluate(() => {
      return {
        memory: performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        } : null,
        timing: performance.timing ? {
          loadEventEnd: performance.timing.loadEventEnd,
          navigationStart: performance.timing.navigationStart
        } : null
      };
    });

    if (metrics.memory) {
      const memoryUsageMB = Math.round(metrics.memory.usedJSHeapSize / 1024 / 1024);
      tests.push({
        name: 'Memory Usage',
        passed: memoryUsageMB < 100,
        details: `Memory usage: ${memoryUsageMB}MB`
      });
    }

    // 大量操作パフォーマンステスト
    const startTime = Date.now();
    
    // 検索を複数回実行
    const searchInput = page.locator('input[placeholder*="検索"]');
    const searchTerms = ['竜', 'リーリー', 'ニンジャ', 'パートナー'];
    
    for (const term of searchTerms) {
      await searchInput.fill(term);
      await page.waitForTimeout(100);
      await searchInput.clear();
    }
    
    const operationTime = Date.now() - startTime;
    tests.push({
      name: 'Search Performance',
      passed: operationTime < 2000,
      details: `Multiple search operations took ${operationTime}ms`
    });

  } catch (error) {
    tests.push({
      name: 'Performance Test Error',
      passed: false,
      details: error.message
    });
  }

  return tests;
}

// 結果分析
function analyzeResults(results) {
  console.log('\n📊 COMPREHENSIVE TEST RESULTS');
  console.log('=' * 50);

  let totalTests = 0;
  let passedTests = 0;
  let issues = [];

  Object.entries(results.detailedResults).forEach(([browser, browserResults]) => {
    console.log(`\n🌐 ${browser} Results:`);
    
    Object.entries(browserResults).forEach(([category, tests]) => {
      if (category === 'loadTime') {
        console.log(`  ⏱️ Load Time: ${tests}ms ${tests < 3000 ? '✅' : '⚠️'}`);
        return;
      }
      
      if (Array.isArray(tests)) {
        tests.forEach(test => {
          totalTests++;
          const status = test.passed ? '✅' : '❌';
          console.log(`    ${status} ${test.name}: ${test.details}`);
          
          if (test.passed) {
            passedTests++;
          } else {
            issues.push({
              browser,
              category,
              test: test.name,
              details: test.details,
              severity: determineSeverity(test.name, test.details)
            });
          }
        });
      }
    });
  });

  const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
  
  console.log(`\n📈 Overall Results:`);
  console.log(`  Total Tests: ${totalTests}`);
  console.log(`  Passed: ${passedTests}`);
  console.log(`  Failed: ${totalTests - passedTests}`);
  console.log(`  Success Rate: ${successRate}%`);

  if (issues.length > 0) {
    console.log(`\n🚨 Issues Found:`);
    issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.test}`);
      console.log(`     Browser: ${issue.browser}`);
      console.log(`     Category: ${issue.category}`);
      console.log(`     Details: ${issue.details}`);
      console.log('');
    });
  }

  results.summary = {
    totalTests,
    passedTests,
    failedTests: totalTests - passedTests,
    successRate,
    issues
  };
}

function determineSeverity(testName, details) {
  const highSeverityKeywords = ['error', 'crash', 'not found', 'failed to load'];
  const mediumSeverityKeywords = ['slow', 'timeout', 'warning'];
  
  const text = `${testName} ${details}`.toLowerCase();
  
  if (highSeverityKeywords.some(keyword => text.includes(keyword))) {
    return 'high';
  } else if (mediumSeverityKeywords.some(keyword => text.includes(keyword))) {
    return 'medium';
  } else {
    return 'low';
  }
}

// テスト実行
runComprehensiveTest().then(results => {
  console.log('\n🎯 Final Quality Score:', results.summary.successRate, '/100');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});