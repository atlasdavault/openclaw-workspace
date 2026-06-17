import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { AGENTS, STATUS_COLORS } from '../agents.js'

const navItems = [
  {
    path: '/',
    label: 'Mission Control',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polygon points="10,8 16,12 10,16 10,8"/>
      </svg>
    ),
  },
  {
    path: '/jarvis',
    label: 'Atlas · Neural Interface',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    ),
  },
  {
    path: '/tasks',
    label: 'Tasks',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/>
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ),
  },
  {
    path: '/studio',
    label: 'Studio',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21,15 16,10 5,21"/>
      </svg>
    ),
  },
]

const systemItems = [
  { label: 'Goals', icon: '◎', path: '/goals' },
  { label: 'Memory', icon: '▦', path: '/memory' },
  { label: 'Journal', icon: '✎', path: '/journal' },
  { label: 'Standards', icon: '§', path: '/standards' },
  { label: 'Skills', icon: '◇', path: '/skills' },
  { label: 'Settings', icon: '⚙', path: '/settings' },
]

function SectionHeader({ children }) {
  return (
    <div className="px-3 pt-5 pb-2 text-xs font-jetbrains font-semibold tracking-widest text-gray-700 uppercase">
      {children}
    </div>
  )
}

function AgentRow({ agent }) {
  const navigate = useNavigate()
  const [hover, setHover] = useState(false)
  const statusColor = STATUS_COLORS[agent.status] || STATUS_COLORS.unknown

  return (
    <button
      onClick={() => navigate(agent.route)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200"
      style={{
        background: hover ? `${agent.color}12` : 'transparent',
        boxShadow: hover ? `0 0 14px ${agent.color}50` : 'none',
      }}
    >
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-jetbrains flex-shrink-0"
        style={{
          background: `${agent.color}20`,
          border: `1px solid ${agent.color}60`,
          color: agent.color,
        }}
      >
        {agent.initial}
      </span>
      <span
        className="flex-1 text-left text-sm font-medium transition-colors"
        style={{ color: hover ? agent.color : '#cbd5e1' }}
      >
        {agent.name}
      </span>
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }}
        title={agent.status}
      />
    </button>
  )
}

export default function Sidebar() {
  return (
    <aside
      style={{ background: '#080810', borderRight: '1px solid #1a1a2e' }}
      className="w-56 min-h-screen flex flex-col flex-shrink-0"
    >
      {/* Logo — P3 branding */}
      <div className="px-5 py-6 border-b border-dark-border">
        <div className="flex items-center gap-2.5">
          <img src="/brand/sidebar-mark.svg" alt="P3 Solutions Group" width="32" height="38" className="flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-jetbrains font-semibold tracking-widest text-white uppercase truncate">
              P<span className="text-p3-bright">3</span> Mission Control
            </div>
            <div className="text-xs text-gray-600 font-jetbrains truncate">Local Studio · p3mc.ngrok.io</div>
          </div>
        </div>
      </div>

      {/* Scrollable nav */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? 'text-p3-bright bg-p3/10 border border-p3/30'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span style={{ color: isActive ? '#EE2222' : undefined }}>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* AGENTS section */}
        <SectionHeader>Agents</SectionHeader>
        <div className="space-y-0.5">
          {AGENTS.map((agent) => (
            <AgentRow key={agent.id} agent={agent} />
          ))}
        </div>

        {/* SYSTEM section */}
        <SectionHeader>System</SectionHeader>
        <div className="space-y-0.5">
          {systemItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? 'text-p3-bright bg-p3/10 border border-p3/30'
                    : 'text-gray-600 hover:text-gray-400 hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="w-[18px] text-center" style={{ color: isActive ? '#EE2222' : '#3f3f46' }}>{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-dark-border flex-shrink-0">
        <div className="text-xs font-jetbrains text-gray-600">v2.0.0 · Phase 4</div>
        <div className="text-xs font-jetbrains text-gray-700 mt-0.5">port 3011</div>
      </div>
    </aside>
  )
}
