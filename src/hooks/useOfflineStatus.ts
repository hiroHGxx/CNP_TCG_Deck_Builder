import { useState, useEffect } from 'react'

/**
 * オンライン/オフライン状態を監視するカスタムフック
 */
export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (wasOffline) {
        console.log('Connection restored')
        // オンライン復帰時の通知
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(() => {
            // Service Workerを通じてキャッシュ同期等の処理を実行
          })
        }
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
      console.log('Connection lost - entering offline mode')
    }

    // イベントリスナーを追加
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // クリーンアップ
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline])

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline
  }
}

/**
 * ネットワーク接続品質を推定するフック
 */
export const useNetworkQuality = () => {
  const [connectionType, setConnectionType] = useState<string>('unknown')
  const [effectiveType, setEffectiveType] = useState<string>('unknown')
  const [rtt, setRTT] = useState<number>(0)
  const [downlink, setDownlink] = useState<number>(0)

  useEffect(() => {
    const updateNetworkInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        setConnectionType(connection.type || 'unknown')
        setEffectiveType(connection.effectiveType || 'unknown')
        setRTT(connection.rtt || 0)
        setDownlink(connection.downlink || 0)
      }
    }

    // 初回実行
    updateNetworkInfo()

    // 接続変更監視
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      connection.addEventListener('change', updateNetworkInfo)
      
      return () => {
        connection.removeEventListener('change', updateNetworkInfo)
      }
    }
  }, [])

  const isSlowConnection = effectiveType === 'slow-2g' || effectiveType === '2g' || rtt > 1000

  return {
    connectionType,
    effectiveType,
    rtt,
    downlink,
    isSlowConnection,
    hasNetworkInfo: 'connection' in navigator
  }
}