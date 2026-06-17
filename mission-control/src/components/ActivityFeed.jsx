function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000
  if (diff < 60) return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const AGENT_COLORS = {
  Atlas: '#00e5ff',
  Claude: '#ff6b35',
  Ollama: '#39ff14',
}

export default function ActivityFeed({ entries = [] }) {
  return (
    <div
      className="rounded-xl flex flex-col h-full"
      style={{ background: '#0d0d1a', border: '1px solid #1a1a2e' }}
    >
      <div className="px-4 py-3 border-b border-dark-border flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: '#00e5ff', boxShadow: '0 0 6px #00e5ff', animation: 'pulse-glow 2s ease-in-out infinite' }}
        />
        <h3 className="text-sm font-semibold text-white">Activity Feed</h3>
        <span className="ml-auto text-xs font-jetbrains text-gray-600">{entries.length} entries</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: '320px' }}>
        {entries.length === 0 ? (
          <div className="text-center text-gray-600 text-sm py-8 font-jetbrains">No activity yet</div>
        ) : (
          entries.map((entry, i) => {
            const color = AGENT_COLORS[entry.agent] || '#888'
            return (
              <div
                key={i}
                className="flex gap-3 items-start p-2.5 rounded-lg animate-slide-in"
                style={{ background: '#111122', border: '1px solid #1a1a2e' }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-jetbrains font-bold flex-shrink-0 mt-0.5"
                  style={{ background: `${color}20`, border: `1px solid ${color}50`, color }}
                >
                  {entry.agent?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-jetbrains font-semibold" style={{ color }}>
                      {entry.agent}
                    </span>
                    <span className="text-xs font-jetbrains text-gray-600">
                      {timeAgo(entry.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{entry.action}</p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
