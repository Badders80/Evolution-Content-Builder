"""
Evolution Content Builder — Prompt Generation Module

This module is responsible ONLY for:
- Building AI prompts from config-driven rules
- Enforcing brand voice through prompt conditioning
- Ensuring schema compliance in AI outputs

It MUST NOT:
- Define brand rules (those live in /config)
- Handle rendering or layout
- Make decisions about content structure

All brand rules, templates, and schemas are loaded from /config.
"""
from __future__ import annotations

import json
from pathlib import Path
from textwrap import dedent
from typing import Any, Dict, Iterable, List, Optional

# Config paths - single source of truth
CONFIG_DIR = Path("config")
PROFILE_PATH = Path("lib/builder_profile.md")

# Load config files at module init
def _load_config(filename: str) -> Dict[str, Any]:
    """Load a JSON config file from /config directory."""
    path = CONFIG_DIR / filename
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {}

BRAND_RULES = _load_config("brand_rules.json")
TEMPLATES = _load_config("templates.json")
BANNED_WORDS = _load_config("banned_words.json")

# Canonical output contract used by UI + renderer
OUTPUT_TEMPLATE: Dict[str, Any] = {
    "preset": "pre-race | post-race | race-announcement | trainer-update",
    "headline": "string",
    "subheadline": "string",
    "body": ["paragraph strings"],
    "key_points": ["bullet strings"],
    "quote": "string or empty",
    "quote_by": "string or empty",
    "social_caption": "string",
    "cta": "string or empty",
}


STAGE1_OUTPUT_TEMPLATE: Dict[str, Any] = {
    "preset": "pre_race | post_race | race_announcement | trainer_update",
    "audience": "investor | owner | social | mixed",
    "tone": "formal | balanced | conversational",
    "length": "short | standard | long",
    "headline": "string",
    "subheadline": "string",
    "sections": [{"id": "sec-1", "heading": "string", "body": "string"}],
    "quote": "string",
    "quote_by": "string",
    "key_points": ["string"],
    "social_caption": "string",
    "meta": {
        "word_count": 0,
        "readability_band": "very_short | good | long",
        "keywords": ["string"]
    }
}


def _load_builder_profile() -> str:
    """Load the builder profile text for prompt conditioning."""
    if PROFILE_PATH.exists():
        return PROFILE_PATH.read_text(encoding="utf-8")
    # Fallback using config if profile file is missing
    voice = BRAND_RULES.get("voice", {})
    principles = ", ".join(voice.get("principles", ["clear", "direct", "confident"]))
    return f"""
Evolution Stables voice: {voice.get('style', 'Understated Authority')}.
Principles: {principles}.
{voice.get('description', 'Speak from established leadership position.')}
No hype terms; never invent race results, odds, or quotes. Use 4MAT: Why, What, How, What If.
""".strip()


def _get_banned_words_text() -> str:
    """Get banned words list as text for prompts."""
    words = BANNED_WORDS.get("banned_words", []) + BANNED_WORDS.get("hype_words", [])
    if words:
        return "Banned words (never use): " + ", ".join(words[:15])
    return ""


def _get_brand_voice_rules() -> str:
    """Get brand voice rules from config."""
    rules = BRAND_RULES.get("writing_rules", {})
    avoid = rules.get("avoid_patterns", [])
    prefer = rules.get("prefer_patterns", [])
    
    text = []
    if avoid:
        text.append("Avoid: " + "; ".join(avoid[:5]))
    if prefer:
        text.append("Prefer: " + "; ".join(prefer[:5]))
    return "\n".join(text)


def _tone_descriptor(tone: Optional[float]) -> str:
    """Translate a 0–100 slider into a descriptive tone."""
    if tone is None:
        return "balanced, calm authority"
    if tone < 25:
        return "very restrained, factual, minimal colour"
    if tone < 50:
        return "measured, calm authority"
    if tone < 75:
        return "assured, warmer but still precise"
    return "confident yet composed, still avoiding hype"


def _length_guidance(length: Optional[str]) -> str:
    mapping = {
        "short": "short: keep to 1-2 tight paragraphs and concise bullets",
        "standard": "standard: 2-3 paragraphs and 3-5 bullets",
        "long": "long: 3-4 paragraphs with depth while staying concise",
    }
    return mapping.get(length or "standard", mapping["standard"])


def _format_style_flags(flags: Optional[Iterable[str]]) -> str:
    if not flags:
        return "none"
    clean_flags = [flag.strip() for flag in flags if flag and flag.strip()]
    return ", ".join(clean_flags) if clean_flags else "none"


def build_prompt(
    preset: str,
    raw_text: str,
    *,
    tone: Optional[float] = None,
    length: Optional[str] = "standard",
    audience: Optional[str] = None,
    style_flags: Optional[List[str]] = None,
) -> str:
    """
    Build a Gemini-ready prompt that enforces the structured JSON contract.
    """
    profile = _load_builder_profile()
    tone_desc = _tone_descriptor(tone)
    length_desc = _length_guidance(length)
    flags_desc = _format_style_flags(style_flags)

    banned_words = _get_banned_words_text()
    brand_voice = _get_brand_voice_rules()
    
    prompt = f"""
You are the Evolution Content Builder.
Preset: {preset}
Audience: {audience or "general racing follower"}
Tone: {tone_desc} (slider={tone if tone is not None else 50}/100)
Length: {length_desc}
Style flags: {flags_desc}

Builder Profile (condensed):
{profile}

Brand Voice Rules:
{brand_voice}
{banned_words}

Rewrite the provided raw text into structured content that matches the preset.
- Use the 4MAT rhythm (Why, What, How, What If).
- Honour Evolution Stables' brand voice: Understated Authority, British English, calm, no hype.
- Never invent race results, odds, or quotes; only use what is supplied.
- Keep sentences economical; every line should earn its place.

Return ONLY valid JSON with the exact keys and types shown below. No code fences, no prose.
Schema (example values, keep same keys):
{json.dumps(OUTPUT_TEMPLATE, indent=2)}

Raw text:
\"\"\"{raw_text.strip()}\"\"\"
"""
    return dedent(prompt).strip()


def build_stage1_prompt(
    preset: str,
    raw_text: str,
    *,
    audience: str,
    tone: str,
    length: str,
) -> str:
    profile = _load_builder_profile()
    banned_words = _get_banned_words_text()
    brand_voice = _get_brand_voice_rules()
    
    prompt = f"""
You are the Evolution Content Engine for Evolution Stables.
Transform the raw notes into structured Stage1Content JSON.

Preset: {preset}
Audience: {audience}
Tone: {tone}
Length: {length}

Brand rules:
- Understated Authority, British English, clear and direct.
- No hype terms. Do not invent race results, odds, or quotes.
- If information is missing, call it out briefly rather than hallucinating.

{brand_voice}
{banned_words}

Builder Profile (condensed):
{profile}

Required JSON schema (Stage1Content):
{json.dumps(STAGE1_OUTPUT_TEMPLATE, indent=2)}

Additional guidance:
- Follow 4MAT rhythm: Why, What, How, What If.
- Use sections to reflect that rhythm; keep headings concise.
- Keep sentences economical; every line should earn its place.

Return ONLY valid JSON, no code fences, no prose.

Raw text:
\"\"\"{raw_text.strip()}\"\"\"
"""
    return dedent(prompt).strip()
