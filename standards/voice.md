# Voice Standard

## Purpose

Keep Atlas voice interactions useful, recognizable, private, and debuggable.

## Identity

- Wake phrase: `Hey Atlas`.
- Primary voice identity: `ATLAS-V1`, calm deep English male voice.
- Current local voice path: browser speech synthesis fallback plus Kokoro local TTS via `voice-poc`.
- Candidate cloud provider: ElevenLabs when quality, latency, privacy, and cost justify it.

## Transcript Format

Use clear speaker labels:

```text
YOU [2026-06-16T18:00:00-07:00]
...

ATLAS [2026-06-16T18:00:04-07:00]
...
```

## Privacy

- Do not store raw transcripts by default unless the session is explicitly meant to become a note, task, spec, or changelog entry.
- Never store secrets, recovery codes, private keys, or passwords in transcripts.
- Prefer local inference for privacy-sensitive work when capability is sufficient.

## Fallbacks

- If mic access fails, keep typed command input available.
- If TTS fails, continue with text response.
- If local voice services are offline, show status and avoid repeated noisy retries.

## Provider Evaluation

Evaluate voice providers on:

- Latency to first audio.
- Voice fit for Atlas identity.
- Reliability under long sessions.
- Cost per hour of expected use.
- Privacy posture and retention controls.
