import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import SignalBar from '../components/SignalBar.jsx'
import AgentCard from '../components/AgentCard.jsx'
import ActivityFeed from '../components/ActivityFeed.jsx'
import SharedLog from '../components/SharedLog.jsx'
import TokenPanel from '../components/TokenPanel.jsx'
import SmartBitesPanel from '../components/SmartBitesPanel.jsx'
import FullscreenToggle from '../components/FullscreenToggle.jsx'
import { AGENTS } from '../agents.js'

function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="font-jetbrains text-gray-400 text-sm tabular-nums">
      {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  )
}

function SystemStatus({ gatewayStatus }) {
  const allOk = gatewayStatus?.status === 'online'
  return (
    <div
      className="flex items-center gap-2 text-xs font-jetbrains font-semibold px-3 py-1.5 rounded-full"
      style={{
        background: allOk ? '#39ff1415' : '#ff444415',
        border: `1px solid ${allOk ? '#39ff1450' : '#ff444450'}`,
        color: allOk ? '#39ff14' : '#ff4444',
      }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{
          background: allOk ? '#39ff14' : '#ff4444',
          boxShadow: allOk ? '0 0 6px #39ff14' : '0 0 6px #ff4444',
          animation: 'pulse-glow 2s ease-in-out infinite',
        }}
      />
      {allOk ? 'ALL SYSTEMS' : 'DEGRADED'}
    </div>
  )
}

export default function MissionControl({ gatewayStatus, tasks, activity, sharedLog, addLogMessage }) {
  return (
    <div className="flex min-h-screen" style={{ background: '#0a0a0f' }}>
      <Sidebar />

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #1a1a2e', background: '#080810' }}
        >
          <div className="flex items-center gap-3">
            <img src="/brand/sidebar-mark.svg" alt="P3 Solutions Group" width="30" height="36" className="flex-shrink-0" title="P3 Solutions Group" />
            <div>
              <div className="text-sm font-jetbrains font-semibold tracking-widest text-white uppercase leading-tight">
                P<span className="text-p3-bright">3</span> Mission Control
              </div>
              <div className="text-xs font-jetbrains text-gray-600 leading-tight">
                Local Studio · p3mc.ngrok.io
              </div>
            </div>
            <span className="text-gray-700">|</span>
            <LiveClock />
          </div>
          <div className="flex items-center gap-4">
            <FullscreenToggle />
            <SystemStatus gatewayStatus={gatewayStatus} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Signal Bar */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-jetbrains font-semibold tracking-widest text-gray-600 uppercase">
                Signal Status
              </span>
              <div className="flex-1 h-px" style={{ background: '#1a1a2e' }} />
            </div>
            <SignalBar gatewayStatus={gatewayStatus} />
          </section>

          {/* Agent Cards */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-jetbrains font-semibold tracking-widest text-gray-600 uppercase">
                Active Agents
              </span>
              <div className="flex-1 h-px" style={{ background: '#1a1a2e' }} />
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
              {AGENTS.map((a) => (
                <AgentCard key={a.id} name={a.name} status={a.id === 'atlas' ? 'live' : a.status} />
              ))}
            </div>
          </section>

          {/* Token Cost Tracking */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-jetbrains font-semibold tracking-widest text-gray-600 uppercase">
                Token Usage &amp; Cost
              </span>
              <div className="flex-1 h-px" style={{ background: '#1a1a2e' }} />
            </div>
            <TokenPanel />
          </section>

          {/* SmartBites */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-jetbrains font-semibold tracking-widest text-gray-600 uppercase">
                SmartBites
              </span>
              <div className="flex-1 h-px" style={{ background: '#1a1a2e' }} />
            </div>
            <SmartBitesPanel />
          </section>

          {/* Activity + Log */}
          <section>
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
          </section>
        </div>
      </main>
    </div>
  )
}
