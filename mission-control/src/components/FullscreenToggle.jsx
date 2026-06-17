import { useState, useEffect, useCallback } from 'react'

export default function FullscreenToggle() {
  const [isFull, setIsFull] = useState(false)

  useEffect(() => {
    const onChange = () => setIsFull(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.()
    } else {
      document.documentElement.requestFullscreen?.()
    }
  }, [])

  return (
    <button
      onClick={toggle}
      title={isFull ? 'Exit fullscreen' : 'Enter fullscreen'}
      aria-label={isFull ? 'Exit fullscreen' : 'Enter fullscreen'}
      className="flex items-center justify-center transition-colors"
      style={{ color: '#666', background: 'none', border: 'none' }}
      onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
      onMouseLeave={(e) => (e.currentTarget.style.color = '#666')}
    >
      {isFull ? (
        // compress
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />
        </svg>
      ) : (
        // expand
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
        </svg>
      )}
    </button>
  )
}
