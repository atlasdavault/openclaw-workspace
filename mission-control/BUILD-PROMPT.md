# P3 Mission Control — Master Build Specification
## v1.2.1 · Atlas — As-Shipped Reference (Phases 1 + 2 + 3 + Voice)

> This is the authoritative spec for what actually ships in
> `~/.openclaw/workspace/mission-control/`. It supersedes the earlier
> phase prompts. Where the original prompt drifted from reality, this
> document is corrected and annotated.

---

## Overview

P3 Mission Control is the command center for the P3 Solutions Group AI agent
stack — Atlas, Claude, OpenClaw, Ollama, Codex, and Gemini. It runs locally on
a Mac Mini and is published over ngrok.

- **Public URL:** `https://p3mc.ngrok.io`
- **Local URL:** `http://localhost:3011`
- **Auth:** Basic auth from `MISSION_CONTROL_USER` / `MISSION_CONTROL_PASSWORD`
- **Version:** `v1.2.1 · Atlas`

---

## Tech Stack (as built)

- **Frontend:** React + Vite + Tailwind CSS, React Router v6
- **Backend:** Node + **Express** (`server.js`) with `express-basic-auth`
  — serves the built SPA from `dist/` and exposes the `/api/*` surface.
  (Correction: this is NOT a frontend-only app; there is a real server.)
- **Animations:** CSS keyframes + SVG (orb, waveforms)
- **Voice (browser):** Web Speech API — `SpeechRecognition` + `speechSynthesis`
- **Voice (local engine):** whisper.cpp (STT) + Kokoro-MLX (TTS), driven by the
  lab at `~/.openclaw/labs/local-voice-poc/`
- **Agent calls:** the `openclaw agent` CLI (no operator HTTP surface opened)
- **Polling intervals:** 4s signal bar · 30s tokens/SmartBites · 60s Ollama · 5s voice engine
- **Persistence:** JSON files under `./data/`

---

## Design System

- Background: near-black `#0a0a0f` (voice page `#060609`)
- **P3 brand:** red `#CC0000` / bright `#EE2222` — owns the system chrome
  (logo marks, sidebar nav active state). The wordmark renders white **P**,
  red **3**: `P<span class="text-p3-bright">3</span> Mission Control`.
- **Agent accent colors** (the neon identity layer):
  - Atlas → cyan `#00e5ff`
  - Claude → orange `#ff6b2b`
  - OpenClaw → purple `#cc44ff`
  - Ollama → green `#00ff88`
  - Codex → dark purple `#7c4dff`
  - Gemini → gold `#ffd700`
- Agent cards: faint agent-color border + `box-shadow` glow, intensifies on hover
- Typography: JetBrains Mono for status labels; sans-serif headings
- Top-right "ALL SYSTEMS" pill: green healthy / red degraded
- Single source of truth for agents: `src/agents.js`

---

## Branding Assets (`public/brand/`)

- `favicon.svg` — 32×32 red triangle + P3 (wired as `<link rel="icon">`)
- `sidebar-mark.svg` — sidebar + header triangle mark
- `header-mark.svg` — full horizontal lockup
- `splash.svg` — 400×440 splash logo (staged; not yet mounted as a boot screen)
- Tagline: *Integrating People, Practices, and Principles*

---

## Routes

```
/                 Mission Control overview
/jarvis           Atlas · Neural Interface (voice)   [internal path kept as /jarvis]
/tasks            Kanban board
/studio           Image generation
/agent/:id        Control rooms: atlas, claude, openclaw, ollama, codex, gemini
/goals            Goals
/memory           Memory viewer
/journal          Journal
/settings         Settings
```

---

## Sidebar

- P3 logo mark + "P3 MISSION CONTROL" (white P, red 3) + "Local Studio · p3mc.ngrok.io"
- **Nav:** Mission Control · Atlas · Neural Interface · Tasks · Studio
- **Agents:** six clickable rows — colored circle (dark tint bg, agent-color
  initial), name, status dot (green/yellow/red), hover glow → `/agent/:id`
- **System:** Goals · Memory · Journal · Settings (all wired to real pages)
- Footer: `v1.2.1 · Atlas` · `port 3011`

---

## Mission Control Overview

