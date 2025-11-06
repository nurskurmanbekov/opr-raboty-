import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './theme/globalStyles.css'
import App from './App.jsx'
import { registerServiceWorker } from './utils/pwaUtils'

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  registerServiceWorker();
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)