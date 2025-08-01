import { useState, useCallback } from 'react'

/**
 * カードツールチップ機能のカスタムフック
 */
export const useCardTooltip = () => {
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [touchTimeout, setTouchTimeout] = useState<number | null>(null)

  const showTooltipAt = useCallback((position: { x: number; y: number }) => {
    setTooltipPosition(position)
    setShowTooltip(true)
  }, [])

  const hideTooltip = useCallback(() => {
    setShowTooltip(false)
  }, [])

  const handleMouseEnter = useCallback((cardRef: React.RefObject<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (rect) {
      const position = {
        x: rect.left + rect.width / 2, // カード中央のX座標
        y: rect.top + window.scrollY    // スクロール位置を考慮したY座標
      }
      showTooltipAt(position)
    }
  }, [showTooltipAt])

  const handleMouseLeave = useCallback(() => {
    hideTooltip()
  }, [hideTooltip])

  // モバイル対応: ロングタップでツールチップ表示
  const handleTouchStart = useCallback((cardRef: React.RefObject<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (rect) {
      const timeout = setTimeout(() => {
        const position = {
          x: rect.left + rect.width / 2, // カード中央のX座標
          y: rect.top + window.scrollY    // スクロール位置を考慮したY座標
        }
        showTooltipAt(position)
      }, 500) // 500ms長押しでツールチップ表示
      
      setTouchTimeout(timeout)
    }
  }, [showTooltipAt])

  const handleTouchEnd = useCallback(() => {
    if (touchTimeout) {
      clearTimeout(touchTimeout)
      setTouchTimeout(null)
    }
  }, [touchTimeout])

  const handleTouchMove = useCallback(() => {
    if (touchTimeout) {
      clearTimeout(touchTimeout)
      setTouchTimeout(null)
    }
    hideTooltip()
  }, [touchTimeout, hideTooltip])

  return {
    showTooltip,
    tooltipPosition,
    handleMouseEnter,
    handleMouseLeave,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove
  }
}