1. **Signal Status Bar** — card per agent + Heartbeat + Latency, LIVE/ONLINE/OFFLINE
   badge, animated sine waveform (animates only when online). Gateway health from
   `/api/gateway/health` (4s poll).
2. **Active Agents** — six cards (`grid-cols-2 lg:grid-cols-3 xl:grid-cols-6`),
   per-agent glow, two stat pills, "OPEN CONTROL ROOM →".
3. **Token Usage & Cost** — live table, 30s poll of `/api/tokens` (gateway
   `/status` first, falls back to `data/token-usage.json`), "Last updated"
   line, session TOTAL row, LIVE/CACHED source indicator.
4. **SmartBites panel** — 3 health badges (Supabase / Expo / portal), 4 quick
   stats from `data/smartbites.json`, deep links. *(Known: health currently
   treats any HTTP response as ONLINE — tighten to 2xx-only when desired.)*
5. **Operations** — Activity Feed (`data/activity.json`) + Shared Log
   (`data/shared-log.json`, with send input).

---

## Atlas · Neural Interface (`/jarvis`)

Full-screen `#060609`. Header "ATLAS / NEURAL INTERFACE" + ONLINE + live clock.

- **Left — System Status:** STATUS, MODE, WAKE WORD `HEY ATLAS`, VOICE `ATLAS-V1`,
  NEURAL THROUGHPUT / CORE LOAD / SIGNAL bars, LATENCY. Voice Control buttons:
  **LISTEN** and **ENABLE "HEY ATLAS"**.
- **Center — Orb:** rotating concentric rings, triangle markers, pulsing core.
  Faster/brighter on LISTENING/SPEAKING, slow on IDLE. Label "ATLAS".
- **Right — Transcript:** YOU / ATLAS / SYSTEM entries, timestamped, auto-scroll.

### Browser voice flow (the fix that moved us out of echo mode)

- **LISTEN** → `SpeechRecognition` (interim preview under orb) → on final, POST
  to `/api/agent/message`.
- `/api/agent/message` runs **`openclaw agent --session-key agent:main:p3mc-<tag>
  --message <text> --json --timeout 120`** via `execFile` (arg array — no shell
  injection). Parses `payloads[].text`. Same auth/config as the gateway; **no
  OpenAI HTTP endpoint enabled**. Graceful echo fallback only if the CLI fails.
- Reply shown as ATLAS entry and spoken via `speechSynthesis` (voice preference:
  Daniel → Alex → Google US English → en-US male → en).
- **HEY ATLAS:** continuous background `SpeechRecognition` listens for "hey atlas",
  triggers the LISTEN flow, re-arms after each turn. WAKE pulse indicator in header.
- Browser request timeout is 125s (agent cold start can take 10–30s).
- Error toasts: "Voice requires Chrome or Edge" / "Microphone access required".

### Local Voice Engine panel (bottom of `/jarvis`) — NEW

GUI control for the local Kokoro/Whisper wake loop (replaces the CLI):

- **START / STOP / RESTART** drive `~/.openclaw/labs/local-voice-poc/bin/voice-poc-bg`
  (extended to accept `VOICE_BACKEND/MODEL/WAKE_WORD/INPUT_DEVICE/TTS` env vars;
  defaults unchanged).
- Selectors: backend (Ollama local / OpenClaw-Atlas), voice (bm_daniel etc.),
  mic device (`:0` Snowball / `:1` iPhone), wake word. Persists to `data/voice.json`.
- Live color-coded log tail (5s): WAKE/COMMAND green, ATLAS cyan, BLANK_AUDIO red.
- Status reflects the bg-runner-managed instance (a manually-started loop with no
  PID file shows as STOPPED).
- **Mic caveat:** captures inherit the dashboard server's mic permission. If
  GUI-started captures are blank while CLI works, launch `node server.js` from a
  Terminal that already has mic permission (same gotcha documented in the lab README).

---

## Tasks (`/tasks`)

- Stat row: This Week · In Progress · Total · Completion %
- Agent status row (Atlas/Claude/Ollama, active/idle + last activity)
- Kanban: To Do / In Progress / Done with counts; cards show title, description,
  agent badge, priority (High red / Med orange / Low green), date, Start/Done/Delete
- "+ New Task" modal; persists to `data/tasks.json`
- Includes 4 seeded **Phase 4** roadmap cards (Up Next)

---

