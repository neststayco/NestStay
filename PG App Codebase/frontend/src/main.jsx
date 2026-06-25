import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// Register service worker for unified mode (user + owner PWA).
// Admin routes excluded via navigateFallbackDenylist in vite.config.js.
// Student mode uses its own auto-injected registration from VitePWA.
if (import.meta.env.MODE !== 'student' && import.meta.env.PROD) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true })
  })
}

const { default: App } = await (
  import.meta.env.MODE === 'student'
    ? import('./platforms/student-pwa/App.jsx')
    : import('./platforms/unified/App.jsx')
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
