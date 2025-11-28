#!/usr/bin/env python3
"""
Evolution Content Builder — Brand Validation Script

This script validates text content against Evolution Stables brand rules.
It checks for banned words, hype language, and tone violations.

Usage:
    python scripts/validate_brand.py "Your text to validate"
    python scripts/validate_brand.py --file path/to/file.txt
    echo "Text content" | python scripts/validate_brand.py --stdin

Exit codes:
    0 = Passed (brand compliant)
    1 = Failed (violations found)
    2 = Error (invalid input)
"""
import json
import re
import sys
from pathlib import Path
from typing import List, Tuple

# Load config
CONFIG_DIR = Path(__file__).parent.parent / "config"

def load_config():
    """Load brand rules from config files."""
    banned_words_path = CONFIG_DIR / "banned_words.json"
    brand_rules_path = CONFIG_DIR / "brand_rules.json"
    
    banned_words = {}
    brand_rules = {}
    
    if banned_words_path.exists():
        banned_words = json.loads(banned_words_path.read_text())
    if brand_rules_path.exists():
        brand_rules = json.loads(brand_rules_path.read_text())
    
    return banned_words, brand_rules


def get_all_banned_words(config: dict) -> List[str]:
    """Extract all banned words from config."""
    words = []
    words.extend(config.get("banned_words", []))
    words.extend(config.get("hype_words", []))
    words.extend(config.get("vague_superlatives", []))
    words.extend(config.get("marketing_buzzwords", []))
    return [w.lower() for w in words]


def check_banned_words(text: str, banned_words: List[str]) -> List[Tuple[str, int]]:
    """Find banned words in text. Returns list of (word, position) tuples."""
    violations = []
    text_lower = text.lower()
    
    for word in banned_words:
        # Find all occurrences
        start = 0
        while True:
            pos = text_lower.find(word.lower(), start)
            if pos == -1:
                break
            # Check it's a word boundary
            before_ok = pos == 0 or not text_lower[pos-1].isalnum()
            after_ok = pos + len(word) >= len(text_lower) or not text_lower[pos + len(word)].isalnum()
            if before_ok and after_ok:
                violations.append((word, pos))
            start = pos + 1
    
    return violations


def check_patterns(text: str) -> List[str]:
    """Check for banned patterns."""
    warnings = []
    
    # Multiple exclamation marks
    if re.search(r'!{2,}', text):
        warnings.append("Multiple exclamation marks detected (!!)")
    
    # All caps words (more than 4 chars, excluding common acronyms)
    caps_words = re.findall(r'\b[A-Z]{5,}\b', text)
    allowed_acronyms = {'NZTR', 'COVID', 'HTTPS', 'EMAIL'}
    for word in caps_words:
        if word not in allowed_acronyms:
            warnings.append(f"All-caps word detected: {word}")
    
    # Hype emojis in professional context
    hype_emojis = ['🚀', '🔥', '💯', '🙌', '💪', '🎯']
    for emoji in hype_emojis:
        if emoji in text:
            warnings.append(f"Hype emoji detected: {emoji}")
    
    return warnings


def validate_brand(text: str) -> Tuple[bool, List[str]]:
    """
    Validate text against brand rules.
    
    Returns:
        (passed, list of warning messages)
    """
    banned_config, brand_rules = load_config()
    banned_words = get_all_banned_words(banned_config)
    
    warnings = []
    
    # Check banned words
    word_violations = check_banned_words(text, banned_words)
    for word, pos in word_violations:
        # Get context (10 chars before and after)
        start = max(0, pos - 10)
        end = min(len(text), pos + len(word) + 10)
        context = text[start:end]
        warnings.append(f"Banned word '{word}' at position {pos}: ...{context}...")
    
    # Check patterns
    pattern_warnings = check_patterns(text)
    warnings.extend(pattern_warnings)
    
    passed = len(warnings) == 0
    return passed, warnings


def main():
    """CLI entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Validate text against Evolution Stables brand rules"
    )
    parser.add_argument("text", nargs="?", help="Text to validate")
    parser.add_argument("--file", "-f", help="Read text from file")
    parser.add_argument("--stdin", action="store_true", help="Read from stdin")
    parser.add_argument("--quiet", "-q", action="store_true", help="Only show pass/fail")
    
    args = parser.parse_args()
    
    # Get text to validate
    text = None
    if args.stdin:
        text = sys.stdin.read()
    elif args.file:
        try:
            text = Path(args.file).read_text()
        except Exception as e:
            print(f"Error reading file: {e}", file=sys.stderr)
            sys.exit(2)
    elif args.text:
        text = args.text
    else:
        parser.print_help()
        sys.exit(2)
    
    # Validate
    passed, warnings = validate_brand(text)
    
    # Output results
    if args.quiet:
        print("✅ PASSED" if passed else "❌ FAILED")
    else:
        if passed:
            print("✅ Brand compliance check PASSED")
            print(f"   Checked {len(text)} characters")
        else:
            print("❌ Brand compliance check FAILED")
            print(f"   Found {len(warnings)} violation(s):\n")
            for warning in warnings:
                print(f"   • {warning}")
    
    sys.exit(0 if passed else 1)


if __name__ == "__main__":
    main()