## Agent Control Rooms (`/agent/:id`)

Shared layout, per-agent accent color throughout.

- **Atlas** (cyan): tabs Chat · Sessions · Memory · Cron · Workspace;
  `/api/atlas/sessions`, `/api/memory` (reads `workspace/memory/*.md`), `/api/cron`.
- **Claude** (orange): Sonnet 4.6 · 200k · Anthropic; tokens + cost from
  `/api/tokens`; Claude-filtered activity; "Open Claude.ai →".
- **OpenClaw** (purple): gateway health, sessions, port 18789, mode Bridge,
  Telegram status, ngrok `openclaw-gateway.ngrok.io`.
- **Ollama** (green): models from `/api/ollama/models` (60s) + loaded-in-memory
  `/api/ollama/ps`; round-trip latency; pull/list actions.
- **Codex** (dark purple): gpt-5.5 · Codex · OpenAI; session info.
- **Gemini** (gold): Gemini 2.0 · Google; session info.

---

## System Pages

- **Goals** (`/goals`): `data/goals.json`; add + toggle complete.
- **Memory** (`/memory`): reads `workspace/memory/*.md`; preview/timestamp/source;
  client-side search; read-only.
- **Journal** (`/journal`): `data/journal.json`, newest first.
- **Settings** (`/settings`): gateway URL (editable), ngrok URL (display),
  token refresh interval, wake-word toggle, voice selector
  (`speechSynthesis.getVoices()`), theme (dark, placeholder). Saves `data/settings.json`.

---

## Studio (`/studio`)

DALL·E 3 / 2, size picker, prompt + Generate. Generated images saved locally to
`data/studio/` and served at `/studio-images/` (persist past OpenAI URL expiry).
**Requires `OPENAI_API_KEY` in the server env** — returns a clear 503 if unset.

---

## Server API (`server.js`)

```
GET/POST/PUT/DELETE /api/tasks
GET/POST            /api/activity
GET/POST            /api/log
GET                 /api/gateway/health
POST                /api/agent/message      → `openclaw agent` CLI (real Atlas)
GET/POST            /api/tokens             → gateway /status, fallback JSON
GET                 /api/ollama/models
GET                 /api/ollama/ps
GET                 /api/atlas/sessions
GET                 /api/memory             → workspace/memory/*.md
GET                 /api/cron
GET                 /api/smartbites/health?target=supabase|mobile|portal
GET/POST            /api/smartbites
GET/POST/PUT        /api/goals
GET                 /api/journal
GET/POST            /api/settings
GET/POST            /api/voice/status|start|stop|restart   (+ GET /api/voice/logs)
GET/POST/DELETE     /api/studio/images, POST /api/studio/generate
static              /studio-images/  ←  data/studio/
```

All external/gateway/CLI calls have graceful fallbacks; browser APIs are
feature-detected.

---

## Data Files (`./data/`)

```
tasks.json · activity.json · shared-log.json · token-usage.json
smartbites.json · goals.json · journal.json · settings.json
voice.json · studio.json · studio/ (generated images)
```

---

## Deployment

- Files: `~/.openclaw/workspace/mission-control/`
- Server: `node server.js` on port 3011 (launch from a Terminal with mic
  permission if you intend to use the GUI voice engine)
- Public: `https://p3mc.ngrok.io` (ngrok tunnel `mission-control` → 3011)
- Auth: `MISSION_CONTROL_USER` / `MISSION_CONTROL_PASSWORD`
- Build: `npm run build` → `dist/`
- Version: `v1.2.1 · Atlas`

---

## Known Gaps / Follow-ups

- SmartBites health = any-response-is-online (make 2xx-only when wanted).
- Token "live" depends on the gateway `/status` exposing per-agent counts;
  otherwise cached JSON.
- Studio needs `OPENAI_API_KEY`.
- GUI voice-engine mic permission inherits from the server process.
- `splash.svg` staged but not mounted as a boot screen.

---

## Phase 4 (planned — tracked on the Kanban board)

- Real-time WebSocket feed replacing polling
- SmartBites admin actions from Mission Control
- Multi-agent task routing (auto-assign to the right agent)
- Mobile PWA so `p3mc.ngrok.io` installs as an iPhone home-screen app
- *(Candidate)* ElevenLabs cloud TTS as a selectable voice backend
