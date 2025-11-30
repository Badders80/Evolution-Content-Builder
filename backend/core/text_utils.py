"""
Text processing utilities for Evolution Content Builder

This module provides core text analysis and prompt building functions
used throughout the application. Isolated from app.py to prevent
circular imports and improve maintainability.
"""
import re
import json
import os
from typing import Optional, List, Dict, Any
from textwrap import dedent

# Get absolute path to config directory
_BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_CONFIG_DIR = os.path.join(_BASE_DIR, "config")

# Load config (simplified for utility)
try:
    with open(os.path.join(_CONFIG_DIR, "brand_rules.json"), "r") as f:
        BRAND_RULES = json.load(f)
except FileNotFoundError:
    BRAND_RULES = {}

try:
    with open(os.path.join(_CONFIG_DIR, "banned_words.json"), "r") as f:
        BANNED_WORDS = json.load(f)
except FileNotFoundError:
    BANNED_WORDS = {}

STOPWORDS = {
    "the", "and", "or", "a", "an", "to", "of", "in", "for", "on", "with", "at",
    "by", "from", "up", "about", "into", "over", "after", "is", "it", "as", "be",
    "are", "was", "were", "this", "that", "those", "these", "can", "will", "just",
    "than", "then", "but", "so", "if", "out", "not", "no", "we", "you", "our",
    "their", "they", "them", "he", "she", "his", "her", "its", "i", "me", "my"
}

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


def tokenize_words(text: str) -> list[str]:
    """
    Extract words from text using regex, converting to lowercase.
    
    Args:
        text: Input text to tokenize
        
    Returns:
        List of lowercase words (including apostrophes)
        
    Example:
        >>> tokenize_words("First Gear's race was excellent!")
        ['first', "gear's", 'race', 'was', 'excellent']
    """
    return re.findall(r"[A-Za-z']+", text.lower())


def compute_readability_band(word_count: int) -> str:
    """
    Classify content length into readability bands (legacy version).
    
    Args:
        word_count: Number of words in content
        
    Returns:
        Band classification: "very short" | "good length" | "long" | "very long"
    """
    if word_count < 60:
        return "very short"
    if word_count < 160:
        return "good length"
    if word_count < 300:
        return "long"
    return "very long"


def compute_readability_band_stage1(word_count: int) -> str:
    """
    Classify content length for Stage 1 analysis (stricter bands).
    
    Args:
        word_count: Number of words in content
        
    Returns:
        Band classification: "very_short" | "good" | "long"
    """
    if word_count < 80:
        return "very_short"
    if word_count < 220:
        return "good"
    return "long"


def extract_keywords(text: str, limit: int = 10) -> list[str]:
    """
    Extract most frequent meaningful keywords from text.
    
    Filters out:
    - Stopwords (common words like "the", "and", etc.)
    - Words 3 characters or less
    
    Ranks by:
    1. Frequency (descending)
    2. Length (descending, as tiebreaker)
    3. Alphabetical (as final tiebreaker)
    
    Args:
        text: Input text to analyze
        limit: Maximum number of keywords to return (default: 10)
        
    Returns:
        List of keyword strings, most important first
        
    Example:
        >>> extract_keywords("racing racing champion performance", limit=2)
        ['racing', 'champion']
    """
    words = tokenize_words(text)
    freq: dict[str, int] = {}
    
    for word in words:
        if len(word) <= 3 or word in STOPWORDS:
            continue
        freq[word] = freq.get(word, 0) + 1
    
    # Sort by frequency (desc), then length (desc), then alphabetically
    sorted_words = sorted(
        freq.items(),
        key=lambda item: (-item[1], -len(item[0]), item[0])
    )
    
    return [w for w, _ in sorted_words[:limit]]


def _tone_descriptor(tone: Optional[float]) -> str:
    """
    Convert numeric tone value (0-100) to descriptive text.
    
    Tone scale:
    - 0-24: Very restrained, factual
    - 25-49: Measured, calm authority
    - 50-74: Assured, warmer but precise
    - 75-100: Confident yet composed
    
    Args:
        tone: Numeric tone value (0-100) or None for default
        
    Returns:
        Descriptive tone guidance string
    """
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
    """
    Convert length keyword to detailed content guidance.
    
    Args:
        length: "short" | "standard" | "long" or None
        
    Returns:
        Detailed instruction for content length
    """
    mapping = {
        "short": "short: keep to 1-2 tight paragraphs and concise bullets",
        "standard": "standard: 2-3 paragraphs and 3-5 bullets",
        "long": "long: 3-4 paragraphs with depth while staying concise",
    }
    return mapping.get(length or "standard", mapping["standard"])


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
    Construct AI prompt for content generation with brand guidelines.
    
    This function builds a comprehensive prompt that instructs the LLM to:
    - Follow Evolution Stables brand voice (Understated Authority)
    - Use 4MAT structure (Why, What, How, What If)
    - Return valid JSON matching OUTPUT_TEMPLATE schema
    - Never fabricate race results or quotes
    
    Args:
        preset: Content type ("pre-race", "post-race", etc.)
        raw_text: Input content to transform
        tone: Numeric tone value 0-100 (default: balanced)
        length: Target length ("short", "standard", "long")
        audience: Target audience (e.g., "investors", "owners")
        style_flags: Additional style modifiers (currently unused)
        
    Returns:
        Complete LLM prompt string with all instructions and context
        
    Example:
        >>> prompt = build_prompt("post-race", "First Gear won today", 
        ...                       tone=60, length="short", audience="investors")
        >>> # Returns multi-line prompt with brand guidelines
    """
    tone_desc = _tone_descriptor(tone)
    length_desc = _length_guidance(length)
    
    # Construct comprehensive prompt with brand guidelines
    prompt = f"""You are the Evolution Content Builder AI, specialized in transforming raw racing updates into polished, brand-compliant investor communications.

**BRAND VOICE: Understated Authority**
- Declarative confidence (prove innovation, don't shout it)
- Established leadership position
- Inform without arrogance, educate without lecturing
- Trusted insider tone (racing purist + digital investor hybrid)

**CONTENT REQUIREMENTS**
Preset: {preset}
Audience: {audience or "general racing follower"}
Tone: {tone_desc}
Length: {length_desc}

**STRUCTURE: 4MAT Framework**
1. WHY - Purpose or tension (emotional hook)
2. WHAT - Core information (facts, data)
3. HOW - Process or mechanics (explanation)
4. WHAT IF - Vision or next steps (call to action)

**CRITICAL RULES**
✅ Use British English spelling (colour, organisation, analyse)
✅ Never invent race results, odds, or quotes—only use supplied facts
✅ Avoid hype words: "revolutionary", "game-changing", "disrupting"
✅ Keep sentences crisp, paragraphs focused
✅ Return ONLY valid JSON matching the schema below

**OUTPUT SCHEMA**
{json.dumps(OUTPUT_TEMPLATE, indent=2)}

**RAW INPUT TO TRANSFORM**
\"\"\"{raw_text.strip()}\"\"\"

Generate the content now. Return ONLY the JSON object, no markdown formatting or explanations."""
    
    return dedent(prompt).strip()
