import express from 'express';
import basicAuth from 'express-basic-auth';
import { readFileSync, writeFileSync, existsSync, mkdirSync, createWriteStream, createReadStream, readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { basename, dirname, join, resolve } from 'path';
import { homedir } from 'os';
import http from 'http';
import https from 'https';
import { exec, execFile } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3011;
const DATA_DIR = join(__dirname, 'data');
const DIST_DIR = join(__dirname, 'dist');
const STUDIO_IMG_DIR = join(DATA_DIR, 'studio');
if (!existsSync(STUDIO_IMG_DIR)) mkdirSync(STUDIO_IMG_DIR, { recursive: true });
const TTS_DIR = join(DATA_DIR, 'tts');
if (!existsSync(TTS_DIR)) mkdirSync(TTS_DIR, { recursive: true });

const GATEWAY_URL = 'http://127.0.0.1:18789';
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || process.env.GATEWAY_TOKEN || '';
const MISSION_CONTROL_USER = process.env.MISSION_CONTROL_USER || 'atlas-admin';
const MISSION_CONTROL_PASSWORD = process.env.MISSION_CONTROL_PASSWORD || 'change-me';
const OPENCLAW_HOME = join(homedir(), '.openclaw');
const WORKSPACE_DIR = join(OPENCLAW_HOME, 'workspace');
const MEMORY_DIR = join(WORKSPACE_DIR, 'memory');
const STANDARDS_DIR = join(WORKSPACE_DIR, 'standards');
const CRON_DIR = join(OPENCLAW_HOME, 'cron');
const VOICE_POC_BIN = join(OPENCLAW_HOME, 'labs', 'local-voice-poc', 'bin', 'voice-poc');

// Cost reference per 1k tokens by model
const MODEL_COST_PER_1K = {
  'gpt-5.4': 0.003,
  'gpt-5.5': 0.004,
  'Sonnet 4.6': 0.003,
  'qwen2.5:7b': 0.0,
  'Gemini 2.0': 0.002,
  'local': 0.0,
};
function costForTokens(model, tokens) {
  const rate = MODEL_COST_PER_1K[model] != null ? MODEL_COST_PER_1K[model] : 0;
  return (Number(tokens || 0) / 1000) * rate;
}

// Body parser
app.use(express.json());

// Basic auth for UI routes only
const auth = basicAuth({
  users: { [MISSION_CONTROL_USER]: MISSION_CONTROL_PASSWORD },
  challenge: true,
  realm: 'Mission Control',
});

// Helper: read JSON file safely
function readData(filename) {
  const filepath = join(DATA_DIR, filename);
  if (!existsSync(filepath)) return null;
  try {
    return JSON.parse(readFileSync(filepath, 'utf-8'));
  } catch {
    return null;
  }
}

// Helper: write JSON file
function writeData(filename, data) {
  const filepath = join(DATA_DIR, filename);
  writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
}

// Helper: generate simple ID
function genId() {
  return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function gatewayHeaders() {
  return GATEWAY_TOKEN ? { 'Authorization': `Bearer ${GATEWAY_TOKEN}` } : {};
}

function readTextSafe(filepath) {
  try {
    if (!existsSync(filepath)) return null;
    return readFileSync(filepath, 'utf-8');
  } catch {
    return null;
  }
}

function firstMarkdownParagraph(markdown) {
  const lines = String(markdown || '').split('\n');
  const body = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('---')) continue;
    if (trimmed.startsWith('- ') || trimmed.startsWith('```')) break;
    body.push(trimmed);
    if (body.join(' ').length > 160) break;
  }
  return body.join(' ').slice(0, 240);
}

function parseSkillFrontmatter(raw) {
  const skill = {};
  const match = String(raw || '').match(/^---\n([\s\S]*?)\n---/);
  if (!match) return skill;
  for (const line of match[1].split('\n')) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    skill[key] = value;
  }
  return skill;
}

function discoverSkillRoots() {
  const roots = [
    { dir: join(OPENCLAW_HOME, 'skills'), source: 'OpenClaw skills' },
    { dir: join(OPENCLAW_HOME, 'plugin-skills'), source: 'OpenClaw plugin skills' },
    { dir: join(OPENCLAW_HOME, 'agents', 'main', 'agent', 'codex-home', 'skills'), source: 'Codex skills' },
  ];

  const nvmRoot = join(homedir(), '.nvm', 'versions', 'node');
  try {
    for (const nodeVersion of readdirSync(nvmRoot)) {
      roots.push({
        dir: join(nvmRoot, nodeVersion, 'lib', 'node_modules', 'openclaw', 'skills'),
        source: 'OpenClaw bundled skills',
      });
    }
  } catch {}

  return roots.filter((r) => existsSync(r.dir));
}

