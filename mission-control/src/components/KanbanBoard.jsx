import { useState } from 'react'

const AGENT_COLORS = {
  Atlas: '#00e5ff',
  Claude: '#ff6b35',
  Ollama: '#39ff14',
}

const PRIORITY_COLORS = {
  high: { color: '#ff4444', label: 'HIGH', bg: '#ff444415' },
  medium: { color: '#ff8c00', label: 'MED', bg: '#ff8c0015' },
  low: { color: '#39ff14', label: 'LOW', bg: '#39ff1415' },
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function TaskCard({ task, onUpdate, onDelete }) {
  const agentColor = AGENT_COLORS[task.agent] || '#888'
  const priority = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium

  return (
    <div
      className="rounded-lg p-3 space-y-2.5 transition-all duration-200 animate-slide-in"
      style={{ background: '#111122', border: '1px solid #1a1a2e' }}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-white leading-tight">{task.title}</h4>
        <span
          className="text-xs font-jetbrains font-bold px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ color: priority.color, background: priority.bg, border: `1px solid ${priority.color}40` }}
        >
          {priority.label}
        </span>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">{task.description}</p>

      <div className="flex items-center gap-2">
        <span
          className="text-xs font-jetbrains font-semibold px-2 py-0.5 rounded-full"
          style={{ color: agentColor, background: `${agentColor}15`, border: `1px solid ${agentColor}40` }}
        >
          {task.agent}
        </span>
        <span className="text-xs font-jetbrains text-gray-600 ml-auto">{formatDate(task.createdAt)}</span>
      </div>

      <div className="flex gap-1.5 pt-1">
        {task.status !== 'in_progress' && (
          <button
            onClick={() => onUpdate(task.id, { status: 'in_progress' })}
            className="text-xs font-jetbrains px-2 py-1 rounded transition-all hover:opacity-80"
            style={{ background: '#00e5ff15', border: '1px solid #00e5ff30', color: '#00e5ff' }}
          >
            Start
          </button>
        )}
        {task.status !== 'done' && (
          <button
            onClick={() => onUpdate(task.id, { status: 'done' })}
            className="text-xs font-jetbrains px-2 py-1 rounded transition-all hover:opacity-80"
            style={{ background: '#39ff1415', border: '1px solid #39ff1430', color: '#39ff14' }}
          >
            Done
          </button>
        )}
        <button
          onClick={() => onDelete(task.id)}
          className="text-xs font-jetbrains px-2 py-1 rounded transition-all hover:opacity-80 ml-auto"
          style={{ background: '#ff444415', border: '1px solid #ff444430', color: '#ff4444' }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

function Column({ title, tasks, color, badgeColor, onUpdate, onDelete }) {
  return (
    <div
      className="flex-1 min-w-0 rounded-xl flex flex-col"
      style={{ background: '#0a0a14', border: `1px solid ${color}25` }}
    >
      <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: `${color}20` }}>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span
          className="text-xs font-jetbrains font-bold px-2 py-0.5 rounded-full ml-auto"
          style={{ background: `${badgeColor}20`, color: badgeColor, border: `1px solid ${badgeColor}40` }}
        >
          {tasks.length}
        </span>
      </div>
      <div className="flex-1 p-3 space-y-3 overflow-y-auto" style={{ minHeight: 120 }}>
        {tasks.length === 0 ? (
          <div className="text-xs text-gray-700 font-jetbrains text-center py-6">Empty</div>
        ) : (
          tasks.map(task => (
            <TaskCard key={task.id} task={task} onUpdate={onUpdate} onDelete={onDelete} />
          ))
        )}
      </div>
    </div>
  )
}

export default function KanbanBoard({ tasks = [], onUpdate, onDelete, onAdd }) {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', agent: 'Atlas' })

  const todo = tasks.filter(t => t.status === 'todo')
  const inProgress = tasks.filter(t => t.status === 'in_progress')
  const done = tasks.filter(t => t.status === 'done')

  const handleAdd = async () => {
    if (!form.title.trim()) return
    await onAdd({ ...form, status: 'todo' })
    setForm({ title: '', description: '', priority: 'medium', agent: 'Atlas' })
    setShowModal(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Kanban Board</h2>
        <button
          onClick={() => setShowModal(true)}
          className="text-xs font-jetbrains font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
          style={{ background: '#00e5ff20', border: '1px solid #00e5ff40', color: '#00e5ff' }}
        >
          + New Task
        </button>
      </div>

      <div className="flex gap-4">
        <Column title="To Do" tasks={todo} color="#666" badgeColor="#888" onUpdate={onUpdate} onDelete={onDelete} />
        <Column title="In Progress" tasks={inProgress} color="#00e5ff" badgeColor="#00e5ff" onUpdate={onUpdate} onDelete={onDelete} />
        <Column title="Done" tasks={done} color="#39ff14" badgeColor="#39ff14" onUpdate={onUpdate} onDelete={onDelete} />
      </div>

      {/* New Task Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={e => e.target === e.currentTarget && setShowModal(false)}
        >
          <div
            className="w-full max-w-md rounded-xl p-6 space-y-4"
            style={{ background: '#0d0d1a', border: '1px solid #1a1a2e' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">New Task</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-jetbrains text-gray-500 mb-1">Title</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Task title..."
                  className="w-full text-sm rounded-lg px-3 py-2 outline-none text-white placeholder-gray-700"
                  style={{ background: '#111122', border: '1px solid #1a1a2e' }}
                />
              </div>
              <div>
                <label className="block text-xs font-jetbrains text-gray-500 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description..."
                  rows={3}
                  className="w-full text-sm rounded-lg px-3 py-2 outline-none text-gray-300 placeholder-gray-700 resize-none"
                  style={{ background: '#111122', border: '1px solid #1a1a2e' }}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-jetbrains text-gray-500 mb-1">Agent</label>
                  <select
                    value={form.agent}
                    onChange={e => setForm(f => ({ ...f, agent: e.target.value }))}
                    className="w-full text-sm rounded-lg px-3 py-2 outline-none"
                    style={{ background: '#111122', border: '1px solid #1a1a2e', color: AGENT_COLORS[form.agent] || '#888' }}
                  >
                    <option value="Atlas">Atlas</option>
                    <option value="Claude">Claude</option>
                    <option value="Ollama">Ollama</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-jetbrains text-gray-500 mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full text-sm rounded-lg px-3 py-2 outline-none text-gray-300"
                    style={{ background: '#111122', border: '1px solid #1a1a2e' }}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 text-sm font-jetbrains py-2 rounded-lg transition-all hover:opacity-80"
                style={{ background: '#111122', border: '1px solid #1a1a2e', color: '#888' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 text-sm font-jetbrains font-semibold py-2 rounded-lg transition-all hover:opacity-80"
                style={{ background: '#00e5ff20', border: '1px solid #00e5ff50', color: '#00e5ff' }}
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
