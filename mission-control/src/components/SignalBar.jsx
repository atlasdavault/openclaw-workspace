import { useMemo } from 'react'
import { AGENTS } from '../agents.js'

function Waveform({ active, color }) {
  const points = useMemo(() => {
    if (!active) return '0,12 80,12'
    // sine wave approximation using polyline points
    const pts = []
    for (let x = 0; x <= 80; x += 4) {
      const y = 12 + Math.sin((x / 80) * Math.PI * 4) * 6
      pts.push(`${x},${y.toFixed(1)}`)
    }
    return pts.join(' ')
  }, [active])

  return (
    <div className="relative w-20 h-6 overflow-hidden">
      <svg width="80" height="24" viewBox="0 0 80 24" style={{ display: 'block' }}>
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={active ? {
            animation: 'waveform-float 1.5s ease-in-out infinite',
            transformOrigin: 'center',
          } : {}}
          opacity={active ? 1 : 0.3}
        />
      </svg>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    online: { label: 'ONLINE', color: '#39ff14', bg: '#39ff1415' },
    live: { label: 'LIVE', color: '#00e5ff', bg: '#00e5ff15' },
    offline: { label: 'OFFLINE', color: '#ff4444', bg: '#ff444415' },
    degraded: { label: 'DEGRADED', color: '#ff8c00', bg: '#ff8c0015' },
    unknown: { label: 'CHECKING', color: '#666', bg: '#66666615' },
  }
  const s = map[status] || map.unknown
  return (
    <span
      className="text-xs font-jetbrains font-semibold px-1.5 py-0.5 rounded"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}40` }}
    >
      {s.label}
    </span>
  )
}

function SignalCard({ name, status, color, latency }) {
  const isActive = status === 'online' || status === 'live'
  return (
    <div
      className="flex-1 min-w-0 rounded-lg px-4 py-3 flex flex-col gap-2"
      style={{
        background: '#0d0d1a',
        border: `1px solid ${isActive ? color + '40' : '#1a1a2e'}`,
        boxShadow: isActive ? `0 0 12px ${color}20` : 'none',
        transition: 'all 0.4s ease',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-jetbrains font-semibold tracking-wider" style={{ color }}>
          {name}
        </span>
        <StatusBadge status={status} />
      </div>
      <Waveform active={isActive} color={color} />
      {latency !== undefined && (
        <div className="text-xs font-jetbrains text-gray-600">
          {latency}ms
        </div>
      )}
    </div>
  )
}

export default function SignalBar({ gatewayStatus }) {
  const gatewayOnline = gatewayStatus?.status === 'online'
  const latency = gatewayOnline ? Math.floor(Math.random() * 30 + 12) : undefined

  return (
    <div className="flex gap-3 flex-wrap">
      {AGENTS.map((a) => (
        <SignalCard
          key={a.id}
          name={a.name.toUpperCase()}
          status={a.id === 'atlas' ? 'live' : a.status}
          color={a.color}
        />
      ))}
      <SignalCard
        name="HEARTBEAT"
        status={gatewayOnline ? 'live' : 'offline'}
        color={gatewayOnline ? '#00e5ff' : '#ff4444'}
      />
      <SignalCard
        name="LATENCY"
        status={gatewayOnline ? 'online' : 'offline'}
        color={gatewayOnline ? '#00ff88' : '#ff4444'}
        latency={latency}
      />
    </div>
  )
}
