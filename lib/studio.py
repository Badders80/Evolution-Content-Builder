"""
Evolution Content Builder — Studio Module

NotebookLM-style content generation features:
- Mind Map: Visual concept mapping (Mermaid.js format)
- Slide Deck: Presentation slides (HTML/Reveal.js)
- Audio Overview: Podcast-style summaries (TTS)
- Quiz: Interactive knowledge checks
- Flashcards: Study cards from content
- Report: Structured document generation

All outputs use Gemini for content generation, then render
to appropriate formats.
"""
import json
import re
from typing import Any, Dict, List, Optional
from pathlib import Path

# Load config
CONFIG_DIR = Path("config")

def _load_config(filename: str) -> Dict[str, Any]:
    path = CONFIG_DIR / filename
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {}

BRAND_RULES = _load_config("brand_rules.json")


# ============================================================
# MIND MAP GENERATION
# ============================================================

MINDMAP_PROMPT = """
You are an expert at creating clear, hierarchical mind maps.
Analyze the following content and create a mind map in Mermaid.js format.

Rules:
- Use 'mindmap' diagram type
- Keep node labels concise (2-5 words max)
- Maximum 3 levels of depth
- 4-6 main branches from the root
- Each branch can have 2-4 sub-nodes
- Use meaningful hierarchy (general → specific)

Content to map:
\"\"\"
{content}
\"\"\"

Return ONLY the Mermaid mindmap code, no explanation, no code fences.
Start directly with 'mindmap' keyword.

Example format:
mindmap
  root((Main Topic))
    Branch 1
      Sub item A
      Sub item B
    Branch 2
      Sub item C
"""

def build_mindmap_prompt(content: str, title: Optional[str] = None) -> str:
    """Build prompt for mind map generation."""
    prompt = MINDMAP_PROMPT.format(content=content.strip())
    if title:
        prompt += f"\n\nUse '{title}' as the root node label."
    return prompt


def parse_mindmap_response(response: str) -> str:
    """Clean and validate Mermaid mindmap output."""
    # Remove code fences if present
    response = re.sub(r'^```(?:mermaid)?\n?', '', response.strip())
    response = re.sub(r'\n?```$', '', response)
    
    # Ensure it starts with mindmap
    if not response.strip().startswith('mindmap'):
        response = 'mindmap\n' + response
    
    return response.strip()


# ============================================================
# SLIDE DECK GENERATION
# ============================================================

SLIDES_PROMPT = """
You are creating a professional presentation for Evolution Stables.
Transform the content into a slide deck structure.

Rules:
- Create 5-8 slides maximum
- Each slide has: title (5 words max), bullet points (3-4 max), optional speaker notes
- First slide is title slide
- Last slide is summary/call-to-action
- Use Evolution Stables brand voice: understated authority, clear, direct
- No hype words, no exclamation marks

Content:
\"\"\"
{content}
\"\"\"

Return valid JSON array with this structure:
[
  {{
    "slide_number": 1,
    "type": "title",
    "title": "Slide Title",
    "subtitle": "Optional subtitle",
    "bullets": [],
    "notes": "Speaker notes here"
  }},
  {{
    "slide_number": 2,
    "type": "content",
    "title": "Content Slide",
    "bullets": ["Point 1", "Point 2", "Point 3"],
    "notes": "Speaker notes"
  }}
]

Return ONLY the JSON array, no explanation.
"""

def build_slides_prompt(content: str, title: Optional[str] = None) -> str:
    """Build prompt for slide deck generation."""
    prompt = SLIDES_PROMPT.format(content=content.strip())
    if title:
        prompt += f"\n\nPresentation title: '{title}'"
    return prompt


def parse_slides_response(response: str) -> List[Dict[str, Any]]:
    """Parse and validate slides JSON."""
    # Remove code fences
    response = re.sub(r'^```(?:json)?\n?', '', response.strip())
    response = re.sub(r'\n?```$', '', response)
    
    try:
        slides = json.loads(response)
        if isinstance(slides, list):
            return slides
    except json.JSONDecodeError:
        pass
    
    # Return default error slide
    return [{"slide_number": 1, "type": "error", "title": "Error parsing slides", "bullets": ["Could not generate presentation"]}]


