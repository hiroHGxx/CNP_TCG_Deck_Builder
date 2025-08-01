/**
 * エラーハンドリングユーティリティ
 * ネットワークエラーの詳細分類とユーザーフレンドリーメッセージ生成
 */

export interface DetailedError {
  type: 'network' | 'data' | 'unknown' | 'offline'
  code?: number
  message: string
  userMessage: string
  retryable: boolean
  suggestion?: string
}

/**
 * HTTP レスポンスエラーを詳細に分類
 */
export const classifyNetworkError = (response: Response): DetailedError => {
  const { status, statusText } = response

  switch (status) {
    case 404:
      return {
        type: 'network',
        code: 404,
        message: `Resource not found: ${statusText}`,
        userMessage: 'カードデータが見つかりません',
        retryable: false,
        suggestion: 'ページを再読み込みしてください。問題が続く場合は、管理者にお問い合わせください。'
      }

    case 500:
    case 502:
    case 503:
    case 504:
      return {
        type: 'network',
        code: status,
        message: `Server error: ${status} ${statusText}`,
        userMessage: 'サーバーでエラーが発生しました',
        retryable: true,
        suggestion: '少し時間をおいてから再度お試しください。'
      }

    case 408:
    case 429:
      return {
        type: 'network',
        code: status,
        message: `Request timeout or rate limited: ${status} ${statusText}`,
        userMessage: '接続がタイムアウトしました',
        retryable: true,
        suggestion: '少し時間をおいてから再度お試しください。'
      }

    case 403:
      return {
        type: 'network',
        code: 403,
        message: `Access forbidden: ${statusText}`,
        userMessage: 'アクセスが拒否されました',
        retryable: false,
        suggestion: 'お使いのネットワーク環境を確認してください。'
      }

    default:
      return {
        type: 'network',
        code: status,
        message: `HTTP error: ${status} ${statusText}`,
        userMessage: `ネットワークエラーが発生しました (${status})`,
        retryable: status >= 500,
        suggestion: 'ネットワーク接続を確認してから再度お試しください。'
      }
  }
}

/**
 * JavaScript エラーを詳細に分類
 */
export const classifyJavaScriptError = (error: Error): DetailedError => {
  const message = error.message.toLowerCase()

  // ネットワーク接続エラー
  if (message.includes('failed to fetch') || 
      message.includes('network error') ||
      message.includes('networker')) {
    return {
      type: 'offline',
      message: error.message,
      userMessage: 'ネットワーク接続を確認してください',
      retryable: true,
      suggestion: 'インターネット接続を確認してから再度お試しください。'
    }
  }

  // JSON パースエラー  
  if (message.includes('unexpected token') || 
      message.includes('invalid json') ||
      message.includes('json')) {
    return {
      type: 'data',
      message: error.message,
      userMessage: 'データの形式に問題があります',
      retryable: true,
      suggestion: 'ページを再読み込みしてください。'
    }
  }

  // CORS エラー
  if (message.includes('cors') || 
      message.includes('cross-origin')) {
    return {
      type: 'network',
      message: error.message,
      userMessage: 'アクセス権限の問題が発生しました',
      retryable: false,
      suggestion: 'お使いのブラウザまたはネットワーク環境を確認してください。'
    }
  }

  // その他の未知のエラー
  return {
    type: 'unknown',
    message: error.message,
    userMessage: '予期しないエラーが発生しました',
    retryable: true,
    suggestion: 'ページを再読み込みしてください。問題が続く場合は、管理者にお問い合わせください。'
  }
}

/**
 * エラーから DetailedError を生成する統合関数
 */
export const createDetailedError = (error: unknown, response?: Response): DetailedError => {
  // HTTP レスポンスエラー
  if (response && !response.ok) {
    return classifyNetworkError(response)
  }

  // JavaScript エラー
  if (error instanceof Error) {
    return classifyJavaScriptError(error)
  }

  // 文字列エラー
  if (typeof error === 'string') {
    return classifyJavaScriptError(new Error(error))
  }

  // 不明なエラー
  return {
    type: 'unknown',
    message: String(error),
    userMessage: '不明なエラーが発生しました',
    retryable: false,
    suggestion: 'ページを再読み込みしてください。'
  }
}

/**
 * エラーログ記録（ローカルストレージ）
 */
export const logError = (error: DetailedError, context?: string): void => {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    context: context || 'unknown',
    error: {
      type: error.type,
      code: error.code,
      message: error.message,
      userMessage: error.userMessage,
      retryable: error.retryable
    }
  }

  try {
    const existingLogs = localStorage.getItem('cnp_error_logs')
    const logs = existingLogs ? JSON.parse(existingLogs) : []
    
    // 最新100件のみ保持
    logs.push(logEntry)
    if (logs.length > 100) {
      logs.shift()
    }
    
    localStorage.setItem('cnp_error_logs', JSON.stringify(logs))
    console.error(`[ERROR LOG] ${context}:`, logEntry)
  } catch (storageError) {
    console.error('Failed to log error to localStorage:', storageError)
    console.error('Original error:', logEntry)
  }
}