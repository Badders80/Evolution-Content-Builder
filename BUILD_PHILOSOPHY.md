# Evolution Content Builder — Build Philosophy

> This document defines the architectural principles that govern the Evolution Content Builder.  
> Every feature, component, and decision must align with these principles.

---

## 1. Purpose of This System

The Evolution Content Builder is a **deterministic content production system**, not a chatbot.

It transforms raw race updates, trainer notes, and syndicate information into **investor-ready, brand-compliant content** — consistently, every time.

**Core promise:**  
Raw input → Structured JSON → Refined content → Professional output

No drift. No guesswork. No off-brand surprises.

---

## 2. Why the 3-Stage Workflow Exists

The pipeline is intentionally separated into three distinct stages:

| Stage | Responsibility | What It MUST NOT Do |
|-------|----------------|---------------------|
| **Stage 1: Text Creation** | Convert raw input → structured JSON | Handle layout, formatting, device sizing |
| **Stage 2: Refinement** | Polish content, enforce tone, tighten copy | Change structure, add new sections |
| **Stage 3: Output** | Render to HTML/PDF, apply device layouts | Rewrite content, change meaning |

**Why separation matters:**
- Prevents stages from bleeding into each other
- Makes debugging trivial (isolate the broken stage)
- Allows independent iteration on each stage
- Ensures AI cannot escape its designated role

---

## 3. Why Parameters Are Embedded Into the Build

All brand rules, tone guidelines, templates, and schemas live in `/config` — not in code logic, not in developer memory, not scattered across files.

**Benefits:**
- **Consistency**: Every output uses identical rules
- **No human error**: The system enforces compliance automatically
- **Scalability**: Add new templates in 2 minutes, not 2 days
- **AI containment**: LLMs cannot escape the parameter boundaries
- **Single source of truth**: Update once, applies everywhere

**What gets embedded:**
- Brand voice rules
- Banned/preferred words
- Template structures
- Section requirements
- JSON schemas for each stage
- Tone guidelines

---

## 4. Brand-Locked Voice Strategy

Evolution Stables uses **understated authority** as its voice:

| Principle | Meaning |
|-----------|---------|
| **Clear** | No jargon, no fluff |
| **Direct** | Say it plainly |
| **Confident** | Authority from knowledge, not volume |
| **Human** | Write for people, not algorithms |
| **Progressive** | Forward-looking, but grounded |

**Banned patterns:**
- Hype words ("revolutionary", "disruptive", "game-changing")
- Exclamation marks in professional content
- Vague superlatives ("amazing", "incredible", "unbelievable")
- Marketing speak that lacks substance

**Preferred patterns:**
- Declarative statements
- Evidence-backed claims
- Measured optimism
- Insider expertise tone

---

## 5. Architecture Principles

### 5.1 Config-Driven Design
All behaviour flows from `/config` files. Code reads config; it doesn't define rules.

### 5.2 Schema Enforcement
Every stage has a JSON schema. Invalid data cannot pass between stages.

### 5.3 Separation of Concerns
- Backend: API + AI orchestration
- Frontend: UI + preview rendering
- Config: Rules + templates + schemas

### 5.4 No Magic Numbers
All constants (max lengths, section counts, etc.) live in config files.

### 5.5 Fail Loudly
Invalid brand compliance, schema violations, or AI errors must be visible — never silently swallowed.

---

## 6. AI Tools and Their Roles

| Tool | Role | Constraints |
|------|------|-------------|
| **Gemini** | Text generation, rewriting, analysis | Bound by prompt templates in `/lib/prompts.py` |
| **OpenAI** | Fallback LLM option | Same constraints as Gemini |
| **ComfyUI** | Image generation (optional) | Brand-specific LoRA, controlled prompts |

**AI Guardrails:**
- All prompts include brand rules
- All outputs validated against schemas
- Banned words trigger warnings
- Tone drift flagged in analysis

---

## 7. Scaling and Future Integration

This architecture is designed to support:

- **Evolution Studio**: Full content creation suite
- **Evolution Engine**: Automated content generation
- **Auto-generated race updates**: From race data APIs
- **Marketplace listings**: Auto-drafted from structured data
- **Training reports**: Templated from trainer inputs
- **Investor updates**: Scheduled, consistent, on-brand

**Why this works:**
- Parameters are centralised
- Templates are modular
- Schemas are versioned
- AI is constrained
- Pipeline is deterministic

---

## 8. How New Features MUST Align

Before adding any feature, verify:

- [ ] Does it read from `/config`, not hardcode rules?
- [ ] Does it respect stage boundaries?
- [ ] Does it use existing schemas or add new ones properly?
- [ ] Does it maintain brand voice?
- [ ] Does it fail loudly on violations?
- [ ] Is it documented?

**If a feature cannot satisfy these requirements, it does not belong in this system.**

---

## Summary

The Evolution Content Builder is not a generic tool.  
It is a **brand-locked, schema-enforced, stage-separated production system**.

Every parameter is embedded.  
Every stage is isolated.  
Every output is consistent.

This is the foundation for everything Evolution Stables will build.

---

*Last updated: November 2025*
