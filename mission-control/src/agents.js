// Shared agent configuration — single source of truth.
// Used by Sidebar, AgentCard, SignalBar, AgentRoom, and token panel.

export const AGENTS = [
  {
    id: 'atlas',
    name: 'Atlas',
    color: '#00e5ff',
    dimColor: '#00b4d8',
    initial: 'A',
    description:
      'Primary orchestration agent. Manages workflows, gateway routing, and system-wide coordination across all connected nodes.',
    status: 'online',
    route: '/agent/atlas',
    model: 'gpt-5.4',
    provider: 'OpenClaw',
    stats: [
      { label: 'Sessions', value: '3 active' },
      { label: 'Uptime', value: '99.8%' },
    ],
  },
  {
    id: 'claude',
    name: 'Claude',
    color: '#ff6b2b',
    dimColor: '#cc5520',
    initial: '✳', // ✳
    description:
      'Anthropic reasoning engine. Handles complex analysis, code generation, research tasks, and natural language understanding.',
    status: 'online',
    route: '/agent/claude',
    model: 'Sonnet 4.6',
    provider: 'Anthropic',
    stats: [
      { label: 'Model', value: 'Sonnet 4.6' },
      { label: 'Context', value: '200k tokens' },
    ],
  },
  {
    id: 'openclaw',
    name: 'OpenClaw',
    color: '#cc44ff',
    dimColor: '#9933cc',
    initial: '))',
    description:
      'Local gateway. Bridges agents to nodes, routes messages, injects auth, and exposes the unified API surface.',
    status: 'online',
    route: '/agent/openclaw',
    model: 'local',
    provider: 'Local Gateway',
    stats: [
      { label: 'Gateway', value: 'Port 18789' },
      { label: 'Mode', value: 'Bridge' },
    ],
  },
  {
    id: 'ollama',
    name: 'Ollama',
    color: '#00ff88',
    dimColor: '#00cc6a',
    initial: 'O',
    description:
      'Local inference engine. Runs open-source models on-device for low-latency, private, and offline-capable AI processing.',
    status: 'online',
    route: '/agent/ollama',
    model: 'qwen2.5:7b',
    provider: 'Local',
    stats: [
      { label: 'Model', value: 'qwen2.5:7b' },
      { label: 'Backend', value: 'CPU/Metal' },
    ],
  },
  {
    id: 'codex',
    name: 'Codex',
    color: '#7c4dff',
    dimColor: '#5e35d6',
    initial: 'X',
    description:
      'OpenAI Codex runtime. Code-first reasoning with tool use, multi-step execution, and deep software engineering capability.',
    status: 'online',
    route: '/agent/codex',
    model: 'gpt-5.5',
    provider: 'OpenAI',
    stats: [
      { label: 'Model', value: 'gpt-5.5' },
      { label: 'Runtime', value: 'Codex' },
    ],
  },
  {
    id: 'gemini',
    name: 'Gemini',
    color: '#ffd700',
    dimColor: '#ccac00',
    initial: 'G',
    description:
      'Google Gemini multimodal engine. Vision, audio, and text reasoning across long contexts with native Google tool access.',
    status: 'online',
    route: '/agent/gemini',
    model: 'Gemini 2.0',
    provider: 'Google',
    stats: [
      { label: 'Model', value: 'Gemini 2.0' },
      { label: 'Provider', value: 'Google' },
    ],
  },
]

export const AGENTS_BY_ID = AGENTS.reduce((acc, a) => {
  acc[a.id] = a
  return acc
}, {})

export const AGENTS_BY_NAME = AGENTS.reduce((acc, a) => {
  acc[a.name] = a
  return acc
}, {})

export function getAgent(idOrName) {
  return AGENTS_BY_ID[idOrName] || AGENTS_BY_NAME[idOrName] || null
}

// Status dot colors
export const STATUS_COLORS = {
  online: '#00ff88',
  live: '#00ff88',
  degraded: '#ffd700',
  offline: '#ff4444',
  unknown: '#666666',
}