function findSkillFiles(root, maxDepth = 4) {
  const files = [];
  function walk(dir, depth) {
    if (depth > maxDepth) return;
    let entries = [];
    try { entries = readdirSync(dir); } catch { return; }
    for (const entry of entries) {
      const fp = join(dir, entry);
      let st = null;
      try { st = statSync(fp); } catch { continue; }
      if (st.isDirectory()) walk(fp, depth + 1);
      else if (entry === 'SKILL.md') files.push({ filepath: fp, stat: st });
    }
  }
  walk(root, 0);
  return files;
}

// Helper: download a URL to a local file (built-in https)
function downloadToFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(destPath);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        return reject(new Error(`download failed: ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve()));
    }).on('error', (err) => {
      file.close();
      reject(err);
    });
  });
}

// API routes (no auth — agents can call these directly)

// Tasks
app.get('/api/tasks', (req, res) => {
  const data = readData('tasks.json');
  if (!data) return res.status(500).json({ error: 'Could not read tasks' });
  res.json(data);
});

app.post('/api/tasks', (req, res) => {
  const data = readData('tasks.json') || { tasks: [] };
  const task = {
    id: genId(),
    title: req.body.title || 'Untitled Task',
    description: req.body.description || '',
    status: req.body.status || 'todo',
    priority: req.body.priority || 'medium',
    agent: req.body.agent || 'Atlas',
    createdAt: new Date().toISOString(),
  };
  data.tasks.push(task);
  writeData('tasks.json', data);
  res.status(201).json(task);
});

app.put('/api/tasks/:id', (req, res) => {
  const data = readData('tasks.json') || { tasks: [] };
  const idx = data.tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });
  data.tasks[idx] = { ...data.tasks[idx], ...req.body, id: req.params.id };
  writeData('tasks.json', data);
  res.json(data.tasks[idx]);
});

app.delete('/api/tasks/:id', (req, res) => {
  const data = readData('tasks.json') || { tasks: [] };
  const before = data.tasks.length;
  data.tasks = data.tasks.filter(t => t.id !== req.params.id);
  if (data.tasks.length === before) return res.status(404).json({ error: 'Task not found' });
  writeData('tasks.json', data);
  res.json({ ok: true });
});

// Activity
app.get('/api/activity', (req, res) => {
  const data = readData('activity.json');
  if (!data) return res.status(500).json({ error: 'Could not read activity' });
  res.json(data);
});

app.post('/api/activity', (req, res) => {
  const data = readData('activity.json') || { entries: [] };
  const entry = {
    agent: req.body.agent || 'Atlas',
    action: req.body.action || '',
    timestamp: req.body.timestamp || new Date().toISOString(),
  };
  data.entries.unshift(entry);
  // Keep last 100 entries
  if (data.entries.length > 100) data.entries = data.entries.slice(0, 100);
  writeData('activity.json', data);
  res.status(201).json(entry);
});

// Shared log
app.get('/api/log', (req, res) => {
  const data = readData('shared-log.json');
  if (!data) return res.status(500).json({ error: 'Could not read log' });
  res.json(data);
});

app.post('/api/log', (req, res) => {
  const data = readData('shared-log.json') || { messages: [] };
  const message = {
    sender: req.body.sender || 'Atlas',
    text: req.body.text || '',
    timestamp: req.body.timestamp || new Date().toISOString(),
  };
  data.messages.push(message);
  // Keep last 200 messages
  if (data.messages.length > 200) data.messages = data.messages.slice(-200);
  writeData('shared-log.json', data);
  res.status(201).json(message);
});

// Studio: list images
app.get('/api/studio/images', (req, res) => {
  const data = readData('studio.json') || { images: [] };
  res.json(data);
});

// Studio: generate image via OpenAI
app.post('/api/studio/generate', async (req, res) => {
  const { prompt, model = 'dall-e-3', size = '1024×1024' } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'OPENAI_API_KEY not set on this host' });
  }

  // Map display size to API size
  const sizeMap = { '1024×1024': '1024x1024', '1792×1024': '1792x1024', '1024×1792': '1024x1792' };
  const apiSize = sizeMap[size] || '1024x1024';

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: model === 'dall-e-2' ? 'dall-e-2' : 'dall-e-3', prompt, n: 1, size: apiSize }),
    });
    const openaiData = await openaiRes.json();
    if (!openaiRes.ok) return res.status(502).json({ error: openaiData.error?.message || 'OpenAI error' });

    const url = openaiData.data?.[0]?.url;
    const id = genId();
    const image = { id, prompt, model, size, url: url || null, localUrl: null, createdAt: new Date().toISOString() };

    // Download a local copy so it persists past OpenAI's URL expiry.
    if (url) {
      try {
        const filename = `${id}.png`;
        await downloadToFile(url, join(STUDIO_IMG_DIR, filename));
        image.localUrl = `/studio-images/${filename}`;
      } catch (e) {
        // non-fatal — keep the OpenAI url
      }
    }

    const data = readData('studio.json') || { images: [] };
    data.images.unshift(image);
    if (data.images.length > 100) data.images = data.images.slice(0, 100);
    writeData('studio.json', data);

    res.status(201).json({ image });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Studio: delete image
app.delete('/api/studio/images/:id', (req, res) => {
  const data = readData('studio.json') || { images: [] };
  data.images = data.images.filter(img => img.id !== req.params.id);
  writeData('studio.json', data);
  res.json({ ok: true });
});

// Agent message → run the live Atlas/OpenClaw agent via the `openclaw agent` CLI.
// Same codepath/auth/config as the gateway, no operator HTTP surface needed.
app.post('/api/agent/message', (req, res) => {
  const message = req.body?.message || '';
  if (!message.trim()) return res.status(400).json({ error: 'message is required' });

  // Stable per-surface session key so the voice interface keeps context.
  const tag = (req.body?.session || 'voice').replace(/[^a-z0-9-]/gi, '');
  const sessionKey = `agent:main:p3mc-${tag}`;

  const args = [
    'agent',
    '--session-key', sessionKey,
    '--message', message,
    '--json',
    '--timeout', '120',
  ];

  const fallback = (note) =>
    res.json({ reply: 'Agent unreachable — running in local echo mode.', source: 'fallback', note });

  execFile('openclaw', args, { timeout: 130000, maxBuffer: 1024 * 1024 * 8 }, (err, stdout) => {
    if (err && !stdout) return fallback(err.message);
    // Extract the last JSON object from stdout, then payloads[].text.
    let reply = null;
    try {
      const start = stdout.indexOf('{');
      const parsed = start >= 0 ? JSON.parse(stdout.slice(start)) : null;
      const payloads = parsed?.payloads || parsed?.result?.payloads || [];
      for (const p of payloads) {
        if (p && typeof p.text === 'string' && p.text.trim()) reply = p.text.trim();
      }
      if (!reply) {
        const meta = parsed?.meta || parsed?.result?.meta || parsed || {};
        reply = meta.finalAssistantVisibleText || meta.finalAssistantRawText || null;
      }
    } catch {
      // fall through to fallback
    }
    if (reply) return res.json({ reply, source: 'agent' });
    return fallback('no text in agent output');
  });
});

// Local Atlas voice TTS: synthesize with Kokoro bm_daniel and stream WAV to browser.
app.post('/api/voice/tts', (req, res) => {
  const text = String(req.body?.text || '').trim();
  const voice = String(req.body?.voice || 'bm_daniel').replace(/[^a-z0-9_:-]/gi, '') || 'bm_daniel';
  if (!text) return res.status(400).json({ error: 'text is required' });
  if (text.length > 3000) return res.status(400).json({ error: 'text is too long for local TTS' });
  if (!existsSync(VOICE_POC_BIN)) {
    return res.status(503).json({ error: 'local voice engine not installed' });
  }

  const id = genId();
  const output = join(TTS_DIR, `${id}.wav`);
  execFile(
    VOICE_POC_BIN,
    ['tts', '--text', text, '--output', output, '--voice', voice],
    {
      timeout: 90000,
      maxBuffer: 1024 * 1024 * 2,
      env: {
        ...process.env,
        KOKORO_MLX_MODEL: join(OPENCLAW_HOME, 'labs', 'local-voice-poc', 'models', 'kokoro-82m-bf16'),
      },
    },
    (err) => {
      if (err || !existsSync(output)) {
        return res.status(502).json({ error: err?.message || 'local TTS failed' });
      }
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Cache-Control', 'no-store');
      createReadStream(output).pipe(res);
    }
  );
});

// Token usage tracking
// Defensively probe a gateway response for per-agent token counts.
// Returns an array of { agent, model, tokens, cost } or null if nothing usable.
function deriveUsageFromGateway(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;
  // Probe common shapes: parsed.usage, parsed.tokens, parsed.agents, parsed.sessions
  const candidates = [parsed.usage, parsed.tokens, parsed.agents, parsed.sessions];
  for (const c of candidates) {
    if (Array.isArray(c) && c.length) {
      const rows = c
        .map((item) => {
          if (!item || typeof item !== 'object') return null;
          const agent = item.agent || item.name || item.id;
          const tokens =
            item.tokens != null ? item.tokens
              : item.totalTokens != null ? item.totalTokens
              : item.token_count != null ? item.token_count
              : (Number(item.promptTokens || item.inputTokens || 0) + Number(item.completionTokens || item.outputTokens || 0)) || null;
          if (!agent || tokens == null) return null;
          const model = item.model || '';
          return { agent, model, tokens: Number(tokens) || 0, cost: costForTokens(model, tokens) };
        })
        .filter(Boolean);
      if (rows.length) return rows;
    }
  }
  // Map shape: { agentName: { tokens, model } }
  if (parsed.byAgent && typeof parsed.byAgent === 'object') {
    const rows = Object.entries(parsed.byAgent)
      .map(([agent, v]) => {
        const tokens = v && (v.tokens ?? v.totalTokens);
        if (tokens == null) return null;
        const model = (v && v.model) || '';
        return { agent, model, tokens: Number(tokens) || 0, cost: costForTokens(model, tokens) };
      })
      .filter(Boolean);
    if (rows.length) return rows;
  }
  return null;
}

app.get('/api/tokens', (req, res) => {
  // Try gateway /status for live data, fall back to JSON file.
  const options = {
    hostname: '127.0.0.1',
    port: 18789,
    path: '/status',
    method: 'GET',
    headers: gatewayHeaders(),
    timeout: 3000,
  };
  const sendFile = () => {
    const data = readData('token-usage.json') || { usage: [] };
    res.json({ ...data, source: 'cached' });
  };
  const proxyReq = http.request(options, (proxyRes) => {
    let body = '';
    proxyRes.on('data', (c) => { body += c; });
    proxyRes.on('end', () => {
      if (proxyRes.statusCode !== 200) return sendFile();
      try {
        const parsed = JSON.parse(body);
        const usage = deriveUsageFromGateway(parsed);
        if (usage && usage.length) {
          return res.json({ usage, updatedAt: new Date().toISOString(), source: 'live' });
        }
        sendFile();
      } catch { sendFile(); }
    });
  });
  proxyReq.on('error', sendFile);
  proxyReq.on('timeout', () => { proxyReq.destroy(); sendFile(); });
  proxyReq.end();
});

app.post('/api/tokens', (req, res) => {
  const incoming = req.body || {};
  const data = readData('token-usage.json') || { usage: [] };
  if (Array.isArray(incoming.usage)) {
    data.usage = incoming.usage;
  } else if (incoming.agent) {
    // Upsert a single agent row
    const idx = data.usage.findIndex((u) => u.agent === incoming.agent);
    const row = {
      agent: incoming.agent,
      model: incoming.model || (idx >= 0 ? data.usage[idx].model : ''),
      tokens: incoming.tokens != null ? incoming.tokens : (idx >= 0 ? data.usage[idx].tokens : 0),
      cost: incoming.cost != null ? incoming.cost : (idx >= 0 ? data.usage[idx].cost : 0),
    };
    if (idx >= 0) data.usage[idx] = row;
    else data.usage.push(row);
  }
  data.updatedAt = new Date().toISOString();
  writeData('token-usage.json', data);
  res.json(data);
});

// Ollama models — try local API, fall back to `ollama list`
app.get('/api/ollama/models', (req, res) => {
  const tagsReq = http.request(
    { hostname: '127.0.0.1', port: 11434, path: '/api/tags', method: 'GET', timeout: 2500 },
    (tagsRes) => {
      let body = '';
      tagsRes.on('data', (c) => { body += c; });
      tagsRes.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          const models = (parsed.models || []).map((m) => ({ name: m.name, size: m.size, loaded: false }));
          return res.json({ models, source: 'api' });
        } catch {
          return tryCli();
        }
      });
    }
  );
  tagsReq.on('error', tryCli);
  tagsReq.on('timeout', () => { tagsReq.destroy(); tryCli(); });
  tagsReq.end();

  function tryCli() {
    exec('ollama list', { timeout: 4000 }, (err, stdout) => {
      if (err) return res.json({ error: 'Ollama not running', models: [] });
      const lines = stdout.trim().split('\n').slice(1); // skip header
      const models = lines
        .filter((l) => l.trim())
        .map((l) => {
          const parts = l.split(/\s{2,}/);
          return { name: parts[0], size: null, loaded: false };
        });
      res.json({ models, source: 'cli' });
    });
  }
});

// Gateway health proxy
app.get('/api/gateway/health', (req, res) => {
  const options = {
    hostname: '127.0.0.1',
    port: 18789,
    path: '/health',
    method: 'GET',
    headers: {
      ...gatewayHeaders(),
    },
    timeout: 3000,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    let body = '';
    proxyRes.on('data', chunk => { body += chunk; });
    proxyRes.on('end', () => {
      res.status(proxyRes.statusCode).json({
        status: proxyRes.statusCode === 200 ? 'online' : 'degraded',
        statusCode: proxyRes.statusCode,
        body: body,
        timestamp: new Date().toISOString(),
      });
    });
  });

  proxyReq.on('error', (err) => {
    res.json({
      status: 'offline',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  });

  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    res.json({
      status: 'offline',
      error: 'timeout',
      timestamp: new Date().toISOString(),
    });
  });

  proxyReq.end();
});

// --- Generic gateway GET proxy with graceful fallback ---
function gatewayGet(path, timeout, onJson, onFail) {
  const options = {
    hostname: '127.0.0.1',
    port: 18789,
    path,
    method: 'GET',
    headers: gatewayHeaders(),
    timeout: timeout || 3000,
  };
  const proxyReq = http.request(options, (proxyRes) => {
    let body = '';
    proxyRes.on('data', (c) => { body += c; });
    proxyRes.on('end', () => {
      if (proxyRes.statusCode !== 200) return onFail('status ' + proxyRes.statusCode);
      try { onJson(JSON.parse(body)); }
      catch { onFail('parse error'); }
    });
  });
  proxyReq.on('error', (e) => onFail(e.message));
  proxyReq.on('timeout', () => { proxyReq.destroy(); onFail('timeout'); });
  proxyReq.end();
}

// --- Atlas sessions (proxy gateway /sessions, fallback empty) ---
app.get('/api/atlas/sessions', (req, res) => {
  gatewayGet('/sessions', 3000,
    (parsed) => {
      const sessions = Array.isArray(parsed) ? parsed
        : Array.isArray(parsed.sessions) ? parsed.sessions
        : Array.isArray(parsed.data) ? parsed.data : [];
      res.json({ sessions, source: 'gateway' });
    },
    () => res.json({ sessions: [], source: 'offline', note: 'Gateway sessions unavailable.' })
  );
});

// --- Memory: read workspace memory/*.md ---
app.get('/api/memory', (req, res) => {
  try {
    if (!existsSync(MEMORY_DIR)) return res.json({ files: [], note: 'No memory directory found.' });
    const names = readdirSync(MEMORY_DIR).filter((f) => f.endsWith('.md'));
    const files = names
      .map((name) => {
        try {
          const fp = join(MEMORY_DIR, name);
          const st = statSync(fp);
          if (!st.isFile()) return null;
          const raw = readFileSync(fp, 'utf-8');
          return {
            name,
            mtime: st.mtime.toISOString(),
            preview: raw.replace(/\s+/g, ' ').trim().slice(0, 200),
            source: 'workspace/memory',
          };
        } catch { return null; }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.mtime) - new Date(a.mtime))
      .slice(0, 50);
    res.json({ files });
  } catch (e) {
    res.json({ files: [], note: 'Could not read memory: ' + e.message });
  }
});

// --- Standards: read workspace standards/*.md ---
app.get('/api/standards', (req, res) => {
  try {
    const index = readData('standards-index.json') || { standards: [] };
    const standards = (index.standards || []).map((item) => {
      const filename = basename(item.file || `${item.id}.md`);
      const fp = join(STANDARDS_DIR, filename);
      let mtime = null;
      try { mtime = statSync(fp).mtime.toISOString(); } catch {}
      return { ...item, file: filename, updatedAt: mtime };
    });
    res.json({ standards });
  } catch (e) {
    res.json({ standards: [], note: 'Could not read standards: ' + e.message });
  }
});

app.get('/api/standards/:id', (req, res) => {
  try {
    const index = readData('standards-index.json') || { standards: [] };
    const item = (index.standards || []).find((s) => s.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'standard not found' });
    const filename = basename(item.file || `${item.id}.md`);
    const fp = resolve(STANDARDS_DIR, filename);
    if (!fp.startsWith(resolve(STANDARDS_DIR))) return res.status(400).json({ error: 'invalid standard path' });
    const markdown = readTextSafe(fp);
    if (markdown == null) return res.status(404).json({ error: 'standard file not found' });
    const st = statSync(fp);
    res.json({ standard: { ...item, file: filename, updatedAt: st.mtime.toISOString(), markdown } });
  } catch (e) {
    res.status(500).json({ error: 'Could not read standard: ' + e.message });
  }
});

// --- Skills: read local skill files and overlay registry status metadata ---
app.get('/api/skills', (req, res) => {
  try {
    const index = readData('skills-index.json') || { skills: {} };
    const byName = new Map();

    for (const root of discoverSkillRoots()) {
      for (const item of findSkillFiles(root.dir)) {
        const raw = readTextSafe(item.filepath) || '';
        const meta = parseSkillFrontmatter(raw);
        const folderName = basename(dirname(item.filepath));
        const name = meta.name || folderName;
        const overlay = index.skills?.[name] || {};
        const existing = byName.get(name);
        const row = {
          name,
          description: meta.description || firstMarkdownParagraph(raw) || 'No description found.',
          status: overlay.status || 'active',
          version: meta.version || overlay.version || null,
          source: root.source,
          path: item.filepath.replace(homedir(), '~'),
          lastUsed: overlay.lastUsed || null,
          updatedAt: item.stat.mtime.toISOString(),
        };

        if (!existing || row.source.includes('OpenClaw')) byName.set(name, row);
      }
    }

    const skills = Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
    const summary = skills.reduce((acc, skill) => {
      acc.total += 1;
      if (skill.status === 'active') acc.active += 1;
      else if (skill.status === 'pending') acc.pending += 1;
      else if (skill.status === 'quarantined') acc.quarantined += 1;
      return acc;
    }, { total: 0, active: 0, pending: 0, quarantined: 0 });

    res.json({ skills, summary });
  } catch (e) {
    res.json({
      skills: [],
      summary: { total: 0, active: 0, pending: 0, quarantined: 0 },
      note: 'Could not read skills: ' + e.message,
    });
  }
});

// --- Cron: read ~/.openclaw/cron/ jobs if present ---
app.get('/api/cron', (req, res) => {
  try {
    if (!existsSync(CRON_DIR)) return res.json({ jobs: [], note: 'No cron directory found.' });
    // Prefer a live jobs file, then migrated/bak variants
    const candidates = ['jobs.json', 'jobs.json.migrated', 'jobs.json.bak'];
    let jobsRaw = null;
    for (const c of candidates) {
      const fp = join(CRON_DIR, c);
      if (existsSync(fp)) {
        try { jobsRaw = JSON.parse(readFileSync(fp, 'utf-8')); break; } catch {}
      }
    }
    if (!jobsRaw) return res.json({ jobs: [], note: 'No parseable cron jobs file.' });

    // Read run state for next-run info if available
    let state = {};
    const stateCandidates = ['jobs-state.json', 'jobs-state.json.migrated'];
    for (const c of stateCandidates) {
      const fp = join(CRON_DIR, c);
      if (existsSync(fp)) {
        try { const s = JSON.parse(readFileSync(fp, 'utf-8')); state = s.jobs || {}; break; } catch {}
      }
    }

    const list = Array.isArray(jobsRaw.jobs) ? jobsRaw.jobs : [];
    const jobs = list.map((j) => {
      const st = state[j.id]?.state || {};
      return {
        id: j.id,
        name: j.name || 'Unnamed job',
        enabled: j.enabled !== false,
        schedule: j.schedule?.expr || j.schedule?.kind || '—',
        tz: j.schedule?.tz || '',
        channel: j.delivery?.channel || '',
        nextRun: st.nextRunAtMs ? new Date(st.nextRunAtMs).toISOString() : null,
        lastRun: st.lastRunAtMs ? new Date(st.lastRunAtMs).toISOString() : null,
        lastStatus: st.lastStatus || st.lastRunStatus || null,
      };
    });
    res.json({ jobs });
  } catch (e) {
    res.json({ jobs: [], note: 'Could not read cron: ' + e.message });
  }
});

// --- Ollama ps (loaded-in-memory models) ---
app.get('/api/ollama/ps', (req, res) => {
  const psReq = http.request(
    { hostname: '127.0.0.1', port: 11434, path: '/api/ps', method: 'GET', timeout: 2500 },
    (psRes) => {
      let body = '';
      psRes.on('data', (c) => { body += c; });
      psRes.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          const models = (parsed.models || []).map((m) => ({
            name: m.name,
            size: m.size,
            sizeVram: m.size_vram,
            expiresAt: m.expires_at || null,
          }));
          res.json({ models, source: 'api' });
        } catch {
          res.json({ models: [], source: 'offline', note: 'Ollama /api/ps unavailable.' });
        }
      });
    }
  );
  psReq.on('error', () => res.json({ models: [], source: 'offline', note: 'Ollama not reachable.' }));
  psReq.on('timeout', () => { psReq.destroy(); res.json({ models: [], source: 'offline', note: 'Ollama timeout.' }); });
  psReq.end();
});

// --- SmartBites health check (server-proxied to avoid CORS) ---
const SMARTBITES_TARGETS = {
  supabase: 'https://supabase-api.ngrok.io/health',
  mobile: 'https://dev.smartbites.food',
  portal: 'https://allergyawaremenu.ngrok.io',
};
app.get('/api/smartbites/health', (req, res) => {
  const target = req.query.target;
  const url = SMARTBITES_TARGETS[target];
  if (!url) return res.status(400).json({ status: 'offline', error: 'unknown target' });
  let done = false;
  const finish = (status, extra) => { if (done) return; done = true; res.json({ target, status, ...extra }); };
  try {
    const u = new URL(url);
    const mod = u.protocol === 'https:' ? https : http;
    const reqObj = mod.request(
      { hostname: u.hostname, port: u.port || (u.protocol === 'https:' ? 443 : 80), path: u.pathname || '/', method: 'GET', timeout: 3000,
        headers: { 'ngrok-skip-browser-warning': 'true' } },
      (r) => {
        r.resume();
        finish(r.statusCode >= 200 && r.statusCode < 500 ? 'online' : 'offline', { code: r.statusCode });
      }
    );
    reqObj.on('error', () => finish('offline'));
    reqObj.on('timeout', () => { reqObj.destroy(); finish('offline'); });
    reqObj.end();
  } catch {
    finish('offline');
  }
});

// --- SmartBites stats ---
app.get('/api/smartbites', (req, res) => {
  const data = readData('smartbites.json') || { betaUsers: 0, restaurantsOnboarded: 0, menuItemsIndexed: 0, lastSync: null };
  res.json(data);
});
app.post('/api/smartbites', (req, res) => {
  const cur = readData('smartbites.json') || {};
  const data = { ...cur, ...req.body };
  writeData('smartbites.json', data);
  res.json(data);
});

// --- Goals ---
app.get('/api/goals', (req, res) => {
  const data = readData('goals.json') || { goals: [] };
  res.json(data);
});
app.post('/api/goals', (req, res) => {
  const data = readData('goals.json') || { goals: [] };
  if (req.body.id) {
    // toggle / update existing
    const idx = data.goals.findIndex((g) => g.id === req.body.id);
    if (idx >= 0) data.goals[idx] = { ...data.goals[idx], ...req.body };
  } else {
    data.goals.push({
      id: genId(),
      text: req.body.text || 'Untitled goal',
      done: !!req.body.done,
      createdAt: new Date().toISOString(),
    });
  }
  writeData('goals.json', data);
  res.json(data);
});
app.put('/api/goals/:id', (req, res) => {
  const data = readData('goals.json') || { goals: [] };
  const idx = data.goals.findIndex((g) => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  data.goals[idx] = { ...data.goals[idx], ...req.body, id: req.params.id };
  writeData('goals.json', data);
  res.json(data.goals[idx]);
});

// --- Journal ---
app.get('/api/journal', (req, res) => {
  const data = readData('journal.json') || { entries: [] };
  res.json(data);
});

// --- Settings ---
app.get('/api/settings', (req, res) => {
  const data = readData('settings.json') || {
    gatewayUrl: 'http://127.0.0.1:18789',
    ngrokUrl: 'https://p3mc.ngrok.io',
    tokenRefreshInterval: 30,
    wakeWordEnabled: false,
    voice: '',
    theme: 'dark',
  };
  res.json(data);
});
app.post('/api/settings', (req, res) => {
  const cur = readData('settings.json') || {};
  const data = { ...cur, ...req.body };
  writeData('settings.json', data);
  res.json(data);
});

// --- Local Voice Engine (Kokoro/Whisper wake loop) control ---
const VOICE_BG = join(OPENCLAW_HOME, 'labs', 'local-voice-poc', 'bin', 'voice-poc-bg');
const VOICE_LOG = join(OPENCLAW_HOME, 'labs', 'local-voice-poc', 'logs', 'voice-poc-bg.out.log');
const VOICE_CONFIG_DEFAULT = { backend: 'ollama', model: 'llama3.2:latest', wakeWord: 'Atlas', device: ':0', voice: 'bm_daniel' };

function runVoiceBg(action, env, cb) {
  if (!existsSync(VOICE_BG)) return cb(new Error('voice-poc-bg not found on this host'), null);
  exec(`"${VOICE_BG}" ${action}`, { env: { ...process.env, ...env }, timeout: 15000 }, (err, stdout, stderr) => {
    cb(err, (stdout || '') + (stderr || ''));
  });
}

function envFromConfig(c) {
  return {
    VOICE_BACKEND: c.backend, VOICE_MODEL: c.model, VOICE_WAKE_WORD: c.wakeWord,
    VOICE_INPUT_DEVICE: c.device, VOICE_TTS: c.voice,
  };
}

app.get('/api/voice/status', (req, res) => {
  const cfg = readData('voice.json') || VOICE_CONFIG_DEFAULT;
  runVoiceBg('status', {}, (err, out) => {
    if (err) return res.json({ running: false, available: false, config: cfg, note: err.message });
    const running = /running pid=/.test(out || '');
    const pidMatch = (out || '').match(/pid=(\d+)/);
    res.json({ running, available: true, pid: pidMatch ? Number(pidMatch[1]) : null, config: cfg, raw: (out || '').trim() });
  });
});

app.post('/api/voice/start', (req, res) => {
  const cfg = { ...VOICE_CONFIG_DEFAULT, ...(readData('voice.json') || {}), ...(req.body || {}) };
  writeData('voice.json', cfg);
  runVoiceBg('start', envFromConfig(cfg), (err, out) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    res.json({ ok: true, config: cfg, raw: (out || '').trim() });
  });
});

app.post('/api/voice/stop', (req, res) => {
  runVoiceBg('stop', {}, (err, out) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    res.json({ ok: true, raw: (out || '').trim() });
  });
});

app.post('/api/voice/restart', (req, res) => {
  const cfg = { ...VOICE_CONFIG_DEFAULT, ...(readData('voice.json') || {}), ...(req.body || {}) };
  writeData('voice.json', cfg);
  runVoiceBg('restart', envFromConfig(cfg), (err, out) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    res.json({ ok: true, config: cfg, raw: (out || '').trim() });
  });
});

app.get('/api/voice/logs', (req, res) => {
  if (!existsSync(VOICE_LOG)) return res.json({ lines: [], note: 'No log file yet.' });
  try {
    const text = readFileSync(VOICE_LOG, 'utf-8');
    const lines = text.split('\n').filter(Boolean).slice(-120);
    res.json({ lines });
  } catch (e) {
    res.json({ lines: [], note: e.message });
  }
});

// Serve saved studio images (no auth — referenced by <img> tags)
app.use('/studio-images', express.static(STUDIO_IMG_DIR));

// Serve built frontend with auth.
// Hashed assets (index-*.js/css) are immutable & safe to cache long-term;
// index.html must NOT be cached so new builds are picked up without a hard refresh.
app.use(auth);
app.use(express.static(DIST_DIR, {
  setHeaders: (res, path) => {
    if (path.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  },
}));
app.get('*', auth, (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(join(DIST_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Mission Control running at http://localhost:${PORT}`);
  console.log(`Auth user: ${MISSION_CONTROL_USER}`);
  if (!process.env.MISSION_CONTROL_PASSWORD) {
    console.warn('MISSION_CONTROL_PASSWORD is not set; using local placeholder auth.');
  }
  if (!GATEWAY_TOKEN) {
    console.warn('OPENCLAW_GATEWAY_TOKEN is not set; gateway calls may degrade.');
  }
});
