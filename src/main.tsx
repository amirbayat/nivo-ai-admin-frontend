import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from '@/App'
import { env } from '@/env'
import { initSentry } from '@/lib/sentry'

if (env.VITE_SENTRY_DSN) {
  initSentry(env.VITE_SENTRY_DSN)
}

const root = document.getElementById('root')
if (!root) throw new Error('No root element')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
