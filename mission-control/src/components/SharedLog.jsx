import { useState } from 'react'

const AGENT_COLORS = {
  Atlas: '#00e5ff',
  Claude: '#ff6b35',
  Ollama: '#39ff14',
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export default function SharedLog({ messages = [], onSend }) {
  const [input, setInput] = useState('')
  const [sender, setSender] = useState('Atlas')

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return
    await onSend?.({ sender, text })
    setInput('')
  }

  return (
    <div
      className="rounded-xl flex flex-col h-full"
      style={{ background: '#0d0d1a', border: '1px solid #1a1a2e' }}
    >
      <div className="px-4 py-3 border-b border-dark-border flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        <h3 className="text-sm font-semibold text-white">Shared Log</h3>
        <span className="ml-auto text-xs font-jetbrains text-gray-600">{messages.length} msgs</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: '260px' }}>
        {messages.length === 0 ? (
          <div className="text-center text-gray-600 text-sm py-8 font-jetbrains">No messages yet</div>
        ) : (
          [...messages].reverse().map((msg, i) => {
            const color = AGENT_COLORS[msg.sender] || '#888'
            return (
              <div key={i} className="text-xs">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-jetbrains font-semibold" style={{ color }}>
                    [{msg.sender}]
                  </span>
                  <span className="font-jetbrains text-gray-600">{formatTime(msg.timestamp)}</span>
                </div>
                <p className="text-gray-400 leading-relaxed pl-0.5">{msg.text}</p>
              </div>
            )
          })
        )}
      </div>

      {/* Input */}
      {onSend && (
        <div className="px-3 pb-3 pt-2 border-t border-dark-border">
          <div className="flex gap-2 items-center">
            <select
              value={sender}
              onChange={e => setSender(e.target.value)}
              className="text-xs font-jetbrains rounded px-2 py-1.5 outline-none"
              style={{ background: '#111122', border: '1px solid #1a1a2e', color: AGENT_COLORS[sender] || '#888' }}
            >
              <option value="Atlas">Atlas</option>
              <option value="Claude">Claude</option>
              <option value="Ollama">Ollama</option>
            </select>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Send a message..."
              className="flex-1 text-xs font-jetbrains rounded px-3 py-1.5 outline-none text-gray-300 placeholder-gray-700"
              style={{ background: '#111122', border: '1px solid #1a1a2e' }}
            />
            <button
              onClick={handleSend}
              className="text-xs font-jetbrains font-semibold px-3 py-1.5 rounded transition-all hover:opacity-80"
              style={{ background: '#00e5ff20', border: '1px solid #00e5ff40', color: '#00e5ff' }}
            >
              SEND
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
