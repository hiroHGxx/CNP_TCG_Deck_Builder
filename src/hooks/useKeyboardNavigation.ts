import { useCallback } from 'react'

/**
 * キーボードナビゲーション用カスタムフック
 */
export const useKeyboardNavigation = () => {
  /**
   * Enter/SpaceキーでのクリックハンドラーWrapper
   */
  const handleKeyDown = useCallback((
    callback: () => void,
    event: React.KeyboardEvent
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      callback()
    }
  }, [])

  /**
   * Escapeキーでのキャンセルハンドラー
   */
  const handleEscapeKey = useCallback((
    callback: () => void,
    event: React.KeyboardEvent
  ) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      callback()
    }
  }, [])

  /**
   * 矢印キーナビゲーション（グリッド内）
   */
  const handleArrowNavigation = useCallback((
    event: React.KeyboardEvent,
    totalItems: number,
    currentIndex: number,
    columnsPerRow: number,
    onIndexChange: (newIndex: number) => void
  ) => {
    let newIndex = currentIndex

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        newIndex = Math.min(currentIndex + 1, totalItems - 1)
        break
      case 'ArrowLeft':
        event.preventDefault()
        newIndex = Math.max(currentIndex - 1, 0)
        break
      case 'ArrowDown':
        event.preventDefault()
        newIndex = Math.min(currentIndex + columnsPerRow, totalItems - 1)
        break
      case 'ArrowUp':
        event.preventDefault()
        newIndex = Math.max(currentIndex - columnsPerRow, 0)
        break
      case 'Home':
        event.preventDefault()
        newIndex = 0
        break
      case 'End':
        event.preventDefault()
        newIndex = totalItems - 1
        break
      default:
        return
    }

    if (newIndex !== currentIndex) {
      onIndexChange(newIndex)
    }
  }, [])

  /**
   * フォーカス管理（特定要素にフォーカス設定）
   */
  const focusElement = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      element.focus()
    }
  }, [])

  /**
   * Skip to contentリンクの実装
   */
  const skipToContent = useCallback(() => {
    const mainContent = document.querySelector('#main-content') as HTMLElement
    if (mainContent) {
      mainContent.focus()
      mainContent.scrollIntoView()
    }
  }, [])

  return {
    handleKeyDown,
    handleEscapeKey,
    handleArrowNavigation,
    focusElement,
    skipToContent
  }
}