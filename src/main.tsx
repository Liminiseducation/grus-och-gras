import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Note: service worker registration removed to ensure identical runtime
// behavior between development and production builds (avoids cached
// older bundles causing UI differences).

// App startup log for debugging auth/onboarding flow
try {
  // eslint-disable-next-line no-console
  console.info('[app] startup:', new Date().toISOString());
} catch (e) {
  // ignore
}
