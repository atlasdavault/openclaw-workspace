import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar.jsx'

const ACCENT = '#00e5ff'

export default function Memory() {
  const [files, setFiles] = useState(null)
  const [note, setNote] = useState(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const res = await fetch('/api/memory')
        const data = await res.json()
        if (!alive) return
        setFiles(data.files || [])
        setNote(data.note || null)
      } catch {
        if (alive) { setFiles([]); setNote('Could not reach the memory endpoint.') }
      }
    }
    load()
    return () => { alive = false }
  }, [])

  const q = query.trim().toLowerCase()
  const filtered = (files || []).filter(
    (f) => !q || f.name.toLowerCase().includes(q) || (f.preview || '').toLowerCase().includes(q)
  )

  return (
    <div className="flex min-h-screen" style={{ background: '#0a0a0f' }}>
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="px-6 py-5" style={{ borderBottom: '1px solid #1a1a2e', background: '#080810' }}>
          <h1 className="text-xl font-bold text-white">Memory</h1>
          <p className="text-sm text-gray-500 mt-0.5">Workspace memory notes (read-only)</p>
        </div>

        <div className="px-6 py-6 space-y-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search memory…"
            className="w-full max-w-md px-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: '#0d0d1a', border: '1px solid #1a1a2e', color: '#e2e8f0' }}
          />

          {note && <p className="text-sm text-yellow-600 font-jetbrains">{note}</p>}
          {files === null ? (
            <p className="text-sm text-gray-600">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-600">{q ? 'No matching memory.' : 'No memory files.'}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((f) => (
                <div key={f.name} className="rounded-lg p-4" style={{ background: '#0d0d1a', border: `1px solid ${ACCENT}20` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-jetbrains font-semibold" style={{ color: ACCENT }}>{f.name}</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-3">{f.preview || '(empty)'}</p>
                  <div className="flex items-center justify-between text-xs font-jetbrains text-gray-700">
                    <span>{f.source}</span>
                    <span>{new Date(f.mtime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
