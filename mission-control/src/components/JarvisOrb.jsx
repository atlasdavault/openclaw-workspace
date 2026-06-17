import { useEffect, useRef } from 'react'

const TRIANGLE_COUNT = 6

function Triangle({ angle, radius, color, speaking }) {
  const rad = (angle * Math.PI) / 180
  const x = 160 + Math.cos(rad) * radius
  const y = 160 + Math.sin(rad) * radius
  const size = 8

  // Triangle pointing outward
  const tipRad = rad
  const leftRad = rad + 2.4
  const rightRad = rad - 2.4
  const tip = { x: x + Math.cos(tipRad) * size * 1.4, y: y + Math.sin(tipRad) * size * 1.4 }
  const left = { x: x + Math.cos(leftRad) * size * 0.7, y: y + Math.sin(leftRad) * size * 0.7 }
  const right = { x: x + Math.cos(rightRad) * size * 0.7, y: y + Math.sin(rightRad) * size * 0.7 }

  const points = `${tip.x},${tip.y} ${left.x},${left.y} ${right.x},${right.y}`

  return (
    <polygon
      points={points}
      fill={color}
      opacity={speaking ? 0.9 : 0.5}
      style={{ filter: `drop-shadow(0 0 4px ${color})` }}
    />
  )
}

export default function JarvisOrb({ state = 'idle' }) {
  const speaking = state === 'speaking'
  const listening = state === 'listening'
  const idle = state === 'idle'

  const color = '#00e5ff'
  const dimColor = '#00b4d8'

  const outerSpeed = speaking ? '3s' : idle ? '12s' : '8s'
  const innerSpeed = speaking ? '2s' : idle ? '7s' : '5s'
  const glowOpacity = speaking ? 0.9 : listening ? 0.6 : 0.35
  const pulseClass = speaking ? 'animate-orb-speak' : 'animate-orb-pulse'

  return (
    <div className={`relative ${pulseClass}`} style={{ width: 320, height: 320 }}>
      <svg width="320" height="320" viewBox="0 0 320 320">
        <defs>
          {/* Center radial gradient */}
          <radialGradient id="orbCenter" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="40%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>

          {/* Outer glow */}
          <radialGradient id="orbGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity={glowOpacity} />
            <stop offset="60%" stopColor={color} stopOpacity={glowOpacity * 0.3} />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>

          <filter id="blur-glow">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background ambient glow */}
        <circle
          cx="160" cy="160" r="140"
          fill="url(#orbGlow)"
          opacity={glowOpacity * 0.5}
        />

        {/* Outer ring (counter-clockwise) */}
        <g style={{
          transformOrigin: '160px 160px',
          animation: `spin-reverse ${outerSpeed} linear infinite`,
        }}>
          <circle cx="160" cy="160" r="120" fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
          <circle cx="160" cy="160" r="120" fill="none" stroke={color} strokeWidth="1.5"
            strokeDasharray="20 15 8 30 12 25"
            opacity="0.7"
          />
        </g>

        {/* Mid ring */}
        <g style={{
          transformOrigin: '160px 160px',
          animation: `spin-slow ${innerSpeed} linear infinite`,
        }}>
          <circle cx="160" cy="160" r="95" fill="none" stroke={dimColor} strokeWidth="1" opacity="0.25" />
          <circle cx="160" cy="160" r="95" fill="none" stroke={dimColor} strokeWidth="2"
            strokeDasharray="30 20 10 40"
            opacity="0.55"
          />
        </g>

        {/* Inner ring (clockwise) */}
        <g style={{
          transformOrigin: '160px 160px',
          animation: `spin-slow ${speaking ? '1.5s' : '4s'} linear infinite`,
        }}>
          <circle cx="160" cy="160" r="68" fill="none" stroke={color} strokeWidth="1.5" opacity="0.4" />
          <circle cx="160" cy="160" r="68" fill="none" stroke={color} strokeWidth="2"
            strokeDasharray="15 10"
            opacity="0.6"
          />
        </g>

        {/* Triangle markers */}
        {Array.from({ length: TRIANGLE_COUNT }).map((_, i) => (
          <Triangle
            key={i}
            angle={i * 60}
            radius={108}
            color={color}
            speaking={speaking}
          />
        ))}

        {/* Center glow disc */}
        <circle cx="160" cy="160" r="45" fill="url(#orbCenter)" opacity="0.8" />

        {/* Core */}
        <circle
          cx="160" cy="160" r="22"
          fill={color}
          opacity={speaking ? 0.95 : listening ? 0.7 : 0.5}
          filter="url(#blur-glow)"
        />
        <circle
          cx="160" cy="160" r="14"
          fill="white"
          opacity={speaking ? 0.6 : listening ? 0.4 : 0.25}
        />

        {/* Crosshair ticks */}
        {[0, 90, 180, 270].map((angle) => {
          const rad = (angle * Math.PI) / 180
          const r1 = 52, r2 = 62
          return (
            <line
              key={angle}
              x1={160 + Math.cos(rad) * r1}
              y1={160 + Math.sin(rad) * r1}
              x2={160 + Math.cos(rad) * r2}
              y2={160 + Math.sin(rad) * r2}
              stroke={color}
              strokeWidth="2"
              opacity="0.8"
            />
          )
        })}
      </svg>
    </div>
  )
}
