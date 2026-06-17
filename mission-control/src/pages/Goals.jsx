import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar.jsx'

const ACCENT = '#00e5ff'

export default function Goals() {
  const [goals, setGoals] = useState([])
  const [text, setText] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/goals')
      const data = await res.json()
      setGoals(data.goals || [])
    } catch {}
  }, [])

  useEffect(() => { load() }, [load])

  const add = async (e) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    setText('')
    try {
      await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: t }),
      })
      load()
    } catch {}
  }

  const toggle = async (g) => {
    try {
      await fetch(`/api/goals/${g.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: !g.done }),
      })
      load()
    } catch {}
  }

  const active = goals.filter((g) => !g.done)
  const completed = goals.filter((g) => g.done)

  return (
    <div className="flex min-h-screen" style={{ background: '#0a0a0f' }}>
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="px-6 py-5" style={{ borderBottom: '1px solid #1a1a2e', background: '#080810' }}>
          <h1 className="text-xl font-bold text-white">Goals</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track P3 and SmartBites objectives</p>
        </div>

        <div className="px-6 py-6 max-w-3xl space-y-6">
          <form onSubmit={add} className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a new goal…"
              className="flex-1 px-4 py-2.5 rounded-lg text-sm bg-transparent outline-none"
              style={{ background: '#0d0d1a', border: '1px solid #1a1a2e', color: '#e2e8f0' }}
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg text-xs font-jetbrains font-semibold tracking-widest transition-opacity hover:opacity-80"
              style={{ background: `${ACCENT}20`, border: `1px solid ${ACCENT}60`, color: ACCENT }}
            >
              ADD
            </button>
          </form>

          <div className="space-y-2">
            {active.length === 0 && completed.length === 0 && (
              <p className="text-sm text-gray-600">No goals yet.</p>
            )}
            {active.map((g) => (
              <GoalRow key={g.id} goal={g} onToggle={toggle} />
            ))}
          </div>

          {completed.length > 0 && (
            <div>
              <div className="text-xs font-jetbrains font-semibold tracking-widest text-gray-700 uppercase mb-2">
                Completed ({completed.length})
              </div>
              <div className="space-y-2">
                {completed.map((g) => (
                  <GoalRow key={g.id} goal={g} onToggle={toggle} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function GoalRow({ goal, onToggle }) {
  return (
    <button
      onClick={() => onToggle(goal)}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-white/5"
      style={{ background: '#0d0d1a', border: '1px solid #1a1a2e' }}
    >
      <span
        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold"
        style={{
          background: goal.done ? `${ACCENT}30` : 'transparent',
          border: `1px solid ${goal.done ? ACCENT : '#333'}`,
          color: ACCENT,
        }}
      >
        {goal.done ? '✓' : ''}
      </span>
      <span className={`text-sm ${goal.done ? 'text-gray-600 line-through' : 'text-gray-200'}`}>
        {goal.text}
      </span>
    </button>
  )
}
