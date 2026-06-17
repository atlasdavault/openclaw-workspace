import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar.jsx'

const ACCENT = '#00e5ff'

const synthSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

function Field({ label, children, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-jetbrains font-semibold tracking-widest text-gray-500 uppercase">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-600">{hint}</p>}
    </div>
  )
}

const inputStyle = { background: '#0d0d1a', border: '1px solid #1a1a2e', color: '#e2e8f0' }

export default function Settings() {
  const [settings, setSettings] = useState({
    gatewayUrl: 'http://127.0.0.1:18789',
    ngrokUrl: 'https://p3mc.ngrok.io',
    tokenRefreshInterval: 30,
    wakeWordEnabled: false,
    voice: '',
    theme: 'dark',
  })
  const [voices, setVoices] = useState([])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/settings')
        const data = await res.json()
        setSettings((prev) => ({ ...prev, ...data }))
      } catch {}
    }
    load()
  }, [])

  useEffect(() => {
    if (!synthSupported) return
    const update = () => setVoices(window.speechSynthesis.getVoices() || [])
    update()
    window.speechSynthesis.onvoiceschanged = update
  }, [])

  const set = (k, v) => { setSettings((prev) => ({ ...prev, [k]: v })); setSaved(false) }

  const save = async () => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {}
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#0a0a0f' }}>
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="px-6 py-5" style={{ borderBottom: '1px solid #1a1a2e', background: '#080810' }}>
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Mission Control configuration</p>
        </div>

        <div className="px-6 py-6 max-w-2xl space-y-5">
          <Field label="Gateway URL">
            <input
              value={settings.gatewayUrl}
              onChange={(e) => set('gatewayUrl', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm font-jetbrains outline-none"
              style={inputStyle}
            />
          </Field>

          <Field label="ngrok Public URL" hint="Display only">
            <input
              value={settings.ngrokUrl}
              disabled
              className="w-full px-4 py-2.5 rounded-lg text-sm font-jetbrains outline-none opacity-60 cursor-not-allowed"
              style={inputStyle}
            />
          </Field>

          <Field label="Token Refresh Interval (seconds)">
            <input
              type="number"
              min="5"
              value={settings.tokenRefreshInterval}
              onChange={(e) => set('tokenRefreshInterval', Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-lg text-sm font-jetbrains outline-none"
              style={inputStyle}
            />
          </Field>

          <Field label="Wake Word (&quot;Hey Atlas&quot;)">
            <button
              onClick={() => set('wakeWordEnabled', !settings.wakeWordEnabled)}
              className="px-4 py-2 rounded-lg text-xs font-jetbrains font-semibold tracking-widest transition-opacity hover:opacity-80"
              style={{
                background: settings.wakeWordEnabled ? '#39ff1420' : '#111122',
                border: `1px solid ${settings.wakeWordEnabled ? '#39ff1460' : '#1a1a2e'}`,
                color: settings.wakeWordEnabled ? '#39ff14' : '#888',
              }}
            >
              {settings.wakeWordEnabled ? 'ENABLED' : 'DISABLED'}
            </button>
          </Field>

          <Field label="Voice" hint={synthSupported ? undefined : 'Speech synthesis unavailable in this browser'}>
            <select
              value={settings.voice}
              onChange={(e) => set('voice', e.target.value)}
              disabled={!synthSupported}
              className="w-full px-4 py-2.5 rounded-lg text-sm font-jetbrains outline-none disabled:opacity-50"
              style={inputStyle}
            >
              <option value="">System default</option>
              {voices.map((v) => (
                <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
              ))}
            </select>
          </Field>

          <Field label="Theme" hint="Dark only for now">
            <select
              value="dark"
              disabled
              className="w-full px-4 py-2.5 rounded-lg text-sm font-jetbrains outline-none opacity-60 cursor-not-allowed"
              style={inputStyle}
            >
              <option value="dark">Dark</option>
            </select>
          </Field>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={save}
              className="px-6 py-2.5 rounded-lg text-xs font-jetbrains font-semibold tracking-widest transition-opacity hover:opacity-80"
              style={{ background: `${ACCENT}20`, border: `1px solid ${ACCENT}60`, color: ACCENT }}
            >
              SAVE SETTINGS
            </button>
            {saved && <span className="text-xs font-jetbrains text-ollama">✓ Saved</span>}
          </div>
        </div>
      </main>
    </div>
  )
}
