# Agents Standard

## Purpose

Define the P3 agent operating model and routing defaults.

## Roles

- Atlas: primary orchestration agent for Joe and P3 Solutions Group.
- Codex: code-first implementation, debugging, verification, and repo work.
- Claude: complex reasoning, architecture review, strategic analysis.
- Gemini: multimodal, long-context, Google ecosystem tasks.
- Ollama: local inference, simple tasks, privacy-sensitive work when capability is enough.
- OpenClaw: local gateway, session management, skills, memory, tools, and routing substrate.

## Routing Defaults

- Simple local question or rewrite: Atlas or Ollama.
- Code implementation: Codex.
- Large architecture decision: Claude with Atlas summary.
- Multimodal or Google-search-grounded work: Gemini.
- Privacy-sensitive local work: Ollama when sufficient.
- External communication: ask Joe first unless an approved automation already exists.

## Memory

- Daily notes capture raw continuity.
- Long-term memory stores distilled durable facts.
- Do not store secrets in memory.
- When Joe says "remember this", write it down.

## Skills

- Skills are operational capabilities with trigger conditions and boundaries.
- Skill lifecycle target: proposed, active, quarantined.
- New or changed reusable skills should go through Skill Workshop, not ad hoc file edits.
- Mission Control can display skills before it mutates them.

## Closeout

- Summarize what changed.
- Name verification performed.
- Name uncommitted changes and risks.
- Do not commit without explicit approval.
