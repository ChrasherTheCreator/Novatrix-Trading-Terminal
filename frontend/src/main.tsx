import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

import { Toaster } from 'sonner'
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from "@vercel/analytics/react"

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App/>
    <Toaster position="bottom-right" theme="dark" richColors />
    <Analytics />
    <SpeedInsights />
  </React.StrictMode>
)
