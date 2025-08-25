/**
 * レイキカード画像アセット管理
 */

// import type { ReikiColor } from '@/types/reiki' // 一時的にコメントアウト - Vercel環境での型認識問題回避
type ReikiColorLocal = 'red' | 'blue' | 'green' | 'yellow' | 'purple';

/**
 * レイキカード画像パス
 */
export const REIKI_IMAGE_PATHS = {
  red: '/images/reiki/reiki_red.png',
  blue: '/images/reiki/reiki_blue.png', 
  green: '/images/reiki/reiki_green.png',
  yellow: '/images/reiki/reiki_yellow.png',
  purple: '/images/reiki/reiki_purple.png'
} as const satisfies Record<ReikiColorLocal, string>

/**
 * レイキカード画像URL取得
 */
export const getReikiImageUrl = (color: ReikiColorLocal): string => {
  return REIKI_IMAGE_PATHS[color]
}

/**
 * レイキカード表示名
 */
export const REIKI_COLOR_NAMES = {
  red: '赤レイキ',
  blue: '青レイキ',
  green: '緑レイキ', 
  yellow: '黄レイキ',
  purple: '紫レイキ'
} as const satisfies Record<ReikiColorLocal, string>

/**
 * レイキカードカラーコード（UI用）
 */
export const REIKI_COLOR_CODES = {
  red: '#ef4444',     // CNP red
  blue: '#3b82f6',    // CNP blue
  green: '#10b981',   // CNP green
  yellow: '#f59e0b',  // CNP yellow
  purple: '#8b5cf6'   // CNP purple
} as const satisfies Record<ReikiColorLocal, string>

/**
 * Tailwind CSS クラス
 */
export const REIKI_TAILWIND_CLASSES = {
  red: 'bg-red-500 text-white',
  blue: 'bg-blue-500 text-white',
  green: 'bg-green-500 text-white',
  yellow: 'bg-yellow-500 text-white',
  purple: 'bg-purple-500 text-white'
} as const satisfies Record<ReikiColorLocal, string>