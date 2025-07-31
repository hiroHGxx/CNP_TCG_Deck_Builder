import React from 'react'
import { Filter, X } from 'lucide-react'
import type { CardFilter, CardColor, CardRarity, CardType } from '@/types/card'

interface FilterPanelProps {
  filters: CardFilter
  onFilterChange: (filters: CardFilter) => void
  onClearAll: () => void
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onClearAll
}) => {
  // 色フィルタの更新
  const handleColorChange = (color: CardColor, checked: boolean) => {
    const currentColors = filters.colors || []
    const newColors = checked
      ? [...currentColors, color]
      : currentColors.filter(c => c !== color)
    
    onFilterChange({
      ...filters,
      colors: newColors.length > 0 ? newColors : undefined
    })
  }

  // カード種類フィルタの更新
  const handleCardTypeChange = (cardType: CardType, checked: boolean) => {
    const currentTypes = filters.cardTypes || []
    const newTypes = checked
      ? [...currentTypes, cardType]
      : currentTypes.filter(t => t !== cardType)
    
    onFilterChange({
      ...filters,
      cardTypes: newTypes.length > 0 ? newTypes : undefined
    })
  }

  // レアリティフィルタの更新
  const handleRarityChange = (rarity: CardRarity, checked: boolean) => {
    const currentRarities = filters.rarities || []
    const newRarities = checked
      ? [...currentRarities, rarity]
      : currentRarities.filter(r => r !== rarity)
    
    onFilterChange({
      ...filters,
      rarities: newRarities.length > 0 ? newRarities : undefined
    })
  }

  // コストフィルタの更新
  const handleCostChange = (type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? undefined : parseInt(value)
    onFilterChange({
      ...filters,
      [type === 'min' ? 'minCost' : 'maxCost']: numValue
    })
  }

  // アクティブなフィルタ数を計算
  const activeFilterCount = [
    filters.colors?.length || 0,
    filters.cardTypes?.length || 0,
    filters.rarities?.length || 0,
    filters.minCost !== undefined ? 1 : 0,
    filters.maxCost !== undefined ? 1 : 0
  ].reduce((sum, count) => sum + count, 0)

  const colorOptions: { value: CardColor; label: string; bgColor: string }[] = [
    { value: 'red', label: '赤', bgColor: 'bg-red-500' },
    { value: 'blue', label: '青', bgColor: 'bg-blue-500' },
    { value: 'green', label: '緑', bgColor: 'bg-green-500' },
    { value: 'yellow', label: '黄', bgColor: 'bg-yellow-500' }
  ]

  const cardTypeOptions: { value: CardType; label: string }[] = [
    { value: 'unit', label: 'ユニット' },
    { value: 'supporter', label: 'サポーター' },
    { value: 'event', label: 'イベント' }
  ]

  const rarityOptions: { value: CardRarity; label: string }[] = [
    { value: 'common', label: 'コモン' },
    { value: 'rare', label: 'レア' },
    { value: 'rare_rare', label: 'ダブルレア' },
    { value: 'triple_rare', label: 'トリプルレア' }
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">フィルタ</h3>
          {activeFilterCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-4 w-4" />
            <span>すべてクリア</span>
          </button>
        )}
      </div>

      {/* 色フィルタ */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">色</h4>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map(({ value, label, bgColor }) => (
            <label key={value} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.colors?.includes(value) || false}
                onChange={(e) => handleColorChange(value, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex items-center space-x-1">
                <div className={`w-3 h-3 rounded-full ${bgColor}`} />
                <span className="text-sm text-gray-700">{label}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* コストフィルタ */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">コスト</h4>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            min="0"
            max="20"
            placeholder="最小"
            value={filters.minCost || ''}
            onChange={(e) => handleCostChange('min', e.target.value)}
            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-gray-500">〜</span>
          <input
            type="number"
            min="0"
            max="20"
            placeholder="最大"
            value={filters.maxCost || ''}
            onChange={(e) => handleCostChange('max', e.target.value)}
            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* カード種類フィルタ */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">カード種類</h4>
        <div className="space-y-1">
          {cardTypeOptions.map(({ value, label }) => (
            <label key={value} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.cardTypes?.includes(value) || false}
                onChange={(e) => handleCardTypeChange(value, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* レアリティフィルタ */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">レアリティ</h4>
        <div className="space-y-1">
          {rarityOptions.map(({ value, label }) => (
            <label key={value} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.rarities?.includes(value) || false}
                onChange={(e) => handleRarityChange(value, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FilterPanel