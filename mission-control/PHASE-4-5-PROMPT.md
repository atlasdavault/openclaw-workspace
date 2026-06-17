# P3 Mission Control — Phase 4 & 5 Prompt

## Phase 4: Standards, Skills, Learning Loop & Provider Expansion

### Context

Phases 1-3 built the foundation: agent cards, Kanban, Atlas neural interface,
voice, token costs, SmartBites panel, agent control rooms, and P3 brand identity.
Atlas is live, named, and committed.

Phase 4 is about operating discipline: absorb the best architectural patterns
from Builder Methods AgentOS while keeping the parts of the P3/OpenClaw stack
that are already stronger.

What to borrow:
- Standards/spec hygiene: separate "how we build here" from "how to do this task".
- Skill registry lifecycle: proposed -> approved -> quarantined.
- Spec pipeline from goal to PR to changelog.

What P3 already has:
- Living Atlas identity and memory layer.
- OpenClaw native skills and plugin system.
- Real Mission Control UI with voice, gateway status, token tables, SmartBites panel.
- Agent roster with full color-coded identity system.
- True operations console, not just prompt files.
- Atlas can call and text Joe.

Verdict: do not rebuild. Extend.

## Feature 1: P3 Standards Library

Create `~/.openclaw/workspace/standards/`.

These files are declarative conventions, not procedural workflows.

Files:

- `standards/security.md`
  - Auth patterns: JWT, PKCE, OAuth flows.
  - RLS policy conventions for Supabase.
  - Secret management: never in code, always in env or OpenClaw secrets.
  - API key rotation policy.
  - Approved vs blocked exec commands for Atlas.

- `standards/frontend.md`
  - Stack: React + Vite + TypeScript + Tailwind.
  - Component naming: PascalCase, `SB*` prefix for SmartBites wrappers.
  - State management: TanStack Query for server state, Zustand for client state.
  - File structure conventions.
  - Dark theme color tokens and P3/agent palette.

- `standards/backend.md`
  - Stack: NestJS + Node + TypeScript.
  - Repository pattern by default; CQRS only when reads/writes genuinely diverge.
  - DTO conventions, validation with `class-validator`.
  - API versioning approach.
  - Error handling patterns.

- `standards/voice.md`
  - Wake word: "Hey Atlas".
  - TTS provider: current browser/Kokoro path, upgrade path MiniMax TTS or ElevenLabs.
  - Voice identity: `ATLAS-V1`, deepest calm English male voice.
  - Transcript format: YOU / ATLAS labels, timestamped.
  - Fallback behavior when mic/TTS unavailable.

- `standards/git.md`
  - Branch naming: `feature/`, `fix/`, `chore/`.
  - Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`.
  - PR requirements: description, test notes, screenshots for UI changes.
  - Changelog updated on every merge.

- `standards/smartbites.md`
  - Monorepo location: `/Users/davaobj2/code/smartbites-solutions/`.
  - Mobile app: React Native + Expo SDK 53.
  - Backend: NestJS + Supabase.
  - Allergen/dietary inference pipeline: Gemini API + Google Search grounding.
  - Restaurant data model: `restaurants` -> `restaurant_locations`.
  - Auth: PKCE on mobile, session cookies on web.
  - Naming: `SB*` prefix for wrapper components.

- `standards/agents.md`
  - Atlas: primary orchestration agent for P3 Solutions Group.
  - Claude: Anthropic reasoning, complex analysis, architecture decisions.
  - OpenClaw: local gateway, session management, skill routing.
  - Ollama: local inference, simple tasks, privacy-sensitive work.
  - Codex: code-first tasks, multi-step engineering.
  - Gemini: multimodal, long-context, Google ecosystem tasks.
  - Routing: simple -> Ollama, medium -> Atlas/Codex, complex -> Claude.

Mission Control `/standards` page:
- List standards with title, description, last updated.
- Click to read markdown.
- "Suggest Edit" creates Kanban task assigned to Atlas, priority MED.
- Add sidebar item under SYSTEM.

## Feature 2: Mission Control Skill Registry

Route: `/skills`.

Data sources:
- `~/.openclaw/skills/`
- OpenClaw skills API / Skill Workshop where available.

Summary row:
- Total skills.
- Active count.
- Pending approval count.
- Quarantined count.

Skills table columns:
- Skill.
- Status.
- Version.
- Source.
- Last Used.
- Actions.

Statuses:
- Active: green badge.
- Pending: yellow badge, awaiting Joe approval.
- Quarantined: red badge, disabled/flagged.

Skill detail view:
- Full description.
- Trigger conditions.
- Required permissions / exec commands.
- Version history.
- Last 5 uses.
- Approve / Quarantine / Delete actions.

Propose new skill:
- Modal: name, description, trigger, exec commands needed.
- Creates pending skill entry.
- Notifies Atlas via shared log.
- Joe approves from registry.

## Feature 3: Learning Loop

After meaningful work, detected by task moving to Done or end-of-day cron, surface
in Shared Log:

```text
Atlas completed: "Build Mission Control Phase 2"
Save this work as:
 [ ] Memory
 [ ] Standard
 [ ] Skill
 [ ] Changelog
 [ ] Nothing
