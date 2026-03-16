import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/app'

interface TradingViewChartProps {
  symbol?: string
}

declare global {
  interface Window {
    TradingView: {
      widget: new (config: Record<string, unknown>) => void
    }
  }
}

export default function TradingViewChart({ symbol = 'BINANCE:BTCUSD' }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { theme } = useAppStore()

  useEffect(() => {
    if (!containerRef.current) return

    // Clean up existing chart
    containerRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/tv.js'
    script.async = true
    script.onload = () => {
      if (window.TradingView && containerRef.current) {
        new window.TradingView.widget({
          autosize: true,
          symbol: symbol,
          interval: 'D',
          timezone: 'Etc/UTC',
          theme: theme === 'dark' ? 'dark' : 'light',
          style: '1',
          locale: 'en',
          enable_publishing: false,
          backgroundColor: theme === 'dark' ? '#0a0a12' : '#ffffff',
          gridColor: theme === 'dark' ? 'rgba(40,40,55,0.4)' : '#e5e7eb',
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: containerRef.current.id,
          toolbar_bg: theme === 'dark' ? '#0a0a12' : '#ffffff',
        })
      }
    }
    document.head.appendChild(script)

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [theme, symbol])

  return (
    <div 
      id="tv_chart_container" 
      ref={containerRef} 
      style={{ width: '100%', height: '100%', minHeight: '400px' }} 
    />
  )
}
