import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar.jsx'

const ACCENT = '#00e5ff'

export default function Journal() {
  const [entries, setEntries] = useState(null)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const res = await fetch('/api/journal')
        const data = await res.json()
        if (alive) setEntries(data.entries || [])
      } catch {
        if (alive) setEntries([])
      }
    }
    load()
    return () => { alive = false }
  }, [])

  const sorted = [...(entries || [])].sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="flex min-h-screen" style={{ background: '#0a0a0f' }}>
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="px-6 py-5" style={{ borderBottom: '1px solid #1a1a2e', background: '#080810' }}>
          <h1 className="text-xl font-bold text-white">Journal</h1>
          <p className="text-sm text-gray-500 mt-0.5">Daily summaries, newest first</p>
        </div>

        <div className="px-6 py-6 max-w-3xl space-y-4">
          {entries === null ? (
            <p className="text-sm text-gray-600">Loading…</p>
          ) : sorted.length === 0 ? (
            <p className="text-sm text-gray-600">No journal entries.</p>
          ) : (
            sorted.map((e) => (
              <div key={e.id || e.date} className="rounded-lg p-5" style={{ background: '#0d0d1a', border: `1px solid ${ACCENT}20` }}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-jetbrains font-semibold tracking-widest" style={{ color: ACCENT }}>
                    {new Date(e.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {e.title && <span className="text-sm font-semibold text-white">{e.title}</span>}
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{e.body}</p>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
