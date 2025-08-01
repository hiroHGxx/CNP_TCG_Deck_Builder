import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundaryWrapper } from './components/common/ErrorBoundary'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundaryWrapper
      onError={(error, errorInfo) => {
        console.error('Root Error Boundary:', error, errorInfo)
        // 本番環境では外部エラートラッキングサービスに送信
        // 例: Sentry.captureException(error, { extra: errorInfo })
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundaryWrapper>
  </React.StrictMode>,
)