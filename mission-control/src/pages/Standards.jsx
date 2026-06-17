import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar.jsx'

const ACCENT = '#00e5ff'

function renderMarkdown(markdown) {
  const blocks = String(markdown || '').split('\n')
  const elements = []
  let list = []

  const flushList = () => {
    if (!list.length) return
    elements.push(
      <ul key={`list-${elements.length}`} className="list-disc pl-5 space-y-1 text-sm text-gray-400 leading-relaxed">
        {list.map((item, idx) => <li key={idx}>{item}</li>)}
      </ul>
    )
    list = []
  }

  blocks.forEach((line, idx) => {
    const trimmed = line.trim()
    if (!trimmed) {
      flushList()
      return
    }
    if (trimmed.startsWith('- ')) {
      list.push(trimmed.slice(2))
      return
    }
    flushList()
    if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={idx} className="text-2xl font-bold text-white">{trimmed.slice(2)}</h1>)
    } else if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={idx} className="text-sm font-jetbrains font-semibold tracking-widest uppercase pt-4" style={{ color: ACCENT }}>{trimmed.slice(3)}</h2>)
    } else if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={idx} className="text-sm font-semibold text-gray-200 pt-2">{trimmed.slice(4)}</h3>)
    } else if (trimmed.startsWith('```')) {
      elements.push(null)
    } else {
      elements.push(<p key={idx} className="text-sm text-gray-400 leading-relaxed">{trimmed}</p>)
    }
  })
  flushList()
  return elements.filter(Boolean)
}

export default function Standards() {
  const [standards, setStandards] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')
  const [note, setNote] = useState(null)
  const [taskNote, setTaskNote] = useState(null)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const res = await fetch('/api/standards')
        const data = await res.json()
        if (!alive) return
        const rows = data.standards || []
        setStandards(rows)
        setSelectedId(rows[0]?.id || null)
      } catch {
        if (alive) setNote('Could not reach the standards endpoint.')
      }
    }
    load()
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!selectedId) return
    let alive = true
    const load = async () => {
      try {
        const res = await fetch(`/api/standards/${selectedId}`)
        const data = await res.json()
        if (alive) setSelected(data.standard || null)
      } catch {
        if (alive) setSelected(null)
      }
    }
    load()
    return () => { alive = false }
  }, [selectedId])

  const q = query.trim().toLowerCase()
  const filtered = standards.filter((s) => !q || s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))

  const suggestEdit = async () => {
    if (!selected) return
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Review standards/${selected.file}`,
          description: `Suggested edit review for ${selected.title} standard.`,
          status: 'todo',
          priority: 'medium',
          agent: 'Atlas',
        }),
      })
      setTaskNote('Kanban task created.')
      setTimeout(() => setTaskNote(null), 2500)
    } catch {
      setTaskNote('Could not create task.')
    }
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#0a0a0f' }}>
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="px-6 py-5" style={{ borderBottom: '1px solid #1a1a2e', background: '#080810' }}>
          <h1 className="text-xl font-bold text-white">Standards</h1>
          <p className="text-sm text-gray-500 mt-0.5">P3 operating conventions and spec hygiene</p>
        </div>

        <div className="px-6 py-6 grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">
          <section className="space-y-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search standards..."
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: '#0d0d1a', border: '1px solid #1a1a2e', color: '#e2e8f0' }}
            />

            {note && <p className="text-sm text-yellow-600 font-jetbrains">{note}</p>}
            <div className="space-y-2">
              {filtered.map((standard) => (
                <button
                  key={standard.id}
                  onClick={() => setSelectedId(standard.id)}
                  className="w-full text-left rounded-lg p-4 transition-colors"
                  style={{
                    background: selectedId === standard.id ? '#101022' : '#0d0d1a',
                    border: `1px solid ${selectedId === standard.id ? `${ACCENT}60` : '#1a1a2e'}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-sm font-semibold text-white">{standard.title}</h2>
                    <span className="text-[10px] font-jetbrains text-gray-600 whitespace-nowrap">
                      {standard.updatedAt ? new Date(standard.updatedAt).toLocaleDateString() : 'new'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mt-1.5">{standard.description}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg p-6 min-h-[520px]" style={{ background: '#0d0d1a', border: `1px solid ${ACCENT}20` }}>
            {selected ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4" style={{ borderBottom: '1px solid #1a1a2e' }}>
                  <div>
                    <div className="text-xs font-jetbrains text-gray-600">{selected.file}</div>
                    <div className="text-xs font-jetbrains text-gray-700 mt-1">
                      Updated {selected.updatedAt ? new Date(selected.updatedAt).toLocaleString() : 'unknown'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {taskNote && <span className="text-xs font-jetbrains text-ollama">{taskNote}</span>}
                    <button
                      onClick={suggestEdit}
                      className="px-3 py-2 rounded-lg text-xs font-jetbrains font-semibold tracking-widest transition-opacity hover:opacity-80"
                      style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}50`, color: ACCENT }}
                    >
                      SUGGEST EDIT
                    </button>
                  </div>
                </div>
                <article className="space-y-3">{renderMarkdown(selected.markdown)}</article>
              </div>
            ) : (
              <p className="text-sm text-gray-600">Select a standard.</p>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
