import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProviders } from '@/app/providers'
import { App } from '@/app/App'
import { ErrorBoundary } from '@/app/ErrorBoundary'
import { initNativeAuthListener } from '@/app/nativeAuth'
import '@/styles/global.css'

initNativeAuthListener()

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root não encontrado')

createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProviders>
        <App />
      </AppProviders>
    </ErrorBoundary>
  </StrictMode>,
)
