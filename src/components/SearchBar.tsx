import React from 'react'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onClear?: () => void
  includeFlavorText?: boolean
  onIncludeFlavorTextChange?: (include: boolean) => void
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "カード名や効果テキストで検索...",
  onClear,
  includeFlavorText = false,
  onIncludeFlavorTextChange
}) => {
  const handleClear = () => {
    onChange('')
    if (onClear) {
      onClear()
    }
  }

  return (
    <div className="space-y-3" role="search" aria-labelledby="search-section-title">
      <h2 id="search-section-title" className="sr-only">カード検索</h2>
      <div className="relative w-full">
        {/* 検索アイコン */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>

        {/* 入力フィールド */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label="カード検索"
          aria-describedby="search-description"
          className="
            w-full pl-10 pr-10 py-3 
            border border-gray-300 rounded-lg 
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            bg-white text-gray-900 placeholder-gray-500
            transition-colors duration-200
            hover:border-gray-400
          "
        />
        <div id="search-description" className="sr-only">
          カード名、効果テキストで検索できます
        </div>

        {/* クリアボタン */}
        {value && (
          <button
            onClick={handleClear}
            className="
              absolute inset-y-0 right-0 pr-3 
              flex items-center
              text-gray-400 hover:text-gray-600
              transition-colors duration-200
            "
            aria-label="検索をクリア"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* フレーバーテキスト検索オプション */}
      {onIncludeFlavorTextChange && (
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-600">
            <input
              type="checkbox"
              checked={includeFlavorText}
              onChange={(e) => onIncludeFlavorTextChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>フレーバーテキストも検索に含める</span>
          </label>
        </div>
      )}
    </div>
  )
}

export default SearchBar