import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Sync '.dark' class with system color-scheme preference
const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
const applyColorScheme = (isDark) => {
  document.documentElement.classList.toggle('dark', isDark)
}
applyColorScheme(darkModeQuery.matches)
darkModeQuery.addEventListener('change', (e) => applyColorScheme(e.matches))

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)