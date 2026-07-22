import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProviders } from '@/app/providers'
import { App } from '@/app/App'
import '@/styles/global.css'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root não encontrado')

createRoot(rootEl).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
