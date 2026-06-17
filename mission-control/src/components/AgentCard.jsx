import { Link } from 'react-router-dom'
import { useState } from 'react'
import { getAgent } from '../agents.js'

function StatusBadge({ status, color }) {
  const isOnline = status === 'online' || status === 'live'
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-2 h-2 rounded-full inline-block"
        style={{
          background: isOnline ? color : '#ff4444',
          boxShadow: isOnline ? `0 0 6px ${color}` : '0 0 6px #ff4444',
          animation: isOnline ? 'pulse-glow 2s ease-in-out infinite' : 'none',
        }}
      />
      <span
        className="text-xs font-jetbrains font-semibold tracking-widest"
        style={{ color: isOnline ? color : '#ff4444' }}
      >
        {isOnline ? 'ONLINE' : 'OFFLINE'}
      </span>
    </div>
  )
}

export default function AgentCard({ name, status }) {
  const cfg = getAgent(name)
  const [hover, setHover] = useState(false)
  if (!cfg) return null

  const { color, dimColor, initial, description, stats, route } = cfg
  const effectiveStatus = status || cfg.status || 'online'
  const isOnline = effectiveStatus === 'online' || effectiveStatus === 'live'

  // Neon glow per agent — intensifies on hover.
  const glow = isOnline
    ? hover
      ? `0 0 30px ${color}55, 0 0 60px ${color}22`
      : `0 0 20px ${color}30, 0 0 40px ${color}12`
    : 'none'

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="rounded-xl p-5 flex flex-col gap-4 transition-all duration-300"
      style={{
        background: '#0d0d1a',
        border: `1px solid ${isOnline ? color + '35' : '#1a1a2e'}`,
        boxShadow: glow,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold font-jetbrains flex-shrink-0"
            style={{
              background: `${color}20`,
              border: `2px solid ${color}60`,
              color: color,
              boxShadow: isOnline ? `0 0 15px ${color}40` : 'none',
            }}
          >
            {initial}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{name}</h3>
            <StatusBadge status={effectiveStatus} color={color} />
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>

      {/* Stats */}
      <div className="flex gap-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex-1 rounded-lg px-3 py-2"
            style={{ background: '#111122', border: '1px solid #1a1a2e' }}
          >
            <div className="text-xs font-jetbrains text-gray-600 mb-0.5">{stat.label}</div>
            <div className="text-sm font-jetbrains font-semibold" style={{ color: dimColor }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Control room link */}
      <Link
        to={route}
        className="text-xs font-jetbrains font-semibold tracking-widest flex items-center gap-1.5 transition-opacity hover:opacity-70 mt-auto"
        style={{ color }}
      >
        OPEN CONTROL ROOM
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </Link>
    </div>
  )
}
