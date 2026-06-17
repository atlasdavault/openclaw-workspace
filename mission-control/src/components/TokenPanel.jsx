import { useState, useEffect } from 'react'
import { getAgent } from '../agents.js'

function fmt(n) {
  return Number(n || 0).toLocaleString('en-US')
}
function money(n) {
  return `$${Number(n || 0).toFixed(2)}`
}

export default function TokenPanel() {
  const [rows, setRows] = useState([])
  const [source, setSource] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const ctrl = new AbortController()
        const to = setTimeout(() => ctrl.abort(), 4000)
        const res = await fetch('/api/tokens', { signal: ctrl.signal })
        clearTimeout(to)
        const data = await res.json()
        if (!alive) return
        setRows(data.usage || [])
        setSource(data.source || null)
        setLastUpdated(new Date())
      } catch {}
    }
    load()
    const id = setInterval(load, 30000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  const totalTokens = rows.reduce((s, r) => s + (r.tokens || 0), 0)
  const totalCost = rows.reduce((s, r) => s + (r.cost || 0), 0)

  const isLive = source === 'live'

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: '#0d0d1a', border: '1px solid #1a1a2e' }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid #1a1a2e' }}>
            <th className="text-left px-4 py-3 text-xs font-jetbrains font-semibold tracking-widest text-gray-600 uppercase">Agent</th>
            <th className="text-left px-4 py-3 text-xs font-jetbrains font-semibold tracking-widest text-gray-600 uppercase">Model</th>
            <th className="text-right px-4 py-3 text-xs font-jetbrains font-semibold tracking-widest text-gray-600 uppercase">Tokens Used</th>
            <th className="text-right px-4 py-3 text-xs font-jetbrains font-semibold tracking-widest text-gray-600 uppercase">Est. Cost</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const agent = getAgent(r.agent) || getAgent(r.id)
            const color = agent?.color || '#888'
            return (
              <tr key={r.agent} style={{ borderBottom: '1px solid #14141f' }}>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold font-jetbrains"
                      style={{ background: `${color}20`, border: `1px solid ${color}60`, color }}
                    >
                      {agent?.initial || r.agent[0]}
                    </span>
                    <span className="text-gray-300 font-medium">{r.agent}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 font-jetbrains text-gray-500 text-xs">{r.model}</td>
                <td className="px-4 py-2.5 text-right font-jetbrains tabular-nums text-gray-300">{fmt(r.tokens)}</td>
                <td className="px-4 py-2.5 text-right font-jetbrains tabular-nums" style={{ color: r.cost > 0 ? color : '#4b5563' }}>
                  {money(r.cost)}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '1px solid #1a1a2e', background: '#0a0a14' }}>
            <td className="px-4 py-3 text-xs font-jetbrains font-semibold tracking-widest text-gray-500 uppercase" colSpan={2}>
              Session Total
            </td>
            <td className="px-4 py-3 text-right font-jetbrains font-semibold tabular-nums text-atlas">{fmt(totalTokens)}</td>
            <td className="px-4 py-3 text-right font-jetbrains font-semibold tabular-nums text-atlas">{money(totalCost)}</td>
          </tr>
        </tfoot>
      </table>
      <div className="flex items-center justify-between px-4 py-2 text-xs font-jetbrains text-gray-600" style={{ borderTop: '1px solid #14141f' }}>
        <span>
          Last updated {lastUpdated ? lastUpdated.toLocaleTimeString('en-US', { hour12: false }) : '—'}
        </span>
        {source && (
          <span className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: isLive ? '#39ff14' : '#888', boxShadow: isLive ? '0 0 5px #39ff14' : 'none' }}
            />
            <span style={{ color: isLive ? '#39ff14' : '#888' }}>{isLive ? 'LIVE' : 'CACHED'}</span>
          </span>
        )}
      </div>
    </div>
  )
}
