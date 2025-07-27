import { useState, useMemo, useCallback } from 'react'
import Fuse from 'fuse.js'
import type { Card, CardFilter } from '@/types/card'

interface UseSearchProps {
  cards: Card[]
}

interface UseSearchReturn {
  searchQuery: string
  setSearchQuery: (query: string) => void
  filters: CardFilter
  setFilters: (filters: CardFilter) => void
  filteredCards: Card[]
  totalCount: number
  includeFlavorText: boolean
  setIncludeFlavorText: (include: boolean) => void
  clearAll: () => void
}

export const useSearch = ({ cards }: UseSearchProps): UseSearchReturn => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<CardFilter>({})
  const [includeFlavorText, setIncludeFlavorText] = useState(false) // デフォルトは含めない

  // Fuse.js設定
  const fuseOptions = useMemo(() => {
    // 検索対象フィールドを動的に決定
    const searchKeys = [
      { name: 'name', weight: 0.5 },           // カード名（重要度高）
      { name: 'effect', weight: 0.3 },         // 効果テキスト（重要度中）
      { name: 'role', weight: 0.2 }            // 特徴・種族（重要度低）
    ]

    // フレーバーテキストを含める場合は追加
    if (includeFlavorText) {
      searchKeys.push({ name: 'flavorText', weight: 0.1 }) // フレーバーテキスト（重要度最低）
    }

    return {
      keys: searchKeys,
      // より厳密な検索精度設定
      threshold: 0.2,           // 0.3 → 0.2 (より厳密)
      distance: 50,             // 100 → 50 (文字列の最大距離を短く)
      minMatchCharLength: 2,    // 3 → 2 (2文字から検索可能に戻す)
      includeScore: true,       // スコアを含める
      includeMatches: true,     // マッチ箇所を含める
      ignoreLocation: true,     // 位置を無視
      findAllMatches: true      // すべてのマッチを検索
    }
  }, [includeFlavorText])

  // Fuseインスタンス作成
  const fuse = useMemo(() => {
    return new Fuse(cards, fuseOptions)
  }, [cards, fuseOptions])

  // フィルタリング処理
  const filteredCards = useMemo(() => {
    let results = cards

    // テキスト検索
    if (searchQuery.trim()) {
      const fuseResults = fuse.search(searchQuery.trim())
      results = fuseResults.map(result => result.item)
    }

    // 色フィルタ
    if (filters.colors && filters.colors.length > 0) {
      results = results.filter(card => 
        filters.colors!.includes(card.color)
      )
    }

    // コストフィルタ
    if (filters.minCost !== undefined) {
      results = results.filter(card => card.cost >= filters.minCost!)
    }
    if (filters.maxCost !== undefined) {
      results = results.filter(card => card.cost <= filters.maxCost!)
    }

    // カード種類フィルタ
    if (filters.cardTypes && filters.cardTypes.length > 0) {
      results = results.filter(card => 
        filters.cardTypes!.includes(card.cardType)
      )
    }

    // レアリティフィルタ
    if (filters.rarities && filters.rarities.length > 0) {
      results = results.filter(card => 
        filters.rarities!.includes(card.rarity)
      )
    }

    // 特徴フィルタ
    if (filters.roles && filters.roles.length > 0) {
      results = results.filter(card =>
        filters.roles!.some(role => 
          card.role.some(cardRole => 
            cardRole.toLowerCase().includes(role.toLowerCase())
          )
        )
      )
    }

    return results
  }, [cards, searchQuery, filters, fuse])

  // すべてクリア
  const clearAll = useCallback(() => {
    setSearchQuery('')
    setFilters({})
    setIncludeFlavorText(false) // フレーバーテキスト検索もリセット
  }, [])

  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    filteredCards,
    totalCount: filteredCards.length,
    includeFlavorText,
    setIncludeFlavorText,
    clearAll
  }
}