import Sidebar from '../components/Sidebar.jsx'
import KanbanBoard from '../components/KanbanBoard.jsx'
import ActivityFeed from '../components/ActivityFeed.jsx'
import SharedLog from '../components/SharedLog.jsx'

const AGENT_COLORS = {
  Atlas: '#00e5ff',
  Claude: '#ff6b35',
  Ollama: '#39ff14',
}

function StatPill({ label, value, color }) {
  return (
    <div
      className="rounded-xl px-5 py-4 flex flex-col gap-1"
      style={{ background: '#0d0d1a', border: `1px solid ${color}30` }}
    >
      <div className="text-xs font-jetbrains text-gray-600 uppercase tracking-widest">{label}</div>
      <div className="text-2xl font-bold font-jetbrains" style={{ color }}>{value}</div>
    </div>
  )
}

function AgentStatusRow({ tasks }) {
  const agents = ['Atlas', 'Claude', 'Ollama']
  return (
    <div className="flex gap-3">
      {agents.map(agent => {
        const color = AGENT_COLORS[agent]
        const agentTasks = tasks.filter(t => t.agent === agent)
        const active = agentTasks.some(t => t.status === 'in_progress')
        const lastTask = agentTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
        const lastActivity = lastTask
          ? new Date(lastTask.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          : 'No tasks'

        return (
          <div
            key={agent}
            className="flex-1 rounded-lg px-4 py-3 flex items-center gap-3"
            style={{ background: '#0d0d1a', border: `1px solid ${active ? color + '40' : '#1a1a2e'}` }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-jetbrains flex-shrink-0"
              style={{ background: `${color}15`, border: `1px solid ${color}50`, color }}
            >
              {agent[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{agent}</span>
                <span
                  className="text-xs font-jetbrains font-semibold"
                  style={{ color: active ? color : '#555' }}
                >
                  {active ? 'ACTIVE' : 'IDLE'}
                </span>
              </div>
              <div className="text-xs font-jetbrains text-gray-600 truncate">{lastActivity}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Tasks({ tasks, activity, sharedLog, addTask, updateTask, deleteTask, addLogMessage }) {
  const todo = tasks.filter(t => t.status === 'todo')
  const inProgress = tasks.filter(t => t.status === 'in_progress')
  const done = tasks.filter(t => t.status === 'done')

  const thisWeek = tasks.filter(t => {
    const created = new Date(t.createdAt)
    const now = new Date()
    const diff = (now - created) / (1000 * 60 * 60 * 24)
    return diff <= 7
  })

  const completionPct = tasks.length > 0 ? Math.round((done.length / tasks.length) * 100) : 0

  return (
    <div className="flex min-h-screen" style={{ background: '#0a0a0f' }}>
      <Sidebar />

      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Header */}
        <div
          className="px-6 py-5"
          style={{ borderBottom: '1px solid #1a1a2e', background: '#080810' }}
        >
          <h1 className="text-xl font-bold text-white">Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Monitor task throughput, progress, activity, and shared logs
          </p>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Stat Pills */}
          <div className="grid grid-cols-4 gap-3">
            <StatPill label="This Week" value={thisWeek.length} color="#00e5ff" />
            <StatPill label="In Progress" value={inProgress.length} color="#ff8c00" />
            <StatPill label="Total" value={tasks.length} color="#888" />
            <StatPill label="Completion" value={`${completionPct}%`} color="#39ff14" />
          </div>

          {/* Agent Status */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-jetbrains font-semibold tracking-widest text-gray-600 uppercase">
                Agent Status
              </span>
              <div className="flex-1 h-px" style={{ background: '#1a1a2e' }} />
            </div>
            <AgentStatusRow tasks={tasks} />
          </div>

          {/* Kanban Board */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-jetbrains font-semibold tracking-widest text-gray-600 uppercase">
                Board
              </span>
              <div className="flex-1 h-px" style={{ background: '#1a1a2e' }} />
            </div>
            <KanbanBoard
              tasks={tasks}
              onUpdate={updateTask}
              onDelete={deleteTask}
              onAdd={addTask}
            />
          </div>

          {/* Activity + Log */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-jetbrains font-semibold tracking-widest text-gray-600 uppercase">
                Operations
              </span>
              <div className="flex-1 h-px" style={{ background: '#1a1a2e' }} />
            </div>
            <div className="flex gap-4">
              <div className="flex-1" style={{ flex: '3' }}>
                <ActivityFeed entries={activity} />
              </div>
              <div className="flex-1" style={{ flex: '2' }}>
                <SharedLog messages={sharedLog} onSend={addLogMessage} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
