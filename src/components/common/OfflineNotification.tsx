import React from 'react'
import { WifiOff, Wifi, AlertCircle } from 'lucide-react'
import { useOfflineStatus, useNetworkQuality } from '@/hooks/useOfflineStatus'

/**
 * オフライン状態通知コンポーネント
 */
export const OfflineNotification: React.FC = () => {
  const { isOnline, isOffline, wasOffline } = useOfflineStatus()
  const { isSlowConnection, effectiveType } = useNetworkQuality()

  // オンライン状態で問題なし
  if (isOnline && !isSlowConnection) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* オフライン通知 */}
      {isOffline && (
        <div className="bg-red-600 text-white px-4 py-2 text-center">
          <div className="flex items-center justify-center space-x-2">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">
              インターネット接続がありません
            </span>
          </div>
          <p className="text-xs mt-1 opacity-90">
            オフラインモードで利用中です。一部機能が制限される可能性があります。
          </p>
        </div>
      )}

      {/* 接続復帰通知 */}
      {isOnline && wasOffline && (
        <div className="bg-green-600 text-white px-4 py-2 text-center animate-pulse">
          <div className="flex items-center justify-center space-x-2">
            <Wifi className="w-4 h-4" />
            <span className="text-sm font-medium">
              インターネット接続が復帰しました
            </span>
          </div>
        </div>
      )}

      {/* 低速接続警告 */}
      {isOnline && isSlowConnection && (
        <div className="bg-yellow-600 text-white px-4 py-2 text-center">
          <div className="flex items-center justify-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              接続が不安定です ({effectiveType})
            </span>
          </div>
          <p className="text-xs mt-1 opacity-90">
            読み込みに時間がかかる場合があります。
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * 接続状態インジケーター（常時表示用）
 */
export const ConnectionStatus: React.FC = () => {
  const { isOffline } = useOfflineStatus()
  const { isSlowConnection, effectiveType, rtt } = useNetworkQuality()

  return (
    <div className="flex items-center space-x-2 text-xs">
      {isOffline ? (
        <>
          <WifiOff className="w-3 h-3 text-red-500" />
          <span className="text-red-600">オフライン</span>
        </>
      ) : isSlowConnection ? (
        <>
          <AlertCircle className="w-3 h-3 text-yellow-500" />
          <span className="text-yellow-600">低速 ({effectiveType})</span>
        </>
      ) : (
        <>
          <Wifi className="w-3 h-3 text-green-500" />
          <span className="text-green-600">
            オンライン
            {rtt > 0 && ` (${rtt}ms)`}
          </span>
        </>
      )}
    </div>
  )
}