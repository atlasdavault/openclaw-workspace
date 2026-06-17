import { useState, useEffect, useCallback } from 'react'

const ACCENT = '#FF6B35'

const SERVICES = [
  { key: 'supabase', label: 'Supabase API' },
  { key: 'mobile', label: 'Mobile (Expo)' },
  { key: 'portal', label: 'Restaurant Portal' },
]

function fmt(n) {
  return Number(n || 0).toLocaleString('en-US')
}

function Badge({ label, status }) {
  const online = status === 'online'
  const color = status === 'online' ? '#39ff14' : status === 'checking' ? '#888' : '#ff4444'
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1"
      style={{ background: '#111122', border: `1px solid ${color}40` }}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: color, boxShadow: status === 'online' ? `0 0 6px ${color}` : 'none' }}
      />
      <div className="min-w-0">
        <div className="text-xs font-jetbrains text-gray-300 truncate">{label}</div>
        <div className="text-xs font-jetbrains font-semibold uppercase tracking-widest" style={{ color }}>
          {status === 'checking' ? '…' : online ? 'ONLINE' : 'OFFLINE'}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg px-3 py-2.5" style={{ background: '#111122', border: '1px solid #1a1a2e' }}>
      <div className="text-xs font-jetbrains text-gray-600 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-lg font-jetbrains font-semibold" style={{ color: ACCENT }}>{value}</div>
    </div>
  )
}

export default function SmartBitesPanel() {
  const [health, setHealth] = useState({ supabase: 'checking', mobile: 'checking', portal: 'checking' })
  const [stats, setStats] = useState(null)

  const checkHealth = useCallback(async () => {
    await Promise.all(
      SERVICES.map(async ({ key }) => {
        try {
          const ctrl = new AbortController()
          const to = setTimeout(() => ctrl.abort(), 3500)
          const res = await fetch(`/api/smartbites/health?target=${key}`, { signal: ctrl.signal })
          clearTimeout(to)
          const data = await res.json()
          setHealth((prev) => ({ ...prev, [key]: data.status === 'online' ? 'online' : 'offline' }))
        } catch {
          setHealth((prev) => ({ ...prev, [key]: 'offline' }))
        }
      })
    )
  }, [])

  useEffect(() => {
    let alive = true
    const loadStats = async () => {
      try {
        const res = await fetch('/api/smartbites')
        const data = await res.json()
        if (alive) setStats(data)
      } catch {}
    }
    loadStats()
    checkHealth()
    const id = setInterval(checkHealth, 30000)
    return () => { alive = false; clearInterval(id) }
  }, [checkHealth])

  const lastSync = stats?.lastSync
    ? new Date(stats.lastSync).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <div className="rounded-xl p-5" style={{ background: '#0d0d1a', border: `1px solid ${ACCENT}30`, boxShadow: `0 0 20px ${ACCENT}10` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-jetbrains font-semibold tracking-widest uppercase" style={{ color: ACCENT }}>
          🍽 SmartBites
        </div>
      </div>

      {/* Status badges */}
      <div className="flex gap-2 mb-4">
        {SERVICES.map((s) => (
          <Badge key={s.key} label={s.label} status={health[s.key]} />
        ))}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <Stat label="Beta Users" value={fmt(stats?.betaUsers)} />
        <Stat label="Restaurants" value={fmt(stats?.restaurantsOnboarded)} />
        <Stat label="Menu Items" value={fmt(stats?.menuItemsIndexed)} />
        <div className="rounded-lg px-3 py-2.5" style={{ background: '#111122', border: '1px solid #1a1a2e' }}>
          <div className="text-xs font-jetbrains text-gray-600 uppercase tracking-widest mb-1">Last Sync</div>
          <div className="text-xs font-jetbrains font-semibold text-gray-300">{lastSync}</div>
        </div>
      </div>

      {/* Links */}
      <div className="flex gap-2">
        <a
          href="https://dev.smartbites.food"
          target="_blank"
          rel="noreferrer"
          className="flex-1 text-center text-xs font-jetbrains font-semibold py-2 rounded-lg transition-opacity hover:opacity-80"
          style={{ background: `${ACCENT}20`, border: `1px solid ${ACCENT}60`, color: ACCENT }}
        >
          Open SmartBites Dev →
        </a>
        <a
          href="https://supabase-studio.ngrok.io"
          target="_blank"
          rel="noreferrer"
          className="flex-1 text-center text-xs font-jetbrains font-semibold py-2 rounded-lg transition-opacity hover:opacity-80"
          style={{ background: '#111122', border: '1px solid #1a1a2e', color: '#aaa' }}
        >
          Open Supabase Studio →
        </a>
      </div>
    </div>
  )
}
