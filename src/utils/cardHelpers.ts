/**
 * カード関連のヘルパー関数
 */

/**
 * レアリティに応じたCSSクラスを取得
 */
export const getRarityColor = (rarity: string): string => {
  switch (rarity) {
    case 'common': return 'bg-gray-100 text-gray-800'
    case 'rare': return 'bg-blue-100 text-blue-800'
    case 'rare_rare': return 'bg-purple-100 text-purple-800'
    case 'triple_rare': return 'bg-yellow-100 text-yellow-800'
    case 'super_rare': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

/**
 * 色に応じたドットのCSSクラスを取得
 */
export const getColorDot = (color: string): string => {
  switch (color) {
    case 'red': return 'bg-red-500'
    case 'blue': return 'bg-blue-500'
    case 'green': return 'bg-green-500'
    case 'yellow': return 'bg-yellow-500'
    case 'colorless': return 'bg-gray-400'
    default: return 'bg-gray-400'
  }
}

/**
 * カードのコスト表示情報を計算
 */
export const calculateCostDisplay = (colorBalance?: string, totalCost?: number) => {
  if (!colorBalance || typeof totalCost !== 'number') {
    return {
      colorCost: 0,
      colorlessCost: totalCost || 0,
      totalCost: totalCost || 0
    }
  }

  // colorBalance から色コストを抽出 (例: "緑4" -> 4)
  const colorCostMatch = colorBalance.match(/(\d+)/)
  const colorCost = colorCostMatch ? parseInt(colorCostMatch[1]) : 0
  
  // 無色コスト = 総コスト - 色コスト
  const colorlessCost = Math.max(0, totalCost - colorCost)
  
  return {
    colorCost,
    colorlessCost,
    totalCost
  }
}

/**
 * ツールチップの位置を計算
 */
export const calculateTooltipPosition = (cardRef: React.RefObject<HTMLDivElement>) => {
  const rect = cardRef.current?.getBoundingClientRect()
  if (!rect) {
    return { x: 0, y: 0 }
  }
  
  return {
    x: rect.left + rect.width / 2, // カード中央のX座標
    y: rect.top + window.scrollY    // スクロール位置を考慮したY座標
  }
}