import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../components/Sidebar.jsx'

const STATUS = {
  active: { label: 'Active', color: '#39ff14' },
  pending: { label: 'Pending', color: '#fbbf24' },
  quarantined: { label: 'Quarantined', color: '#ef4444' },
}

function Badge({ status }) {
  const meta = STATUS[status] || { label: status || 'Unknown', color: '#94a3b8' }
  return (
    <span
      className="px-2 py-1 rounded text-[10px] font-jetbrains font-semibold uppercase"
      style={{ background: `${meta.color}16`, border: `1px solid ${meta.color}50`, color: meta.color }}
    >
      {meta.label}
    </span>
  )
}

function SummaryBox({ label, value, color }) {
  return (
    <div className="rounded-lg p-4" style={{ background: '#0d0d1a', border: `1px solid ${color}30` }}>
      <div className="text-2xl font-jetbrains font-bold" style={{ color }}>{value}</div>
      <div className="text-xs text-gray-600 mt-1">{label}</div>
    </div>
  )
}

export default function Skills() {
  const [skills, setSkills] = useState([])
  const [summary, setSummary] = useState({ total: 0, active: 0, pending: 0, quarantined: 0 })
  const [query, setQuery] = useState('')
  const [selectedName, setSelectedName] = useState(null)
  const [note, setNote] = useState(null)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const res = await fetch('/api/skills')
        const data = await res.json()
        if (!alive) return
        const rows = data.skills || []
        setSkills(rows)
        setSummary(data.summary || { total: rows.length, active: 0, pending: 0, quarantined: 0 })
        setSelectedName(rows[0]?.name || null)
        setNote(data.note || null)
      } catch {
        if (alive) setNote('Could not reach the skills endpoint.')
      }
    }
    load()
    return () => { alive = false }
  }, [])

  const q = query.trim().toLowerCase()
  const filtered = skills.filter((skill) =>
    !q ||
    skill.name.toLowerCase().includes(q) ||
    skill.description.toLowerCase().includes(q) ||
    skill.source.toLowerCase().includes(q)
  )
  const selected = useMemo(() => skills.find((skill) => skill.name === selectedName) || null, [skills, selectedName])

  return (
    <div className="flex min-h-screen" style={{ background: '#0a0a0f' }}>
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="px-6 py-5" style={{ borderBottom: '1px solid #1a1a2e', background: '#080810' }}>
          <h1 className="text-xl font-bold text-white">Skills</h1>
          <p className="text-sm text-gray-500 mt-0.5">Local capability registry, read-only MVP</p>
        </div>

        <div className="px-6 py-6 space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <SummaryBox label="Total Skills" value={summary.total} color="#00e5ff" />
            <SummaryBox label="Active" value={summary.active} color="#39ff14" />
            <SummaryBox label="Pending" value={summary.pending} color="#fbbf24" />
            <SummaryBox label="Quarantined" value={summary.quarantined} color="#ef4444" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
            <section className="space-y-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search skills..."
                className="w-full max-w-lg px-4 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: '#0d0d1a', border: '1px solid #1a1a2e', color: '#e2e8f0' }}
              />
              {note && <p className="text-sm text-yellow-600 font-jetbrains">{note}</p>}

              <div className="overflow-hidden rounded-lg" style={{ border: '1px solid #1a1a2e' }}>
                <table className="w-full text-left">
                  <thead style={{ background: '#080810' }}>
                    <tr className="text-xs font-jetbrains text-gray-600 uppercase">
                      <th className="px-4 py-3">Skill</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 hidden md:table-cell">Source</th>
                      <th className="px-4 py-3 hidden lg:table-cell">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((skill) => (
                      <tr
                        key={`${skill.source}-${skill.name}`}
                        onClick={() => setSelectedName(skill.name)}
                        className="cursor-pointer transition-colors"
                        style={{
                          background: selectedName === skill.name ? '#101022' : '#0d0d1a',
                          borderTop: '1px solid #1a1a2e',
                        }}
                      >
                        <td className="px-4 py-3">
                          <div className="text-sm font-semibold text-white">{skill.name}</div>
                          <div className="text-xs text-gray-600 line-clamp-1">{skill.description}</div>
                        </td>
                        <td className="px-4 py-3"><Badge status={skill.status} /></td>
                        <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500">{skill.source}</td>
                        <td className="px-4 py-3 hidden lg:table-cell text-xs font-jetbrains text-gray-600">
                          {skill.updatedAt ? new Date(skill.updatedAt).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="rounded-lg p-5 h-fit" style={{ background: '#0d0d1a', border: '1px solid #1a1a2e' }}>
              {selected ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-white">{selected.name}</h2>
                      <p className="text-xs text-gray-600 mt-1">{selected.source}</p>
                    </div>
                    <Badge status={selected.status} />
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">{selected.description}</p>
                  <div className="space-y-2 text-xs font-jetbrains">
                    <div className="flex justify-between gap-4"><span className="text-gray-700">Version</span><span className="text-gray-500">{selected.version || '—'}</span></div>
                    <div className="flex justify-between gap-4"><span className="text-gray-700">Last Used</span><span className="text-gray-500">{selected.lastUsed || '—'}</span></div>
                    <div className="flex justify-between gap-4"><span className="text-gray-700">Updated</span><span className="text-gray-500">{selected.updatedAt ? new Date(selected.updatedAt).toLocaleString() : '—'}</span></div>
                  </div>
                  <div className="pt-3" style={{ borderTop: '1px solid #1a1a2e' }}>
                    <div className="text-xs font-jetbrains text-gray-700 mb-2">Path</div>
                    <div className="text-xs text-gray-500 break-all">{selected.path}</div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">Select a skill.</p>
              )}
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}
