import { useState, useEffect, useRef, useCallback } from 'react'

const BACKENDS = [
  { id: 'ollama', label: 'Ollama (local)' },
  { id: 'openclaw', label: 'OpenClaw (Atlas)' },
]
const VOICES = [
  { id: 'bm_daniel', label: 'bm_daniel · British male' },
  { id: 'bm_george', label: 'bm_george · British male' },
  { id: 'bm_lewis', label: 'bm_lewis · British male' },
  { id: 'am_michael', label: 'am_michael · American male' },
  { id: 'am_adam', label: 'am_adam · American male' },
  { id: 'af_heart', label: 'af_heart · female' },
]
const DEVICES = [
  { id: ':0', label: ':0 · Blue Snowball' },
  { id: ':1', label: ':1 · iPhone Mic' },
]

const ACCENT = '#00e5ff'

export default function VoiceEngine() {
  const [status, setStatus] = useState({ running: false, available: true })
  const [cfg, setCfg] = useState(null)
  const [logs, setLogs] = useState([])
  const [busy, setBusy] = useState(false)
  const logRef = useRef(null)

  const fetchStatus = useCallback(async () => {
    try {
      const r = await fetch('/api/voice/status')
      const d = await r.json()
      setStatus(d)
      if (d.config && !cfg) setCfg(d.config)
    } catch {}
  }, [cfg])

  const fetchLogs = useCallback(async () => {
    try {
      const r = await fetch('/api/voice/logs')
      const d = await r.json()
      setLogs(d.lines || [])
    } catch {}
  }, [])

  useEffect(() => {
    fetchStatus()
    fetchLogs()
    const id = setInterval(() => { fetchStatus(); fetchLogs() }, 5000)
    return () => clearInterval(id)
  }, [fetchStatus, fetchLogs])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [logs])

  const action = async (verb) => {
    setBusy(true)
    try {
      await fetch(`/api/voice/${verb}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg || {}),
      })
      await new Promise((r) => setTimeout(r, 800))
      await fetchStatus()
      await fetchLogs()
    } catch {}
    setBusy(false)
  }

  const set = (k, v) => setCfg((p) => ({ ...(p || {}), [k]: v }))

  const running = status.running
  const dot = running ? '#39ff14' : '#ff4444'

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: '#0d0d1a', border: `1px solid ${ACCENT}30`, boxShadow: `0 0 20px ${ACCENT}10` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: dot, boxShadow: `0 0 8px ${dot}`, animation: 'pulse-glow 2s ease-in-out infinite' }} />
          <div>
            <div className="text-sm font-semibold text-white">Local Voice Engine</div>
            <div className="text-xs font-jetbrains text-gray-600">Whisper · Kokoro-MLX · wake word "{cfg?.wakeWord || 'Atlas'}"</div>
          </div>
        </div>
        <span className="text-xs font-jetbrains font-semibold tracking-widest" style={{ color: running ? '#39ff14' : '#ff4444' }}>
          {status.available === false ? 'UNAVAILABLE' : running ? `RUNNING${status.pid ? ' · pid ' + status.pid : ''}` : 'STOPPED'}
        </span>
      </div>

      {status.available === false && (
        <div className="mb-4 px-3 py-2 rounded text-xs font-jetbrains text-yellow-500 bg-yellow-900/10 border border-yellow-800/30">
          {status.note || 'voice-poc-bg not found on this host.'}
        </div>
      )}

      {/* Config selectors */}
      {cfg && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Selector label="Backend" value={cfg.backend} onChange={(v) => set('backend', v)} options={BACKENDS} disabled={running} />
          <Selector label="Voice" value={cfg.voice} onChange={(v) => set('voice', v)} options={VOICES} disabled={running} />
          <Selector label="Mic" value={cfg.device} onChange={(v) => set('device', v)} options={DEVICES} disabled={running} />
          <div>
            <div className="text-xs font-jetbrains text-gray-600 mb-1">Wake word</div>
            <input
              value={cfg.wakeWord}
              disabled={running}
              onChange={(e) => set('wakeWord', e.target.value)}
              className="w-full bg-[#080810] border border-dark-border rounded px-2 py-1.5 text-xs font-jetbrains text-gray-300 focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => action('start')}
          disabled={busy || running || status.available === false}
          className="px-4 py-2 rounded-lg text-xs font-jetbrains font-semibold tracking-widest transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: '#39ff1418', border: '1px solid #39ff1450', color: '#39ff14' }}
        >
          ▶ START
        </button>
        <button
          onClick={() => action('stop')}
          disabled={busy || !running}
          className="px-4 py-2 rounded-lg text-xs font-jetbrains font-semibold tracking-widest transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: '#ff444418', border: '1px solid #ff444450', color: '#ff6b6b' }}
        >
          ■ STOP
        </button>
        <button
          onClick={() => action('restart')}
          disabled={busy || status.available === false}
          className="px-4 py-2 rounded-lg text-xs font-jetbrains font-semibold tracking-widest transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}50`, color: ACCENT }}
        >
          ↻ RESTART
        </button>
        {busy && <span className="text-xs font-jetbrains text-gray-600">working…</span>}
      </div>

      {/* Live logs */}
      <div>
        <div className="text-xs font-jetbrains text-gray-600 mb-1.5 uppercase tracking-widest">Live Log</div>
        <div
          ref={logRef}
          className="rounded-lg p-3 h-44 overflow-y-auto font-jetbrains text-xs leading-relaxed"
          style={{ background: '#060609', border: '1px solid #1a1a2e' }}
        >
          {logs.length === 0 ? (
            <span className="text-gray-700">No log output yet. Start the engine and say "{cfg?.wakeWord || 'Atlas'}".</span>
          ) : (
            logs.map((l, i) => {
              const isWake = /WAKE:|COMMAND:/.test(l)
              const isAtlas = /ATLAS:/.test(l)
              const isBlank = /BLANK_AUDIO|\?\?\?\?/.test(l)
              const color = isBlank ? '#ff7777' : isAtlas ? '#00e5ff' : isWake ? '#39ff14' : '#6b7280'
              return <div key={i} style={{ color }}>{l}</div>
            })
          )}
        </div>
      </div>
    </div>
  )
}

function Selector({ label, value, onChange, options, disabled }) {
  return (
    <div>
      <div className="text-xs font-jetbrains text-gray-600 mb-1">{label}</div>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#080810] border border-dark-border rounded px-2 py-1.5 text-xs font-jetbrains text-gray-300 cursor-pointer focus:outline-none disabled:opacity-50"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id} style={{ background: '#0d0d1a' }}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
