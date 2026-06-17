import { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'

const AGENTS = [
  { id: 'atlas', name: 'Atlas', color: '#00e5ff', desc: 'Autonomous Systems Agent. Local gateway, memory, skills — and a chat line.' },
  { id: 'claude', name: 'Claude', color: '#ff6b35', desc: 'Direct streaming line to Claude Code. Full tool use, MCPs, plugins.' },
]

const MODELS = [
  { id: 'dall-e-3', label: 'DALL·E 3', provider: 'openai' },
  { id: 'dall-e-2', label: 'DALL·E 2', provider: 'openai' },
]

const SIZES = ['1024×1024', '1792×1024', '1024×1792']

const TabBar = () => (
  <div className="flex items-center gap-1 border-b border-dark-border pb-0">
    {['Chat', 'Talk', 'Studio', 'Sessions', 'Goal Mode', 'Workspace'].map((tab) => (
      <NavLink
        key={tab}
        to={tab === 'Studio' ? '/studio' : '#'}
        onClick={tab !== 'Studio' ? (e) => e.preventDefault() : undefined}
        className={({ isActive }) =>
          `px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            tab === 'Studio'
              ? 'border-atlas text-atlas'
              : 'border-transparent text-gray-600 hover:text-gray-400 cursor-default'
          }`
        }
      >
        {tab === 'Studio' ? (
          <span className="flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Studio
          </span>
        ) : tab}
      </NavLink>
    ))}
  </div>
)

export default function Studio() {
  const [agent, setAgent] = useState(AGENTS[0])
  const [model, setModel] = useState(MODELS[0])
  const [size, setSize] = useState(SIZES[0])
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [images, setImages] = useState([])
  const [error, setError] = useState(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    fetch('/api/studio/images')
      .then((r) => r.json())
      .then((d) => setImages(d.images || []))
      .catch(() => {})
  }, [])

  const generate = async () => {
    if (!prompt.trim() || generating) return
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), model: model.id, size }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setImages((prev) => [data.image, ...prev])
      setPrompt('')
    } catch (e) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleKey = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') generate()
  }

  const deleteImage = async (id) => {
    await fetch(`/api/studio/images/${id}`, { method: 'DELETE' }).catch(() => {})
    setImages((prev) => prev.filter((img) => img.id !== id))
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#0a0a0f' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Agent header */}
        <div className="px-8 pt-6 pb-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-xs font-jetbrains text-gray-600 uppercase tracking-widest">
              <span>IV.</span>
              <span className="text-gray-700">—</span>
              <span>AGENT · {agent.name.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="text-xs font-jetbrains text-gray-600 bg-dark-border/50 px-2 py-1 rounded border border-dark-border">
                ⌘K Command palette
              </kbd>
              {/* Agent switcher */}
              <div className="flex gap-1">
                {AGENTS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAgent(a)}
                    className="px-3 py-1 rounded text-xs font-jetbrains transition-all"
                    style={{
                      background: agent.id === a.id ? `${a.color}20` : 'transparent',
                      color: agent.id === a.id ? a.color : '#6b7280',
                      border: `1px solid ${agent.id === a.id ? `${a.color}60` : '#1a1a2e'}`,
                    }}
                  >
                    {a.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mt-3" style={{ color: agent.color }}>
            {agent.name}
          </h1>
          <p className="text-sm text-gray-500 mt-1 mb-4">{agent.desc}</p>

          <div className="flex items-center gap-4 text-xs font-jetbrains text-gray-600 mb-5">
            <span>LOCAL · STUDIO</span>
          </div>

          <TabBar />
        </div>

        {/* Studio content */}
        <div className="flex-1 px-8 py-6 space-y-5">

          {/* Studio card */}
          <div
            className="rounded-xl p-5"
            style={{
              background: '#0d0d1a',
              border: `1px solid ${agent.color}30`,
              boxShadow: `0 0 20px ${agent.color}10`,
            }}
          >
            {/* Card header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${agent.color}20`, border: `1px solid ${agent.color}40` }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={agent.color} strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21,15 16,10 5,21"/>
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{agent.name} Studio</div>
                  <div className="text-xs text-gray-600 font-jetbrains">
                    {model.provider} · {model.label}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 text-xs font-jetbrains text-gray-500">
                <span className="flex items-center gap-1">
                  <span style={{ color: agent.color }}>◆</span> {images.length} images
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-gray-600">Model</span>
                  <select
                    value={model.id}
                    onChange={(e) => setModel(MODELS.find((m) => m.id === e.target.value))}
                    className="bg-transparent border border-dark-border rounded px-2 py-0.5 text-xs font-jetbrains text-gray-400 cursor-pointer"
                    style={{ outline: 'none' }}
                  >
                    {MODELS.map((m) => (
                      <option key={m.id} value={m.id} style={{ background: '#0d0d1a' }}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-gray-600">Size</span>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="bg-transparent border border-dark-border rounded px-2 py-0.5 text-xs font-jetbrains text-gray-400 cursor-pointer"
                    style={{ outline: 'none' }}
                  >
                    {SIZES.map((s) => (
                      <option key={s} value={s} style={{ background: '#0d0d1a' }}>{s}</option>
                    ))}
                  </select>
                </span>
              </div>
            </div>

            {/* Prompt area */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Describe what to generate... (⌘↵ to generate)"
                rows={3}
                className="w-full rounded-lg px-4 py-3 text-sm text-gray-300 placeholder-gray-700 resize-none focus:outline-none font-jetbrains"
                style={{
                  background: '#080810',
                  border: `1px solid ${prompt ? agent.color + '40' : '#1a1a2e'}`,
                  transition: 'border-color 0.2s',
                }}
              />
              <button
                onClick={generate}
                disabled={!prompt.trim() || generating}
                className="absolute bottom-3 right-3 px-4 py-1.5 rounded text-xs font-semibold font-jetbrains transition-all"
                style={{
                  background: prompt.trim() && !generating ? agent.color : '#1a1a2e',
                  color: prompt.trim() && !generating ? '#000' : '#4b5563',
                  cursor: prompt.trim() && !generating ? 'pointer' : 'not-allowed',
                }}
              >
                {generating ? (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                    Generating
                  </span>
                ) : (
                  '✦ Generate'
                )}
              </button>
            </div>

            {error && (
              <div className="mt-3 px-3 py-2 rounded text-xs font-jetbrains text-red-400 bg-red-900/20 border border-red-800/40">
                {error}
              </div>
            )}
          </div>

          {/* Generated images */}
          {images.length > 0 && (
            <div>
              <div className="text-xs font-jetbrains text-gray-600 uppercase tracking-widest mb-3">
                Generated · {images.length} image{images.length !== 1 ? 's' : ''}
              </div>
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="rounded-xl overflow-hidden group relative"
                    style={{
                      background: '#0d0d1a',
                      border: `1px solid #1a1a2e`,
                    }}
                  >
                    {(img.localUrl || img.url) ? (
                      <img
                        src={img.localUrl || img.url}
                        alt={img.prompt}
                        className="w-full aspect-square object-cover"
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    ) : (
                      <div
                        className="w-full aspect-square flex items-center justify-center"
                        style={{ background: `${agent.color}08` }}
                      >
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={agent.color} strokeWidth="1" opacity="0.3">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21,15 16,10 5,21"/>
                        </svg>
                      </div>
                    )}

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">{img.prompt}</p>
                        <div className="flex gap-1 flex-shrink-0">
                          {(img.localUrl || img.url) && (
                            <a
                              href={img.localUrl || img.url}
                              download={`studio-${img.id}.png`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                              title="Download"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>
                              </svg>
                            </a>
                          )}
                          <button
                            onClick={() => deleteImage(img.id)}
                            className="p-1.5 rounded text-gray-600 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                            title="Delete"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14H6L5,6"/><path d="M10,11v6M14,11v6"/><path d="M9,6V4h6v2"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="text-xs font-jetbrains text-gray-600 mt-2">
                        {new Date(img.createdAt).toLocaleString()}
                      </div>
                    </div>

                    {/* Prompt caption below */}
                    <div className="px-3 py-2 border-t border-dark-border">
                      <p className="text-xs text-gray-500 truncate">{img.prompt}</p>
                      <p className="text-xs font-jetbrains text-gray-700 mt-0.5">{img.model} · {img.size}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {images.length === 0 && !generating && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: `${agent.color}10`, border: `1px solid ${agent.color}20` }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={agent.color} strokeWidth="1.5" opacity="0.6">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21,15 16,10 5,21"/>
                </svg>
              </div>
              <p className="text-sm text-gray-600">No images generated yet.</p>
              <p className="text-xs text-gray-700 mt-1 font-jetbrains">Describe something above and press ⌘↵</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
