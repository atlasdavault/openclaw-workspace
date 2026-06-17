import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import { getAgent, STATUS_COLORS } from '../agents.js'

function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="font-jetbrains text-gray-400 text-sm tabular-nums">
      {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  )
}

function StatTile({ label, value, color }) {
  return (
    <div className="rounded-lg px-4 py-3" style={{ background: '#111122', border: '1px solid #1a1a2e' }}>
      <div className="text-xs font-jetbrains text-gray-600 mb-1 uppercase tracking-widest">{label}</div>
      <div className="text-lg font-jetbrains font-semibold" style={{ color: color || '#e2e8f0' }}>{value}</div>
    </div>
  )
}

function Panel({ title, color, children }) {
  return (
    <div className="rounded-xl p-5" style={{ background: '#0d0d1a', border: `1px solid ${color}30`, boxShadow: `0 0 20px ${color}12` }}>
      <div className="text-xs font-jetbrains font-semibold tracking-widest uppercase mb-4" style={{ color }}>
        {title}
      </div>
      {children}
    </div>
  )
}

// Look up a token-usage row for an agent (case-insensitive)
function useTokenRow(agentName) {
  const [row, setRow] = useState(null)
  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const res = await fetch('/api/tokens')
        const data = await res.json()
        if (!alive) return
        const r = (data.usage || []).find((u) => (u.agent || '').toLowerCase() === agentName.toLowerCase())
        setRow(r || null)
      } catch {}
    }
    load()
    const id = setInterval(load, 30000)
    return () => { alive = false; clearInterval(id) }
  }, [agentName])
  return row
}

