import React from 'react'

interface IntegratedLayoutProps {
  children: React.ReactNode
  sidebar: React.ReactNode
}

/**
 * 2カラム統合レイアウトコンポーネント
 * Disney Lorcana参考の左右分割UI
 */
export const IntegratedLayout: React.FC<IntegratedLayoutProps> = ({
  children,
  sidebar
}) => {
  return (
    <div className="min-h-screen">
      <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-6">
        {/* 左カラム: カードグリッド・検索・フィルタ */}
        <div className="flex-1 lg:w-0 min-w-0">
          <div className="space-y-4">
            {children}
          </div>
        </div>
        
        {/* 右カラム: デッキサイドバー */}
        <div className="lg:w-80 xl:w-96 flex-shrink-0">
          <div className="sticky top-4 space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
            {sidebar}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * カードグリッドセクション（左カラム用）
 */
export const CardGridSection: React.FC<{
  title?: string
  children: React.ReactNode
  className?: string
}> = ({ title, children, className = "" }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

/**
 * サイドバーセクション（右カラム用）
 */
export const SidebarSection: React.FC<{
  title: string
  children: React.ReactNode
  className?: string
  headerActions?: React.ReactNode
}> = ({ title, children, className = "", headerActions }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-semibold text-gray-900">{title}</h3>
          {headerActions && (
            <div className="flex items-center space-x-2">
              {headerActions}
            </div>
          )}
        </div>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

/**
 * 統計表示セクション（コンパクト版）
 */
export const StatsSection: React.FC<{
  mainDeckCount: number
  reikiDeckCount: number
  supportBPCount: number
  completionRate: number
}> = ({ mainDeckCount, reikiDeckCount, supportBPCount, completionRate }) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <h4 className="text-sm font-medium text-blue-900 mb-2">デッキ概要</h4>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex justify-between">
          <span className="text-blue-700">メイン:</span>
          <span className="font-medium text-blue-900">{mainDeckCount}/50枚</span>
        </div>
        <div className="flex justify-between">
          <span className="text-blue-700">レイキ:</span>
          <span className="font-medium text-blue-900">{reikiDeckCount}/15枚</span>
        </div>
        <div className="flex justify-between">
          <span className="text-blue-700">助太刀:</span>
          <span className="font-medium text-blue-900">{supportBPCount}種類</span>
        </div>
        <div className="flex justify-between">
          <span className="text-blue-700">完成度:</span>
          <span className="font-medium text-blue-900">{completionRate}%</span>
        </div>
      </div>
    </div>
  )
}

export default IntegratedLayout