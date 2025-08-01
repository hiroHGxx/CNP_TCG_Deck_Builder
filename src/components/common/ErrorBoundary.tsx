import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { logError, createDetailedError } from '@/utils/errorHandler'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  retryCount: number
}

/**
 * React Error Boundary コンポーネント
 * 予期しないJavaScriptエラーをキャッチして、適切なフォールバックUIを表示
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // エラーが発生したことを状態に記録
    return {
      hasError: true,
      error,
      retryCount: 0
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // エラー詳細をログに記録
    const detailedError = createDetailedError(error)
    logError(detailedError, 'ErrorBoundary')
    
    this.setState({
      error,
      errorInfo
    })

    // カスタムエラーハンドラーが提供されている場合は実行
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    console.error('Error Boundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1
    }))
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // カスタムフォールバックが提供されている場合は使用
      if (this.props.fallback) {
        return this.props.fallback
      }

      // デフォルトのエラー表示UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900 text-center mb-2">
              申し訳ございません
            </h1>
            
            <p className="text-gray-600 text-center mb-6">
              予期しないエラーが発生しました。<br />
              ページを再読み込みするか、少し時間をおいてから再度お試しください。
            </p>

            {/* 開発環境でのみエラー詳細を表示 */}
            {import.meta.env.MODE === 'development' && this.state.error && (
              <div className="mb-6 p-3 bg-gray-100 rounded text-xs">
                <details>
                  <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                    エラー詳細 (開発環境のみ)
                  </summary>
                  <div className="text-red-600 whitespace-pre-wrap break-all">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <strong>Component Stack:</strong>
                        <pre className="text-xs mt-1">{this.state.errorInfo.componentStack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-cnp-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                再試行
                {this.state.retryCount > 0 && (
                  <span className="ml-1 text-xs opacity-75">
                    ({this.state.retryCount})
                  </span>
                )}
              </button>
              
              <button
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                ページ再読み込み
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-500 text-center">
              問題が続く場合は、ブラウザのキャッシュをクリアするか、<br />
              別のブラウザでお試しください。
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * 関数コンポーネント版のエラー境界ラッパー
 */
interface ErrorBoundaryWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

export const ErrorBoundaryWrapper: React.FC<ErrorBoundaryWrapperProps> = ({
  children,
  fallback,
  onError
}) => {
  return (
    <ErrorBoundary fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundary>
  )
}

/**
 * 軽量なエラー表示コンポーネント
 */
interface SimpleErrorProps {
  error: string
  onRetry?: () => void
  className?: string
}

export const SimpleError: React.FC<SimpleErrorProps> = ({
  error,
  onRetry,
  className = ''
}) => {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-red-800">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm text-red-600 hover:text-red-500 underline focus:outline-none"
            >
              再試行
            </button>
          )}
        </div>
      </div>
    </div>
  )
}