```

Actions:
- Memory: write to Atlas memory layer with timestamp/context.
- Standard: draft standards update and put it Pending.
- Skill: create pending skill registry entry.
- Changelog: append to `./data/changelog.md`.

Add `/changelog` page:
- Chronological completed work, decisions, system changes.
- Entry fields: date, description, type badge.
- Atlas writes automatically when learning loop fires.
- Joe can add manual entries.

## Feature 4: Spec Pipeline

Route: `/specs` or integrated into Tasks.

Lifecycle:

```text
Goal
 -> Spec
 -> Tasks
 -> Branch
 -> PR
 -> Changelog
```

Spec document:
- Title and one-line summary.
- Problem.
- Proposed solution.
- Out of scope.
- Success criteria.
- Affected standards.
- Tasks list.
- Branch name.

Spec page:
- List specs: title, status, date, linked task count.
- Markdown detail view.
- "Create Tasks from Spec" converts spec tasks into Kanban cards.
- "Mark Shipped" triggers changelog entry and learning loop.

Kanban wiring:
- Tasks created from a spec show spec name as a tag.

## Feature 5: MiniMax M3 Optional Provider

Do not replace Claude or GPT. Add MiniMax M3 as optional provider for specific
long-context, multimodal, or code-heavy use cases.

When stable weights are confirmed available on Hugging Face/Ollama:

```bash
ollama pull minimax-m3:latest
```

Ollama Control Room:
- Add MiniMax M3 row.
- Tag: `1M context · Multimodal · Code`.
- Benchmark badge after local tests.

Settings Model Routing Rules:
- Simple task -> Ollama (`llama3.2` or `gemma3:12b`).
- Long context / large codebase -> MiniMax M3 when available.
- Complex reasoning -> Claude Sonnet.
- Code-first -> Codex / `gpt-5.5`.
- Multimodal -> Gemini or M3.
- Default fallback -> Atlas / `gpt-5.4`.

TTS evaluation:
- Add TTS provider selector: Browser/Kokoro current, MiniMax TTS, ElevenLabs.
- Wire MiniMax TTS as optional Atlas voice output.
- Compare quality and latency against current path.
- MiniMax TTS may be cheaper than ElevenLabs and is worth testing.

## Feature 6: Standards Page

Route: `/standards`.

Layout:
- Card grid: one card per standards file.
- Card: title, description, last updated, "Read ->".
- Detail view renders markdown.
- "Suggest Edit" creates Kanban task: `Review standards/[name].md`, assigned to Atlas, priority MED.
- Atlas-proposed updates stay Pending until Joe approves.

## New Routes

```text
/standards  P3 Standards Library
/skills     Skill Registry
/specs      Spec Pipeline
/changelog  Project Changelog
```

Sidebar SYSTEM section:

```text
SYSTEM
 ○ Goals
 ○ Memory
 ○ Journal
 ○ Standards
 ○ Skills
 ○ Specs
 ○ Changelog
 ○ Settings
```

## New Data Files

```text
./data/
  changelog.md
  specs/
    [spec-name].md
  standards-index.json
  skills-index.json
  learning-loop.json
```

## Deployment Notes

- Mission Control stays under `~/.openclaw/workspace/mission-control/`.
- Server remains on port 3011.
- Public URL: `https://p3mc.ngrok.io`.
- Auth unchanged for now, but scrub before GitHub.
- Update version tag to `v2.0.0 · Phase 4`.
- Standards live at `~/.openclaw/workspace/standards/`.
- After build, confirm all new routes respond cleanly.

## Phase 5 Future

- Real-time WebSocket replacing polling.
- Multi-agent task routing: Mission Control picks the right agent automatically.
- SmartBites admin actions from Mission Control.
- Mobile PWA for iPhone home screen.
- MiniMax M3 full integration once weights/provider stability are confirmed.

## Guiding Verdict

Agent OS has better standards and spec hygiene.
P3 has the better Mission Control foundation.
Phase 4 absorbs their discipline into our operating layer.