function ActivityList({ activity, agentName, color }) {
  const list = (activity || []).filter((e) => (e.agent || '').toLowerCase() === agentName.toLowerCase())
  if (list.length === 0) return <p className="text-sm text-gray-600">No recent {agentName} activity.</p>
  return (
    <div className="space-y-2">
      {list.slice(0, 8).map((e, i) => (
        <div key={i} className="flex items-start gap-2 text-sm">
          <span className="text-gray-700 font-jetbrains text-xs flex-shrink-0 mt-0.5">
            {new Date(e.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-gray-400">{e.action}</span>
        </div>
      ))}
    </div>
  )
}

// ---- Atlas (tabbed) ----

function AtlasRoom({ agent, gatewayStatus }) {
  const [tab, setTab] = useState('Chat')
  const tabs = ['Chat', 'Sessions', 'Memory', 'Cron', 'Workspace']
  const online = gatewayStatus?.status === 'online'

  return (
    <>
      <Panel title="Orchestration" color={agent.color}>
        <div className="grid grid-cols-3 gap-3">
          <StatTile label="Gateway" value={online ? 'ONLINE' : (gatewayStatus?.status || 'unknown').toUpperCase()} color={online ? '#00ff88' : '#ff4444'} />
          <StatTile label="Uptime" value="99.8%" color={agent.color} />
          <StatTile label="Model" value={agent.model} color={agent.color} />
        </div>
      </Panel>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-lg text-xs font-jetbrains font-semibold tracking-widest transition-all"
            style={{
              background: tab === t ? `${agent.color}20` : '#111122',
              border: `1px solid ${tab === t ? agent.color + '60' : '#1a1a2e'}`,
              color: tab === t ? agent.color : '#888',
            }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === 'Chat' && <AtlasChat agent={agent} />}
      {tab === 'Sessions' && <AtlasSessions agent={agent} />}
      {tab === 'Memory' && <AtlasMemory agent={agent} />}
      {tab === 'Cron' && <AtlasCron agent={agent} />}
      {tab === 'Workspace' && <AtlasWorkspace agent={agent} gatewayStatus={gatewayStatus} />}
    </>
  )
}

function AtlasChat({ agent }) {
  return (
    <Panel title="Neural Interface" color={agent.color}>
      <p className="text-sm text-gray-400 mb-4 leading-relaxed">
        Atlas drives the Neural Interface — live speech recognition, agent routing, and synthesized replies.
      </p>
      <Link
        to="/jarvis"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-jetbrains font-semibold tracking-widest transition-opacity hover:opacity-80"
        style={{ background: `${agent.color}20`, border: `1px solid ${agent.color}60`, color: agent.color }}
      >
        OPEN NEURAL INTERFACE
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </Link>
    </Panel>
  )
}

function AtlasSessions({ agent }) {
  const [data, setData] = useState(null)
  useEffect(() => {
    let alive = true
    fetch('/api/atlas/sessions').then((r) => r.json()).then((d) => { if (alive) setData(d) }).catch(() => { if (alive) setData({ sessions: [], note: 'unavailable' }) })
    return () => { alive = false }
  }, [])
  return (
    <Panel title="Sessions" color={agent.color}>
      {data === null ? (
        <p className="text-sm text-gray-600">Loading…</p>
      ) : data.sessions.length === 0 ? (
        <p className="text-sm text-yellow-600 font-jetbrains">{data.note || 'No active sessions.'}</p>
      ) : (
        <div className="space-y-2">
          {data.sessions.map((s, i) => (
            <div key={s.id || i} className="rounded-lg px-3 py-2 text-sm font-jetbrains" style={{ background: '#111122', border: '1px solid #1a1a2e' }}>
              <span style={{ color: agent.color }}>{s.id || s.name || `session ${i + 1}`}</span>
              {s.status && <span className="text-gray-600 ml-2">· {s.status}</span>}
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

function AtlasMemory({ agent }) {
  const [data, setData] = useState(null)
  useEffect(() => {
    let alive = true
    fetch('/api/memory').then((r) => r.json()).then((d) => { if (alive) setData(d) }).catch(() => { if (alive) setData({ files: [] }) })
    return () => { alive = false }
  }, [])
  return (
    <Panel title="Memory" color={agent.color}>
      {data === null ? (
        <p className="text-sm text-gray-600">Loading…</p>
      ) : (data.files || []).length === 0 ? (
        <p className="text-sm text-yellow-600 font-jetbrains">{data.note || 'No memory files.'}</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {data.files.map((f) => (
            <div key={f.name} className="rounded-lg px-3 py-2" style={{ background: '#111122', border: '1px solid #1a1a2e' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-jetbrains font-semibold" style={{ color: agent.color }}>{f.name}</span>
                <span className="text-xs font-jetbrains text-gray-700">{new Date(f.mtime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{f.preview}</p>
            </div>
          ))}
        </div>
      )}
      <Link to="/memory" className="inline-block mt-3 text-xs font-jetbrains font-semibold tracking-widest hover:opacity-70" style={{ color: agent.color }}>
        VIEW ALL MEMORY →
      </Link>
    </Panel>
  )
}

function AtlasCron({ agent }) {
  const [data, setData] = useState(null)
  useEffect(() => {
    let alive = true
    fetch('/api/cron').then((r) => r.json()).then((d) => { if (alive) setData(d) }).catch(() => { if (alive) setData({ jobs: [] }) })
    return () => { alive = false }
  }, [])
  return (
    <Panel title="Cron Jobs" color={agent.color}>
      {data === null ? (
        <p className="text-sm text-gray-600">Loading…</p>
      ) : (data.jobs || []).length === 0 ? (
        <p className="text-sm text-yellow-600 font-jetbrains">{data.note || 'No cron jobs.'}</p>
      ) : (
        <div className="space-y-2">
          {data.jobs.map((j) => (
            <div key={j.id} className="rounded-lg px-3 py-2" style={{ background: '#111122', border: '1px solid #1a1a2e' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-jetbrains" style={{ color: agent.color }}>{j.name}</span>
                <span className="text-xs font-jetbrains" style={{ color: j.enabled ? '#00ff88' : '#666' }}>{j.enabled ? 'ENABLED' : 'OFF'}</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-jetbrains text-gray-600 mt-1">
                <span>{j.schedule}{j.tz ? ` · ${j.tz}` : ''}</span>
                {j.nextRun && <span>next {new Date(j.nextRun).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

function AtlasWorkspace({ agent, gatewayStatus }) {
  const online = gatewayStatus?.status === 'online'
  return (
    <Panel title="Workspace" color={agent.color}>
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Gateway" value={online ? 'ONLINE' : 'OFFLINE'} color={online ? '#00ff88' : '#ff4444'} />
        <StatTile label="Port" value="18789" color={agent.color} />
        <StatTile label="Root" value="~/.openclaw" color={agent.color} />
      </div>
      <p className="text-sm text-gray-400 mt-4 leading-relaxed">
        Local workspace at <span className="font-jetbrains text-gray-300">~/.openclaw/workspace</span>. Memory, cron, and session state are managed here and surfaced through the gateway.
      </p>
    </Panel>
  )
}

// ---- Claude ----

function ClaudeRoom({ agent, activity }) {
  const row = useTokenRow('Claude')
  return (
    <>
      <Panel title="Model" color={agent.color}>
        <div className="grid grid-cols-4 gap-3">
          <StatTile label="Model" value="Sonnet 4.6" color={agent.color} />
          <StatTile label="Context" value="200k" color={agent.color} />
          <StatTile label="Tokens" value={row ? Number(row.tokens || 0).toLocaleString('en-US') : '—'} color={agent.color} />
          <StatTile label="Est. Cost" value={row ? `$${Number(row.cost || 0).toFixed(2)}` : '—'} color={agent.color} />
        </div>
        <p className="text-sm text-gray-500 mt-3 font-jetbrains text-xs">Provider: Anthropic</p>
      </Panel>
      <Panel title="Recent Activity" color={agent.color}>
        <ActivityList activity={activity} agentName="Claude" color={agent.color} />
        <a href="https://claude.ai" target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2 mt-4 text-xs font-jetbrains font-semibold tracking-widest transition-opacity hover:opacity-70" style={{ color: agent.color }}>
          OPEN CLAUDE.AI
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
      </Panel>
    </>
  )
}

// ---- Ollama ----

function OllamaRoom({ agent }) {
  const [models, setModels] = useState(null)
  const [loaded, setLoaded] = useState(null)
  const [err, setErr] = useState(null)
  const [latency, setLatency] = useState(null)

  useEffect(() => {
    let alive = true
    const load = async () => {
      const t0 = performance.now()
      try {
        const res = await fetch('/api/ollama/models')
        const data = await res.json()
        if (!alive) return
        setLatency(Math.round(performance.now() - t0))
        if (data.error || !data.models) { setErr(data.error || 'Ollama not reachable'); setModels([]) }
        else { setModels(data.models); setErr(null) }
      } catch {
        if (alive) { setErr('Ollama not reachable'); setModels([]) }
      }
      try {
        const res = await fetch('/api/ollama/ps')
        const data = await res.json()
        if (alive) setLoaded(data.models || [])
      } catch { if (alive) setLoaded([]) }
    }
    load()
    const id = setInterval(load, 60000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  return (
    <>
      <Panel title="Runtime" color={agent.color}>
        <div className="grid grid-cols-3 gap-3">
          <StatTile label="Backend" value="CPU/Metal" color={agent.color} />
          <StatTile label="Latency" value={latency != null ? `${latency}ms` : '—'} color={agent.color} />
          <StatTile label="Endpoint" value=":11434" color={agent.color} />
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={() => alert('Pull is visual-only in this build.')} className="px-3 py-1.5 rounded-lg text-xs font-jetbrains font-semibold tracking-widest transition-opacity hover:opacity-80"
            style={{ background: `${agent.color}15`, border: `1px solid ${agent.color}40`, color: agent.color }}>PULL MODEL</button>
          <button onClick={() => alert('List is visual-only in this build.')} className="px-3 py-1.5 rounded-lg text-xs font-jetbrains font-semibold tracking-widest transition-opacity hover:opacity-80"
            style={{ background: '#111122', border: '1px solid #1a1a2e', color: '#888' }}>LIST</button>
        </div>
      </Panel>

      <Panel title="Loaded in Memory" color={agent.color}>
        {loaded === null ? <p className="text-sm text-gray-600">Loading…</p>
          : loaded.length === 0 ? <p className="text-sm text-gray-600">No models currently loaded in memory.</p>
          : (
            <div className="space-y-2">
              {loaded.map((m, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: '#111122', border: '1px solid #1a1a2e' }}>
                  <span className="text-sm font-jetbrains" style={{ color: agent.color }}>{m.name}</span>
                  <span className="text-xs font-jetbrains text-gray-600">
                    {m.size ? `${(m.size / 1e9).toFixed(1)} GB` : ''}{m.expiresAt ? ` · until ${new Date(m.expiresAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
      </Panel>

      <Panel title="Available Models" color={agent.color}>
        {models === null ? <p className="text-sm text-gray-600">Loading…</p>
          : err ? <p className="text-sm text-yellow-600 font-jetbrains">{err} — is Ollama running?</p>
          : models.length === 0 ? <p className="text-sm text-gray-600">No models installed.</p>
          : (
            <div className="space-y-2">
              {models.map((m, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: '#111122', border: '1px solid #1a1a2e' }}>
                  <span className="text-sm font-jetbrains" style={{ color: agent.color }}>{m.name}</span>
                  <span className="text-xs font-jetbrains text-gray-600">{m.size ? `${(m.size / 1e9).toFixed(1)} GB` : ''}</span>
                </div>
              ))}
            </div>
          )}
      </Panel>
    </>
  )
}

// ---- Codex ----

function CodexRoom({ agent, activity }) {
  const row = useTokenRow('Codex')
  return (
    <>
      <Panel title="Runtime" color={agent.color}>
        <div className="grid grid-cols-4 gap-3">
          <StatTile label="Model" value="gpt-5.5" color={agent.color} />
          <StatTile label="Runtime" value="Codex" color={agent.color} />
          <StatTile label="Tokens" value={row ? Number(row.tokens || 0).toLocaleString('en-US') : '—'} color={agent.color} />
          <StatTile label="Est. Cost" value={row ? `$${Number(row.cost || 0).toFixed(2)}` : '—'} color={agent.color} />
        </div>
        <p className="text-sm text-gray-500 mt-3 font-jetbrains text-xs">Provider: OpenAI</p>
      </Panel>
      <Panel title="Recent Activity" color={agent.color}>
        <ActivityList activity={activity} agentName="Codex" color={agent.color} />
      </Panel>
    </>
  )
}

// ---- Gemini ----

function GeminiRoom({ agent, activity }) {
  const row = useTokenRow('Gemini')
  return (
    <>
      <Panel title="Model" color={agent.color}>
        <div className="grid grid-cols-4 gap-3">
          <StatTile label="Model" value="Gemini 2.0" color={agent.color} />
          <StatTile label="Provider" value="Google" color={agent.color} />
          <StatTile label="Tokens" value={row ? Number(row.tokens || 0).toLocaleString('en-US') : '—'} color={agent.color} />
          <StatTile label="Est. Cost" value={row ? `$${Number(row.cost || 0).toFixed(2)}` : '—'} color={agent.color} />
        </div>
      </Panel>
      <Panel title="Recent Activity" color={agent.color}>
        <ActivityList activity={activity} agentName="Gemini" color={agent.color} />
      </Panel>
    </>
  )
}

// ---- OpenClaw ----

function OpenClawRoom({ agent, gatewayStatus }) {
  const [sessions, setSessions] = useState(null)
  const online = gatewayStatus?.status === 'online'
  useEffect(() => {
    let alive = true
    fetch('/api/atlas/sessions').then((r) => r.json()).then((d) => { if (alive) setSessions(d) }).catch(() => { if (alive) setSessions({ sessions: [] }) })
    return () => { alive = false }
  }, [])
  const sessCount = sessions ? sessions.sessions.length : null
  return (
    <>
      <Panel title="Gateway" color={agent.color}>
        <div className="grid grid-cols-4 gap-3">
          <StatTile label="Status" value={online ? 'ONLINE' : (gatewayStatus?.status || 'unknown').toUpperCase()} color={online ? '#00ff88' : '#ff4444'} />
          <StatTile label="Port" value="18789" color={agent.color} />
          <StatTile label="Mode" value="Bridge" color={agent.color} />
          <StatTile label="Sessions" value={sessCount != null ? sessCount : (sessions?.note ? 'n/a' : '—')} color={agent.color} />
        </div>
      </Panel>
      <Panel title="Connectivity" color={agent.color}>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: '#111122', border: '1px solid #1a1a2e' }}>
            <span className="text-sm text-gray-300">Telegram channel</span>
            <span className="text-xs font-jetbrains font-semibold text-ollama">CONFIGURED</span>
          </div>
          <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: '#111122', border: '1px solid #1a1a2e' }}>
            <span className="text-sm text-gray-300">ngrok tunnel</span>
            <a href="https://openclaw-gateway.ngrok.io" target="_blank" rel="noreferrer" className="text-xs font-jetbrains hover:opacity-70" style={{ color: agent.color }}>
              openclaw-gateway.ngrok.io →
            </a>
          </div>
        </div>
      </Panel>
    </>
  )
}

const ROOMS = {
  atlas: AtlasRoom,
  claude: ClaudeRoom,
  ollama: OllamaRoom,
  codex: CodexRoom,
  gemini: GeminiRoom,
  openclaw: OpenClawRoom,
}

export default function AgentRoom({ gatewayStatus, activity }) {
  const { id } = useParams()
  const agent = getAgent(id)

  if (!agent) {
    return (
      <div className="flex min-h-screen" style={{ background: '#0a0a0f' }}>
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 font-jetbrains mb-3">Unknown agent: {id}</p>
            <Link to="/" className="text-atlas text-sm font-jetbrains">← Back to Mission Control</Link>
          </div>
        </main>
      </div>
    )
  }

  const RoomContent = ROOMS[agent.id]
  const statusColor = STATUS_COLORS[agent.status] || STATUS_COLORS.unknown

  return (
    <div className="flex min-h-screen" style={{ background: '#0a0a0f' }}>
      <Sidebar />

      <main className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: `1px solid ${agent.color}25`, background: '#080810' }}>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-gray-600 hover:text-atlas transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </Link>
            <span className="text-xs font-jetbrains font-semibold tracking-widest uppercase" style={{ color: agent.color }}>
              CONTROL ROOM · {agent.name}
            </span>
          </div>
          <LiveClock />
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold font-jetbrains flex-shrink-0"
              style={{ background: `${agent.color}20`, border: `2px solid ${agent.color}60`, color: agent.color, boxShadow: `0 0 25px ${agent.color}40` }}>
              {agent.initial}
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: agent.color, textShadow: `0 0 20px ${agent.color}50` }}>
                {agent.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full" style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}`, animation: 'pulse-glow 2s ease-in-out infinite' }} />
                <span className="text-xs font-jetbrains font-semibold tracking-widest uppercase" style={{ color: statusColor }}>{agent.status}</span>
                <span className="text-gray-700">·</span>
                <span className="text-xs font-jetbrains text-gray-600">{agent.provider} · {agent.model}</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">{agent.description}</p>

          <div className="space-y-6 max-w-4xl">
            <RoomContent agent={agent} gatewayStatus={gatewayStatus} activity={activity} />
          </div>
        </div>
      </main>
    </div>
  )
}