def render_slides_html(slides: List[Dict[str, Any]], title: str = "Presentation") -> str:
    """Render slides to standalone HTML using Reveal.js CDN."""
    slides_html = ""
    
    for slide in slides:
        slide_type = slide.get("type", "content")
        slide_title = slide.get("title", "")
        subtitle = slide.get("subtitle", "")
        bullets = slide.get("bullets", [])
        
        if slide_type == "title":
            slides_html += f"""
            <section>
                <h1>{slide_title}</h1>
                {f'<h3>{subtitle}</h3>' if subtitle else ''}
            </section>
            """
        else:
            bullets_html = "\n".join([f"<li>{b}</li>" for b in bullets])
            slides_html += f"""
            <section>
                <h2>{slide_title}</h2>
                <ul>{bullets_html}</ul>
            </section>
            """
    
    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{title}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.5.0/reveal.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.5.0/theme/white.min.css">
    <style>
        .reveal h1, .reveal h2, .reveal h3 {{ color: #1a1a2e; }}
        .reveal {{ font-family: system-ui, -apple-system, sans-serif; }}
        .reveal ul {{ text-align: left; }}
        .reveal li {{ margin: 0.5em 0; }}
    </style>
</head>
<body>
    <div class="reveal">
        <div class="slides">
            {slides_html}
        </div>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.5.0/reveal.min.js"></script>
    <script>Reveal.initialize({{ hash: true }});</script>
</body>
</html>"""


# ============================================================
# QUIZ GENERATION
# ============================================================

QUIZ_PROMPT = """
You are creating a knowledge quiz based on the provided content.
Generate questions that test understanding of key concepts.

Rules:
- Create 5-8 questions
- Mix of multiple choice (4 options) and true/false
- Questions should test comprehension, not just recall
- Include the correct answer and brief explanation
- Use clear, professional language

Content:
\"\"\"
{content}
\"\"\"

Return valid JSON array:
[
  {{
    "question_number": 1,
    "type": "multiple_choice",
    "question": "What is...?",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "correct_answer": "B",
    "explanation": "Brief explanation of why B is correct"
  }},
  {{
    "question_number": 2,
    "type": "true_false",
    "question": "Statement to evaluate",
    "correct_answer": "True",
    "explanation": "Why this is true/false"
  }}
]

Return ONLY the JSON array.
"""

def build_quiz_prompt(content: str) -> str:
    """Build prompt for quiz generation."""
    return QUIZ_PROMPT.format(content=content.strip())


def parse_quiz_response(response: str) -> List[Dict[str, Any]]:
    """Parse quiz JSON response."""
    response = re.sub(r'^```(?:json)?\n?', '', response.strip())
    response = re.sub(r'\n?```$', '', response)
    
    try:
        quiz = json.loads(response)
        if isinstance(quiz, list):
            return quiz
    except json.JSONDecodeError:
        pass
    
    return [{"question_number": 1, "type": "error", "question": "Could not generate quiz"}]


# ============================================================
# FLASHCARD GENERATION
# ============================================================

FLASHCARD_PROMPT = """
Create study flashcards from the provided content.
Each card should test one key concept or fact.

Rules:
- Create 8-12 flashcards
- Front: Question or term (concise)
- Back: Answer or definition (1-2 sentences)
- Focus on the most important concepts
- Use clear, memorable language

Content:
\"\"\"
{content}
\"\"\"

Return valid JSON array:
[
  {{
    "card_number": 1,
    "front": "Question or term",
    "back": "Answer or definition",
    "category": "Optional category"
  }}
]

Return ONLY the JSON array.
"""

def build_flashcard_prompt(content: str) -> str:
    """Build prompt for flashcard generation."""
    return FLASHCARD_PROMPT.format(content=content.strip())


def parse_flashcard_response(response: str) -> List[Dict[str, Any]]:
    """Parse flashcard JSON response."""
    response = re.sub(r'^```(?:json)?\n?', '', response.strip())
    response = re.sub(r'\n?```$', '', response)
    
    try:
        cards = json.loads(response)
        if isinstance(cards, list):
            return cards
    except json.JSONDecodeError:
        pass
    
    return [{"card_number": 1, "front": "Error", "back": "Could not generate flashcards"}]


# ============================================================
# AUDIO OVERVIEW (Script Generation)
# ============================================================

AUDIO_SCRIPT_PROMPT = """
Create a podcast-style audio script summarizing the content.
This will be read aloud by a text-to-speech system.

Rules:
- Write for spoken word (natural, conversational)
- 2-3 minutes reading time (300-450 words)
- Start with a hook/introduction
- Cover 3-4 main points
- End with a summary/takeaway
- Use Evolution Stables brand voice: confident but not arrogant
- Avoid jargon; explain terms if needed
- Include natural pauses (marked with [pause])

Content:
\"\"\"
{content}
\"\"\"

Return the script as plain text, ready to be spoken.
Do NOT include stage directions other than [pause].
"""

def build_audio_script_prompt(content: str, title: Optional[str] = None) -> str:
    """Build prompt for audio script generation."""
    prompt = AUDIO_SCRIPT_PROMPT.format(content=content.strip())
    if title:
        prompt += f"\n\nTopic title: '{title}'"
    return prompt


def parse_audio_script_response(response: str) -> str:
    """Clean audio script response."""
    # Remove any code fences
    response = re.sub(r'^```\n?', '', response.strip())
    response = re.sub(r'\n?```$', '', response)
    return response.strip()


# ============================================================
# REPORT GENERATION
# ============================================================

REPORT_PROMPT = """
Generate a professional report from the provided content.
This should be a structured document suitable for stakeholders.

Rules:
- Include: Executive Summary, Key Findings, Details, Recommendations
- Use Evolution Stables brand voice: understated authority
- Be factual and evidence-based
- No hype or marketing language
- Use clear section headings
- Include bullet points for key data

Content:
\"\"\"
{content}
\"\"\"

Return a structured report in Markdown format.
"""

def build_report_prompt(content: str, title: Optional[str] = None) -> str:
    """Build prompt for report generation."""
    prompt = REPORT_PROMPT.format(content=content.strip())
    if title:
        prompt += f"\n\nReport title: '{title}'"
    return prompt


def parse_report_response(response: str) -> str:
    """Clean report response."""
    response = re.sub(r'^```(?:markdown)?\n?', '', response.strip())
    response = re.sub(r'\n?```$', '', response)
    return response.strip()


# ============================================================
# INFOGRAPHIC GENERATION
# ============================================================

INFOGRAPHIC_PROMPT = """
Analyze the content and extract key statistics, metrics, and data points.
Structure this data for visual infographic charts.

Rules:
- Extract 3-5 key metrics or data points
- Create appropriate chart configurations (bar, pie, line, or stat cards)
- Use clear, concise labels
- Include a headline and summary
- Numbers should be realistic and derived from the content
- If no numbers exist, create meaningful categorical comparisons

Content:
\"\"\"
{content}
\"\"\"

Return valid JSON with this structure:
{{
  "title": "Infographic headline",
  "summary": "One sentence summary",
  "charts": [
    {{
      "type": "bar",
      "title": "Chart title",
      "data": {{
        "labels": ["Label 1", "Label 2", "Label 3"],
        "values": [75, 50, 25],
        "colors": ["#3B82F6", "#10B981", "#F59E0B"]
      }}
    }},
    {{
      "type": "pie",
      "title": "Distribution",
      "data": {{
        "labels": ["Category A", "Category B"],
        "values": [60, 40],
        "colors": ["#6366F1", "#EC4899"]
      }}
    }},
    {{
      "type": "stat",
      "title": "Key Metric",
      "value": "85%",
      "subtitle": "Description of metric",
      "trend": "up"
    }}
  ],
  "key_points": ["Point 1", "Point 2", "Point 3"]
}}

Chart types available: "bar", "pie", "line", "stat" (single metric card)
Return ONLY valid JSON.
"""

def build_infographic_prompt(content: str, title: Optional[str] = None) -> str:
    """Build prompt for infographic generation."""
    prompt = INFOGRAPHIC_PROMPT.format(content=content.strip())
    if title:
        prompt += f"\n\nTopic: '{title}'"
    return prompt


def parse_infographic_response(response: str) -> Dict[str, Any]:
    """Parse infographic JSON response."""
    response = re.sub(r'^```(?:json)?\n?', '', response.strip())
    response = re.sub(r'\n?```$', '', response)
    
    try:
        data = json.loads(response)
        if isinstance(data, dict) and "charts" in data:
            return data
    except json.JSONDecodeError:
        pass
    
    # Fallback
    return {
        "title": "Infographic",
        "summary": "Could not generate infographic data",
        "charts": [],
        "key_points": []
    }


# ============================================================
# STUDIO OUTPUT TYPES
# ============================================================

STUDIO_TYPES = {
    "mindmap": {
        "name": "Mind Map",
        "description": "Visual concept map of key ideas",
        "icon": "🗺️",
        "build_prompt": build_mindmap_prompt,
        "parse_response": parse_mindmap_response,
    },
    "slides": {
        "name": "Slide Deck",
        "description": "Presentation slides from content",
        "icon": "📊",
        "build_prompt": build_slides_prompt,
        "parse_response": parse_slides_response,
    },
    "quiz": {
        "name": "Quiz",
        "description": "Knowledge check questions",
        "icon": "❓",
        "build_prompt": build_quiz_prompt,
        "parse_response": parse_quiz_response,
    },
    "flashcards": {
        "name": "Flashcards",
        "description": "Study cards for key concepts",
        "icon": "🃏",
        "build_prompt": build_flashcard_prompt,
        "parse_response": parse_flashcard_response,
    },
    "audio_script": {
        "name": "Audio Overview",
        "description": "Podcast-style script for TTS",
        "icon": "🎙️",
        "build_prompt": build_audio_script_prompt,
        "parse_response": parse_audio_script_response,
    },
    "report": {
        "name": "Report",
        "description": "Structured stakeholder report",
        "icon": "📄",
        "build_prompt": build_report_prompt,
        "parse_response": parse_report_response,
    },
    "infographic": {
        "name": "Infographic",
        "description": "Visual charts and statistics",
        "icon": "📈",
        "build_prompt": build_infographic_prompt,
        "parse_response": parse_infographic_response,
    },
}

def get_studio_types() -> Dict[str, Dict[str, str]]:
    """Get available studio output types for UI."""
    return {
        key: {
            "name": val["name"],
            "description": val["description"],
            "icon": val["icon"],
        }
        for key, val in STUDIO_TYPES.items()
    }
