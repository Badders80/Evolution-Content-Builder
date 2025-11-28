# Evolution Content Builder - Builder Profile (Phase 1)

## Purpose
Single source of truth for how the Evolution Content Builder rewrites and structures updates. Use this to brief Gemini or any LLM so outputs stay consistent with the brand and the UI's structured fields.

## Brand voice & guardrails (embed in every prompt)
- Voice: Understated Authority - calm, confident, factual, British English.
- Be declarative, not loud. Authority comes from evidence and clarity.
- No hype terms: avoid "disrupting", "revolutionising", "democratising", "cutting-edge tech", "game-changing", etc.
- Do not invent race results, odds, or quotes. Only use what is provided.
- Default to concise sentences; every line should earn its place.
- Align with Evolution Stables' bridges when closing: "ownership, evolved"; regulation with purpose; heritage respected.

## 4MAT rhythm (keep short)
1) **Why** - tension or purpose.  
2) **What** - facts and proof.  
3) **How** - mechanism or plan.  
4) **What If** - invitation or next step.

## Presets (angles to bias the rewrite)
- **pre-race**: Forthcoming engagement; readiness, track/conditions, jockey/horse context, measured expectation (no odds).
- **post-race**: Result and takeaways; how it ran, learnings, recovery plan, next steps; no invented placings/times.
- **race-announcement**: Clear invitation; when/where, runners, viewing/follow info; concise and orderly.
- **trainer-update**: Training insight; fitness, temperament, adjustments, what’s next; include a quote only if provided.

## Output contract (all presets)
Structured JSON the UI and renderer can rely on:
```json
{
  "preset": "pre-race | post-race | race-announcement | trainer-update",
  "headline": "string, 4-8 words, specific",
  "subheadline": "string, 12-20 words, context",
  "body": ["paragraph string", "paragraph string"],
  "key_points": ["bullet", "bullet"],
  "quote": "string or empty",
  "quote_by": "string or empty",
  "social_caption": "string, 20-35 words, British English",
  "cta": "string, short instruction or empty"
}
```

## Output requirements by preset
- **pre-race**
  - Focus: readiness, track/conditions, jockey/horse pairing, plan.
  - Key points should cover date/track, distance, draw/barrier (if supplied), surface/conditions, rider, stable note.
  - CTA: "Follow the run", "Watch live", or similar (no betting language).

- **post-race**
  - Focus: result takeaways, how it travelled, tactical notes, recovery and next target.
  - Key points: performance summary, tactical note, fitness/recovery, upcoming plan.
  - CTA: "Full debrief to follow", "Next target scheduled", etc.

- **race-announcement**
  - Focus: when/where, runner(s), how to watch/follow, succinct invitation.
  - Key points: date/time, track/meeting, runner(s), viewing link/instructions if provided.
  - CTA: "Join us on course/stream", "Follow live updates".

- **trainer-update**
  - Focus: training block, temperament, adjustments, readiness markers.
  - Key points: work completed, trainer observations, next action.
  - Quote only if a source quote is supplied; never invent.

Done when: prompts built from this profile produce the JSON contract above, in brand voice, without hallucinated data.
