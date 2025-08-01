/**
 * リトライ機能ユーティリティ
 * 自動リトライと手動リトライオプションの実装
 */

export interface RetryConfig {
  maxAttempts: number
  delayMs: number
  backoffMultiplier: number
  retryCondition?: (error: unknown) => boolean
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: unknown
  attempts: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2
}

/**
 * 指数バックオフでの自動リトライ実行
 */
export const executeWithRetry = async <T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> => {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: unknown
  
  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      const result = await operation()
      return {
        success: true,
        data: result,
        attempts: attempt
      }
    } catch (error) {
      lastError = error
      
      // リトライ条件チェック
      if (finalConfig.retryCondition && !finalConfig.retryCondition(error)) {
        break
      }
      
      // 最後の試行でない場合のみ待機
      if (attempt < finalConfig.maxAttempts) {
        const delay = finalConfig.delayMs * Math.pow(finalConfig.backoffMultiplier, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
        console.warn(`Retry attempt ${attempt} failed, retrying in ${delay}ms...`, error)
      }
    }
  }
  
  return {
    success: false,
    error: lastError,
    attempts: finalConfig.maxAttempts
  }
}

/**
 * ネットワークエラーの場合のみリトライする条件
 */
export const networkErrorRetryCondition = (error: unknown): boolean => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    
    // リトライすべきエラー
    const retryableErrors = [
      'failed to fetch',
      'network error',
      'timeout',
      'econnreset',
      'enotfound',
      'econnrefused'
    ]
    
    return retryableErrors.some(retryableError => 
      message.includes(retryableError)
    )
  }
  
  return false
}

/**
 * HTTPステータスコードベースのリトライ条件
 */
export const httpErrorRetryCondition = (response: Response): boolean => {
  // 5xx系サーバーエラーと一部の4xx系エラーでリトライ
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504]
  return retryableStatusCodes.includes(response.status)
}

/**
 * フェッチリクエスト専用のリトライ機能
 */
export const fetchWithRetry = async (
  url: string,
  options: RequestInit = {},
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<Response>> => {
  const operation = async (): Promise<Response> => {
    const response = await fetch(url, options)
    
    // HTTPエラーの場合、リトライ条件をチェック
    if (!response.ok && config.retryCondition) {
      const shouldRetry = httpErrorRetryCondition(response)
      if (!shouldRetry) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return response
  }

  return executeWithRetry(operation, {
    ...config,
    retryCondition: config.retryCondition || networkErrorRetryCondition
  })
}

/**
 * 手動リトライ用のヘルパークラス
 */
export class ManualRetryHandler<T> {
  private operation: () => Promise<T>
  private config: RetryConfig
  private currentAttempt = 0
  
  constructor(operation: () => Promise<T>, config?: Partial<RetryConfig>) {
    this.operation = operation
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config }
  }
  
  async execute(): Promise<RetryResult<T>> {
    this.currentAttempt++
    
    try {
      const result = await this.operation()
      return {
        success: true,
        data: result,
        attempts: this.currentAttempt
      }
    } catch (error) {
      return {
        success: false,
        error,
        attempts: this.currentAttempt
      }
    }
  }
  
  canRetry(): boolean {
    return this.currentAttempt < this.config.maxAttempts
  }
  
  getRemainingAttempts(): number {
    return Math.max(0, this.config.maxAttempts - this.currentAttempt)
  }
  
  reset(): void {
    this.currentAttempt = 0
  }
}