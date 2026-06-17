import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import JarvisOrb from '../components/JarvisOrb.jsx'
import VoiceEngine from '../components/VoiceEngine.jsx'

function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="font-jetbrains text-atlas text-sm tabular-nums">
      {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  )
}

function ProgressBar({ value, color }) {
  return (
    <div className="h-1.5 rounded-full w-full" style={{ background: '#1a1a2e' }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${value}%`, background: color, boxShadow: `0 0 6px ${color}80` }}
      />
    </div>
  )
}

function StatusRow({ label, value, color }) {
  return (
    <div className="flex justify-between items-center gap-4 py-1">
      <span className="text-xs font-jetbrains text-gray-600 uppercase tracking-widest flex-shrink-0">{label}</span>
      <span className="text-xs font-jetbrains font-semibold" style={{ color: color || '#00e5ff' }}>{value}</span>
    </div>
  )
}

const TRANSCRIPT_SEED = [
  { speaker: 'ATLAS', text: 'Neural interface online. Say "Hey Atlas" or tap Listen to begin.', ts: nowTs() },
]

function nowTs() {
  return new Date().toLocaleTimeString('en-US', { hour12: false })
}

// Feature detection (module-level, safe — guarded for SSR/build)
const SR =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null
const speechSupported = !!SR
const synthSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

export default function JarvisWall({ gatewayStatus }) {
  const [state, setState] = useState('idle') // idle | listening | speaking
  const [transcript, setTranscript] = useState(TRANSCRIPT_SEED)
  const [interim, setInterim] = useState('')
  const [neuralThroughput] = useState(72)
  const [coreLoad] = useState(38)
  const [signal] = useState(91)
  const [wakeEnabled, setWakeEnabled] = useState(false)
  const [notice, setNotice] = useState(null)
  const [toasts, setToasts] = useState([])

  const recognitionRef = useRef(null)
  const wakeRef = useRef(null)
  const audioRef = useRef(null)
  const stateRef = useRef('idle')
  const wakeEnabledRef = useRef(false)
  const transcriptEndRef = useRef(null)
  stateRef.current = state
  wakeEnabledRef.current = wakeEnabled

  // --- Toast system (top-right, auto-dismiss ~4s) ---
  const toast = useCallback((message) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const stateColors = {
    idle: '#00b4d8',
    listening: '#00e5ff',
    speaking: '#39ff14',
  }
  const stateColor = stateColors[state]
  const stateLabels = { idle: '• I D L E', listening: 'LISTENING', speaking: 'SPEAKING' }

  const pushEntry = useCallback((speaker, text) => {
    setTranscript((prev) => [...prev, { speaker, text, ts: nowTs() }])
  }, [])

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript, interim])

  const browserSpeakFallback = useCallback((text, finish) => {
    if (!synthSupported || !text) {
      finish()
      return
    }
    try {
      window.speechSynthesis.cancel()
      const utter = new SpeechSynthesisUtterance(text)
      const voices = window.speechSynthesis.getVoices() || []
      const preferredNames = ['Daniel', 'Alex', 'Google UK English Male', 'Google US English']
      const voice =
        voices.find((v) => preferredNames.some((n) => v.name.includes(n)) && v.lang.startsWith('en-GB')) ||
        voices.find((v) => preferredNames.some((n) => v.name.includes(n)) && v.lang.startsWith('en')) ||
        voices.find((v) => /male/i.test(v.name) && v.lang.startsWith('en')) ||
        voices.find((v) => v.lang.startsWith('en-GB')) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0]
      if (voice) utter.voice = voice
      utter.rate = 0.96
      utter.pitch = 0.9
      utter.onend = finish
      utter.onerror = finish
      setState('speaking')
      window.speechSynthesis.speak(utter)
    } catch {
      finish()
    }
  }, [])

  // --- Local Kokoro speech: bm_daniel WAV from Mission Control server ---
  const speak = useCallback(
    async (text) => {
      const finish = () => {
        setState('idle')
        if (wakeEnabledRef.current) startWake()
      }
      if (!text) {
        finish()
        return
      }

      try {
        setNotice(null)
        setState('speaking')
        if (synthSupported) window.speechSynthesis.cancel()
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current = null
        }

        const ctrl = new AbortController()
        const to = setTimeout(() => ctrl.abort(), 95000)
        const res = await fetch('/api/voice/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice: 'bm_daniel' }),
          signal: ctrl.signal,
        })
        clearTimeout(to)
        if (!res.ok) {
          let detail = 'local TTS failed'
          try {
            const data = await res.json()
            detail = data.error || detail
          } catch {}
          throw new Error(detail)
        }

        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audioRef.current = audio
        audio.onended = () => {
          URL.revokeObjectURL(url)
          if (audioRef.current === audio) audioRef.current = null
          finish()
        }
        audio.onerror = () => {
          URL.revokeObjectURL(url)
          if (audioRef.current === audio) audioRef.current = null
          setNotice('Local bm_daniel voice playback failed — using browser voice fallback.')
          browserSpeakFallback(text, finish)
        }
        await audio.play()
      } catch {
        setNotice('Local bm_daniel voice unavailable — using browser voice fallback.')
        browserSpeakFallback(text, finish)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [browserSpeakFallback]
  )

  // --- Send a final transcript to the agent, display reply, speak it ---
  const sendToAgent = useCallback(
    async (message) => {
      if (!message.trim()) {
        setState('idle')
        return
      }
      let reply = null
      try {
        const ctrl = new AbortController()
        const to = setTimeout(() => ctrl.abort(), 125000)
        const res = await fetch('/api/agent/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, session: 'jarvis' }),
          signal: ctrl.signal,
        })
        clearTimeout(to)
        const data = await res.json()
        reply = data.reply || null
      } catch {
        // fetch failed / gateway unreachable
      }
      if (reply) {
        pushEntry('ATLAS', reply)
        speak(reply)
      } else {
        pushEntry('SYSTEM', 'Gateway unreachable — could not reach the agent endpoint.')
        setState('idle')
        if (wakeEnabledRef.current) startWake()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pushEntry, speak]
  )

  // --- Active listening (button / wake-triggered) ---
  const startListening = useCallback(() => {
    if (!speechSupported) {
      toast('Voice requires Chrome or Edge')
      return
    }
    // stop wake recognizer to avoid double-capture
    try { wakeRef.current?.stop() } catch {}

    try {
      const rec = new SR()
      rec.lang = 'en-US'
      rec.interimResults = true
      rec.continuous = false
      recognitionRef.current = rec

      let finalText = ''
      let dispatched = false
      rec.onresult = (e) => {
        let interimText = ''
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript
          if (e.results[i].isFinal) finalText += t
          else interimText += t
        }
        setInterim(interimText)
      }
      rec.onerror = (e) => {
        setInterim('')
        if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
          toast('Microphone access required — check browser permissions')
        } else if (e?.error && e.error !== 'no-speech' && e.error !== 'aborted') {
          toast('Voice error: ' + e.error)
        }
        setState('idle')
        if (wakeEnabledRef.current) startWake()
      }
      rec.onend = () => {
        setInterim('')
        const text = finalText.trim()
        if (text && !dispatched) {
          dispatched = true
          pushEntry('YOU', text)
          sendToAgent(text) // resumes wake after speak/IDLE
        } else if (!text) {
          if (stateRef.current === 'listening') setState('idle')
          if (wakeEnabledRef.current) startWake()
        }
      }
      setState('listening')
      rec.start()
    } catch {
      setState('idle')
      if (wakeEnabledRef.current) startWake()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pushEntry, sendToAgent, toast])

  const stopListening = useCallback(() => {
    try { recognitionRef.current?.stop() } catch {}
    setState('idle')
  }, [])

  // --- Wake-word background recognition ---
  const startWake = useCallback(() => {
    if (!speechSupported) return
    // Guard against overlapping instances or starting while actively listening/speaking.
    if (wakeRef.current || stateRef.current !== 'idle') return
    try {
      const rec = new SR()
      rec.lang = 'en-US'
      rec.interimResults = false
      rec.continuous = true
      wakeRef.current = rec
      rec.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (!e.results[i].isFinal) continue
          const t = e.results[i][0].transcript.toLowerCase()
          if (t.includes('hey atlas') || t.includes('hey, atlas')) {
            wakeRef.current = null
            try { rec.stop() } catch {}
            startListening()
            return
          }
        }
      }
      rec.onerror = (e) => {
        if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
          toast('Microphone access required — check browser permissions')
          setWakeEnabled(false)
          wakeEnabledRef.current = false
        }
      }
      rec.onend = () => {
        if (wakeRef.current === rec) wakeRef.current = null
        // Chrome auto-stops continuous recognition — re-arm if still enabled & idle.
        if (wakeEnabledRef.current && stateRef.current === 'idle') {
          startWake()
        }
      }
      rec.start()
    } catch {
      wakeRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startListening, toast])

  const toggleWake = useCallback(() => {
    if (!speechSupported) {
      toast('Voice requires Chrome or Edge')
      return
    }
    setWakeEnabled((prev) => {
      const next = !prev
      wakeEnabledRef.current = next
      if (next) {
        startWake()
      } else {
        const rec = wakeRef.current
        wakeRef.current = null
        try { rec?.stop() } catch {}
      }
      return next
    })
  }, [startWake, toast])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try { recognitionRef.current?.abort() } catch {}
      try { wakeRef.current?.abort() } catch {}
      try { audioRef.current?.pause() } catch {}
      if (synthSupported) window.speechSynthesis.cancel()
    }
  }, [])

  // Warm up voices list (Chrome loads async)
  useEffect(() => {
    if (synthSupported) {
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
    }
  }, [])

  const listening = state === 'listening'

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#060609' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4" style={{ borderBottom: '1px solid #0d0d1a' }}>
        <div className="flex items-center gap-3">
          <Link to="/" className="text-gray-600 hover:text-atlas transition-colors mr-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </Link>
          <div>
            <div className="text-xs font-jetbrains font-semibold tracking-widest text-atlas uppercase">
              ATLAS / NEURAL INTERFACE
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: '#39ff14', boxShadow: '0 0 6px #39ff14', animation: 'pulse-glow 2s ease-in-out infinite' }}
              />
              <span className="text-xs font-jetbrains text-ollama">ONLINE</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {wakeEnabled && (
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: '#39ff14', boxShadow: '0 0 8px #39ff14', animation: 'pulse-glow 1.2s ease-in-out infinite' }}
              />
              <span className="text-xs font-jetbrains font-semibold tracking-widest text-ollama">WAKE</span>
            </div>
          )}
          <LiveClock />
        </div>
      </div>

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="px-4 py-3 rounded-lg text-xs font-jetbrains animate-slide-in shadow-lg"
            style={{ background: '#1a0d12', border: '1px solid #ff444460', color: '#ff8888', maxWidth: 320 }}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div className="flex-1 flex gap-0">
        {/* Left panel */}
        <div className="w-64 flex-shrink-0 p-6 space-y-1" style={{ borderRight: '1px solid #0d0d1a' }}>
          <div className="text-xs font-jetbrains font-semibold tracking-widest text-gray-700 uppercase mb-4">
            System Status
          </div>

          <StatusRow label="Status" value="OPERATIONAL" color="#39ff14" />
          <StatusRow label="Mode" value={state.toUpperCase()} color={stateColor} />
          <StatusRow label="Wake Word" value={wakeEnabled ? 'HEY ATLAS · ON' : 'HEY ATLAS'} color={wakeEnabled ? '#39ff14' : '#00e5ff'} />
          <StatusRow label="Voice" value="ATLAS-V1 · BM_DANIEL" color="#00e5ff" />

          <div className="pt-3 space-y-3">
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs font-jetbrains text-gray-600 uppercase tracking-widest">Neural Throughput</span>
                <span className="text-xs font-jetbrains text-atlas">{neuralThroughput}%</span>
              </div>
              <ProgressBar value={neuralThroughput} color="#00e5ff" />
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs font-jetbrains text-gray-600 uppercase tracking-widest">Core Load</span>
                <span className="text-xs font-jetbrains text-atlas">{coreLoad}%</span>
              </div>
              <ProgressBar value={coreLoad} color="#ff6b35" />
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs font-jetbrains text-gray-600 uppercase tracking-widest">Signal</span>
                <span className="text-xs font-jetbrains text-atlas">{signal}%</span>
              </div>
              <ProgressBar value={signal} color="#39ff14" />
            </div>
          </div>

          <StatusRow label="Latency" value={gatewayStatus?.status === 'online' ? '18ms' : '—'} color="#00e5ff" />

          {/* Voice controls */}
          <div className="pt-6 space-y-2">
            <div className="text-xs font-jetbrains font-semibold tracking-widest text-gray-700 uppercase mb-3">
              Voice Control
            </div>

            <button
              onClick={listening ? stopListening : startListening}
              disabled={!speechSupported}
              className="w-full text-xs font-jetbrains font-semibold py-2 rounded-lg transition-all hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: listening ? '#00e5ff20' : '#111122',
                border: `1px solid ${listening ? '#00e5ff60' : '#1a1a2e'}`,
                color: listening ? '#00e5ff' : '#888',
              }}
            >
              {listening ? '◉ STOP LISTENING' : '🎙 LISTEN'}
            </button>

            <button
              onClick={toggleWake}
              disabled={!speechSupported}
              className="w-full text-xs font-jetbrains font-semibold py-2 rounded-lg transition-all hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: wakeEnabled ? '#39ff1420' : '#111122',
                border: `1px solid ${wakeEnabled ? '#39ff1460' : '#1a1a2e'}`,
                color: wakeEnabled ? '#39ff14' : '#888',
              }}
            >
              {wakeEnabled ? '◉ WAKE WORD ON' : 'ENABLE "HEY ATLAS"'}
            </button>

            {!speechSupported && (
              <div className="text-xs font-jetbrains text-yellow-600 pt-1 leading-relaxed">
                Speech recognition not supported in this browser.
              </div>
            )}
            {!synthSupported && speechSupported && (
              <div className="text-xs font-jetbrains text-yellow-600 pt-1 leading-relaxed">
                Speech synthesis unavailable — replies shown as text only.
              </div>
            )}
            {notice && (
              <div className="text-xs font-jetbrains text-yellow-600 pt-1 leading-relaxed">{notice}</div>
            )}
          </div>
        </div>

        {/* Center — Orb */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 py-12">
          <div className="flex flex-col items-center gap-6">
            <JarvisOrb state={state} />

            <div className="flex items-center gap-3">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: stateColor, boxShadow: `0 0 8px ${stateColor}`, animation: 'pulse-glow 1.5s ease-in-out infinite' }}
              />
              <span
                className="text-lg font-jetbrains font-semibold tracking-[0.4em]"
                style={{ color: stateColor, textShadow: `0 0 20px ${stateColor}80` }}
              >
                {stateLabels[state]}
              </span>
              {state !== 'idle' && (
                <span className="font-jetbrains text-lg animate-blink" style={{ color: stateColor }}>_</span>
              )}
            </div>

            {interim && (
              <div className="max-w-md text-center text-sm font-jetbrains text-gray-400 italic px-4">
                "{interim}"
              </div>
            )}
          </div>

          <div className="w-64 flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${stateColor}40)` }} />
            <span className="text-xs font-jetbrains text-gray-700">ATLAS</span>
            <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${stateColor}40)` }} />
          </div>
        </div>

        {/* Right panel — Transcript */}
        <div className="w-72 flex-shrink-0 flex flex-col" style={{ borderLeft: '1px solid #0d0d1a' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: '#0d0d1a' }}>
            <div className="text-xs font-jetbrains font-semibold tracking-widest text-gray-700 uppercase">
              Transcript
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ maxHeight: 'calc(100vh - 140px)' }}>
            {transcript.map((entry, i) => {
              const isSystem = entry.speaker === 'SYSTEM'
              const isAtlas = entry.speaker === 'ATLAS'
              const color = isSystem ? '#ff5555' : isAtlas ? '#00e5ff' : '#ff6b35'
              return (
                <div key={i} className={`space-y-1 ${isSystem ? 'opacity-80' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-jetbrains font-semibold" style={{ color }}>{entry.speaker}</span>
                    <span className="text-xs font-jetbrains text-gray-700">{entry.ts}</span>
                  </div>
                  <p
                    className={`text-xs leading-relaxed pl-0.5 ${isSystem ? 'italic font-jetbrains' : 'text-gray-400'}`}
                    style={isSystem ? { color: '#ff7777' } : undefined}
                  >
                    {entry.text}
                  </p>
                </div>
              )
            })}
            {interim && (
              <div className="space-y-1 opacity-60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-jetbrains font-semibold" style={{ color: '#ff6b35' }}>YOU</span>
                  <span className="text-xs font-jetbrains text-gray-700">…</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed pl-0.5 italic">{interim}</p>
              </div>
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      </div>

      {/* Local Voice Engine — Kokoro/Whisper wake loop control */}
      <div className="px-8 py-6" style={{ borderTop: '1px solid #0d0d1a' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-jetbrains font-semibold tracking-widest text-gray-600 uppercase">
            Local Voice Engine
          </span>
          <div className="flex-1 h-px" style={{ background: '#1a1a2e' }} />
        </div>
        <VoiceEngine />
      </div>
    </div>
  )
}
