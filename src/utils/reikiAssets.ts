/**
 * レイキカード画像アセット管理
 */

import type { ReikiColor } from '@/types/reiki'

/**
 * レイキカード画像パス
 */
export const REIKI_IMAGE_PATHS: Record<ReikiColor, string> = {
  red: '/images/reiki/reiki_red.png',
  blue: '/images/reiki/reiki_blue.png', 
  green: '/images/reiki/reiki_green.png',
  yellow: '/images/reiki/reiki_yellow.png'
} as const

/**
 * レイキカード画像URL取得
 */
export const getReikiImageUrl = (color: ReikiColor): string => {
  return REIKI_IMAGE_PATHS[color]
}

/**
 * レイキカード表示名
 */
export const REIKI_COLOR_NAMES: Record<ReikiColor, string> = {
  red: '赤レイキ',
  blue: '青レイキ',
  green: '緑レイキ', 
  yellow: '黄レイキ'
} as const

/**
 * レイキカードカラーコード（UI用）
 */
export const REIKI_COLOR_CODES: Record<ReikiColor, string> = {
  red: '#ef4444',     // CNP red
  blue: '#3b82f6',    // CNP blue
  green: '#10b981',   // CNP green
  yellow: '#f59e0b'   // CNP yellow
} as const

/**
 * Tailwind CSS クラス
 */
export const REIKI_TAILWIND_CLASSES: Record<ReikiColor, string> = {
  red: 'bg-red-500 text-white',
  blue: 'bg-blue-500 text-white',
  green: 'bg-green-500 text-white',
  yellow: 'bg-yellow-500 text-white'
} as const