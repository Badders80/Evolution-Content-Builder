"""
Evolution Content Builder — FastAPI Backend

This module serves as the API layer for the Evolution Content Builder.
It is responsible ONLY for:
- API endpoints for content analysis and generation
- LLM orchestration (Gemini, OpenAI)
- Static asset serving
- HTML/PDF generation from structured content

It MUST NOT:
- Define brand rules (those live in /config)
- Make UI decisions (those belong in the React frontend)
- Store state between requests (stateless API design)

All brand rules, templates, and schemas are loaded from /config via lib/prompts.py.
See BUILD_PHILOSOPHY.md for complete architectural guidance.
"""
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from PIL import Image
import io
import base64
import re
import os
import json
import requests
from lib.prompts import build_prompt, build_stage1_prompt
# Temporarily disabled due to version conflicts
# import torch
# from diffusers import DiffusionPipeline

# LLM Integrations
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("OpenAI not installed. Run: pip install openai")

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("Google Generative AI not installed. Run: pip install google-generativeai")
import asyncio
from typing import Any, Dict, List, Optional

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:5176",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directories
if os.path.exists("assets"):
    app.mount("/assets", StaticFiles(directory="assets"), name="assets")

# Mount React build static assets (production)
if os.path.exists("builder-ui/dist/static"):
    app.mount("/static", StaticFiles(directory="builder-ui/dist/static"), name="react-static")

# API Keys (will be set from environment or config)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
COMFY_URL = os.getenv("COMFY_URL", "http://127.0.0.1:8188")

# Configure APIs if keys are available
if OPENAI_AVAILABLE and OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY
    print("✅ OpenAI API configured")

# Configure Gemini
if GEMINI_AVAILABLE and GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    print("✅ Gemini API configured (gemini-3-pro-preview)")

# Load taglines
TAGLINES = []
if os.path.exists('lib/taglines.json'):
    with open('lib/taglines.json') as f:
        TAGLINES = json.load(f)

# AI Pipeline (lazy load) - Temporarily disabled
# ai_pipeline: Optional[DiffusionPipeline] = None

def get_ai_pipeline():
    # Temporarily disabled - ComfyUI integration not yet implemented
    raise NotImplementedError("Image generation via ComfyUI is not yet implemented")

TEMPLATES = {
    "pre-race": {
        "style": "70% visual poster",
        "structure": "hero banner + dates + odds",
        "display_name": "Pre-Race Update"
    },
    "upcoming-race": {
        "style": "teaser",
        "structure": "condition updates + CTA",
        "display_name": "Upcoming Race"
    },
    "trainer-update": {
        "style": "quotes cards",
        "structure": "fitness insights",
        "display_name": "Trainer Update"
    },
    "post-race": {
        "style": "report",
        "structure": "recap + quotes + next steps",
        "display_name": "Post-Race Report"
    }
}

STOPWORDS = {
    "the", "and", "or", "a", "an", "to", "of", "in", "for", "on", "with", "at",
    "by", "from", "up", "about", "into", "over", "after", "is", "it", "as", "be",
    "are", "was", "were", "this", "that", "those", "these", "can", "will", "just",
    "than", "then", "but", "so", "if", "out", "not", "no", "we", "you", "our",
    "their", "they", "them", "he", "she", "his", "her", "its", "i", "me", "my"
}


def tokenize_words(text: str) -> list[str]:
    return re.findall(r"[A-Za-z']+", text.lower())


def compute_readability_band(word_count: int) -> str:
    if word_count < 60:
        return "very short"
    if word_count < 160:
        return "good length"
    if word_count < 300:
        return "long"
    return "very long"


def compute_readability_band_stage1(word_count: int) -> str:
    if word_count < 80:
        return "very_short"
    if word_count < 220:
        return "good"
    return "long"


def extract_keywords(text: str, limit: int = 10) -> list[str]:
    words = tokenize_words(text)
    freq: dict[str, int] = {}
    for word in words:
        if len(word) <= 3 or word in STOPWORDS:
            continue
        freq[word] = freq.get(word, 0) + 1
    sorted_words = sorted(freq.items(), key=lambda item: (-item[1], -len(item[0]), item[0]))
    return [w for w, _ in sorted_words[:limit]]


def normalize_structured_content(payload: Dict[str, Any], preset: str) -> Dict[str, Any]:
    base = {
        "preset": preset,
        "headline": "",
        "subheadline": "",
        "body": [],
        "key_points": [],
        "quote": "",
        "quote_by": "",
        "social_caption": "",
        "cta": "",
    }

    body = payload.get("body", [])
    if isinstance(body, str):
        body = [body]
    base["body"] = [p.strip() for p in body if p and str(p).strip()]

    key_points = payload.get("key_points", [])
    if isinstance(key_points, str):
        key_points = [key_points]
    base["key_points"] = [kp.strip() for kp in key_points if kp and str(kp).strip()]

    for key in ["headline", "subheadline", "quote", "quote_by", "social_caption", "cta"]:
        value = payload.get(key, "")
        base[key] = value.strip() if isinstance(value, str) else str(value) if value is not None else ""

    return base


def stub_structured_content(raw_text: str, preset: str) -> Dict[str, Any]:
    cleaned = raw_text.strip()
    paragraphs = [p.strip() for p in cleaned.split("\n\n") if p.strip()]
    if not paragraphs and cleaned:
        paragraphs = [cleaned]
    elif not paragraphs:
        paragraphs = ["Content pending."]

    headline = f"{preset.replace('-', ' ').title()} update"
    subheadline_seed = paragraphs[0] if paragraphs else ""
    subheadline = subheadline_seed[:120] + ("..." if len(subheadline_seed) > 120 else "")

    content = {
        "preset": preset,
        "headline": headline,
        "subheadline": subheadline,
        "body": paragraphs[:3],
        "key_points": paragraphs[:3],
        "quote": "",
        "quote_by": "",
        "social_caption": subheadline_seed[:140],
        "cta": "Follow for the full update soon.",
    }
    return normalize_structured_content(content, preset)


def parse_structured_response(model_output: str, preset: str, raw_text: str) -> Dict[str, Any]:
    cleaned = model_output.strip()
    if "```json" in cleaned:
        try:
            cleaned = cleaned.split("```json", 1)[1].split("```", 1)[0]
        except IndexError:
            pass
    elif "```" in cleaned:
        try:
            cleaned = cleaned.split("```", 1)[1].split("```", 1)[0]
        except IndexError:
            pass

    try:
        parsed = json.loads(cleaned)
        return normalize_structured_content(parsed, preset)
    except Exception as exc:
        print(f"Structured parse failed: {exc}")
        return stub_structured_content(raw_text, preset)


async def generate_with_gemini(prompt: str) -> str:
    model = genai.GenerativeModel("gemini-3-pro-preview")
    response = await asyncio.to_thread(model.generate_content, prompt)
    return response.text or ""


def build_stage1_stub(raw_text: str, preset: str, audience: str, tone: str, length: str) -> Dict[str, Any]:
    tokens = tokenize_words(raw_text)
    paragraphs = [p.strip() for p in raw_text.strip().split("\n\n") if p.strip()]
    if not paragraphs:
        paragraphs = ["Content pending."]

    sections = []
    for idx, para in enumerate(paragraphs):
        sections.append(
            {
                "id": f"sec-{idx+1}",
                "heading": f"Section {idx+1}",
                "body": para,
            }
        )

    keywords = extract_keywords(raw_text, limit=8)
    meta = {
        "word_count": len(tokens),
        "readability_band": compute_readability_band_stage1(len(tokens)),
        "keywords": keywords,
    }

    return {
        "preset": preset,
        "audience": audience,
        "tone": tone,
        "length": length,
        "headline": sections[0]["heading"] if sections else "",
        "subheadline": sections[0]["body"][:140] if sections else "",
        "sections": sections,
        "quote": "",
        "quote_by": "",
        "key_points": [s["body"][:120] for s in sections[:3]],
        "social_caption": sections[0]["body"][:180] if sections else "",
        "meta": meta,
        "source": "stub",
    }


def parse_stage1_response(model_output: str, preset: str, audience: str, tone: str, length: str, raw_text: str) -> Dict[str, Any]:
    cleaned = model_output.strip()
    if "```json" in cleaned:
        try:
            cleaned = cleaned.split("```json", 1)[1].split("```", 1)[0]
        except IndexError:
            pass
    elif "```" in cleaned:
        try:
            cleaned = cleaned.split("```", 1)[1].split("```", 1)[0]
        except IndexError:
            pass

    try:
        parsed = json.loads(cleaned)
        # normalize expected keys
        parsed.setdefault("preset", preset)
        parsed.setdefault("audience", audience)
        parsed.setdefault("tone", tone)
        parsed.setdefault("length", length)
        parsed.setdefault("sections", [])
        parsed.setdefault("key_points", [])
        parsed.setdefault("meta", {})
        if isinstance(parsed.get("sections"), dict):
            parsed["sections"] = [parsed["sections"]]
        return parsed
    except Exception as exc:
        print(f"Stage1 parse failed: {exc}")
        return build_stage1_stub(raw_text, preset, audience, tone, length)


def polish_content(raw_text: str, llm_choice: str, template_type: str) -> dict:
    """
    Polish raw content using selected LLM.
    Returns: {
        'headline': str,
        'subheadline': str,
        'body': str,
        'polished': bool
    }
    """
    # Brand Bible v2.2 Nov2025 - Complete Guidelines
    brand_tone = """
    EVOLUTION STABLES BRAND BIBLE v2.2
    
    VOICE: Understated Authority
    - Declarative confidence (we prove, not shout)
    - Speak from established leadership position
    - Inform without arrogance, educate without lecturing
    - Trusted insider tone (racing purist + digital investor)
    
    WRITING PRINCIPLES:
    1. Clear & Direct - Speak plainly, no jargon
    2. Confident but Calm - Authority from knowledge, not volume
    3. Human & Relatable - Write for people, not algorithms
    4. Visionary but Grounded - Pair ambition with evidence
    5. Refined Storytelling - Every sentence earns its place
    
    BRAND VALUES:
    - Flexible: Adaptable without losing identity
    - Confident: Strength through substance, not noise
    - Clear: Simplicity builds trust
    - Human: Technology serves people
    - Progressive: Forward-looking by necessity
    
    BRAND BRIDGES (use when appropriate):
    - "At Evolution, access should be as equal as the track—same rules, same opportunity."
    - "Technology moves fast. We move with purpose—bridging regulation and real-world ownership."
    - "The sport's legacy is centuries old. Its next chapter is written in code."
    - "From paddocks to protocols—ownership, evolved."
    - "Because real ownership means everyone gets a way in."
    
    TONE: Calm, measured, intelligent, quietly proud of roots
    """
    
    prompt = f"""Transform this raw race update into a polished investor report following the Evolution Stables Brand Bible.

{brand_tone}

Template Type: {template_type}
Structure: Use 4MAT framework (Why, What, How, What If)

Raw Content:
{raw_text}

Return a structured response with:
1. Headline (4-6 words MAX, punchy and specific - e.g. "First Gear Shows Promise" not "First Gear demonstrates resilience in sharp educational run at Wanganui Racecourse")
2. Subheadline (12-18 words, context and key insight)
3. Body (3-4 paragraphs, investor-focused, data-driven)
4. Quote (if any quotes from trainers/jockeys are mentioned, extract ONE key quote)
5. Quote Attribution (name of person who said the quote)

Format as JSON:
{{
    "headline": "...",
    "subheadline": "...",
    "body": "...",
    "quote": "..." (or null if no quote),
    "quote_by": "..." (or null if no quote)
}}
"""
    
    try:
        if llm_choice == 'openai' and OPENAI_AVAILABLE and OPENAI_API_KEY:
            print("Polishing with OpenAI GPT-4...")
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a professional content writer for Evolution Stables, a premium horse racing syndicate. Transform raw updates into polished investor reports."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            content = response.choices[0].message.content
            
            # Try to parse JSON response
            try:
                result = json.loads(content)
                return {
                    'headline': result.get('headline', ''),
                    'subheadline': result.get('subheadline', ''),
                    'body': result.get('body', ''),
                    'polished': True
                }
            except json.JSONDecodeError:
                # Fallback: use raw response
                return {
                    'headline': '',
                    'subheadline': '',
                    'body': content,
                    'polished': True
                }
        
        elif llm_choice == 'gemini' and GEMINI_AVAILABLE and GEMINI_API_KEY:
            print("Polishing with Google Gemini (gemini-3-pro-preview)...")
            model = genai.GenerativeModel('gemini-3-pro-preview')
            response = model.generate_content(prompt)
            content = response.text
            
            # Try to parse JSON response (handle markdown code blocks)
            try:
                # Remove markdown code blocks if present
                if '```json' in content:
                    content = content.split('```json')[1].split('```')[0].strip()
                elif '```' in content:
                    content = content.split('```')[1].split('```')[0].strip()
                
                result = json.loads(content)
                return {
                    'headline': result.get('headline', ''),
                    'subheadline': result.get('subheadline', ''),
                    'body': result.get('body', ''),
                    'quote': result.get('quote'),
                    'quote_by': result.get('quote_by'),
                    'polished': True
                }
            except (json.JSONDecodeError, IndexError) as e:
                print(f"JSON parse error: {e}, using raw content")
                return {
                    'headline': '',
                    'subheadline': '',
                    'body': content,
                    'quote': None,
                    'quote_by': None,
                    'polished': True
                }
        
        elif llm_choice in ['grok', 'openai', 'local']:
            # Offline options - coming soon
            print(f"{llm_choice.upper()} selected - Offline (Coming Soon)")
            offline_messages = {
                'grok': 'Grok API integration coming soon. Visit https://x.ai/api for details.',
                'openai': 'OpenAI GPT-4 integration available. Add your API key to activate.',
                'local': 'Local LLM (offline) integration coming soon. Will support Llama, Mistral, etc.'
            }
            return {
                'headline': f'{llm_choice.upper()} - Offline',
                'subheadline': 'Feature coming soon',
                'body': offline_messages.get(llm_choice, raw_text),
                'polished': False
            }
        
        else:
            # No LLM or not configured
            print(f"No LLM polish applied (choice: {llm_choice})")
            return {
                'headline': '',
                'subheadline': '',
                'body': raw_text,
                'polished': False
            }
    
    except Exception as e:
        print(f"LLM polish failed: {e}")
        return {
            'headline': '',
            'subheadline': '',
            'body': raw_text,
            'polished': False
        }

class AnalyzeRequest(BaseModel):
    text: str


class SuggestRequest(BaseModel):
    text: str
    field: str
    tone: float
    temperature: float
    target_words: int


class EditAnalyzeRequest(BaseModel):
    text: str


class RewriteRequest(BaseModel):
    raw_text: str
    preset: str
    tone: Optional[float] = 50
    length: Optional[str] = "standard"
    audience: Optional[str] = "owner"
    style_flags: Optional[List[str]] = None


class Stage1AnalyzeRequest(BaseModel):
    text: str


class Stage1Section(BaseModel):
    id: str
    heading: str
    body: str


class Stage1Content(BaseModel):
    preset: str
    audience: str
    tone: str
    length: str
    headline: str
    subheadline: str
    sections: List[Stage1Section]
    quote: str
    quote_by: str
    key_points: List[str]
    social_caption: str
    meta: dict
    source: Optional[str] = None
    error: Optional[str] = None
    message: Optional[str] = None


class Stage1RewriteRequest(BaseModel):
    preset: str = Field(..., description="pre_race | post_race | race_announcement | trainer_update")
    audience: str = Field(..., description="investor | owner | social | mixed")
    tone: str = Field(..., description="formal | balanced | conversational")
    length: str = Field(..., description="short | standard | long")
    raw_text: str


@app.post("/edit/analyze")
async def edit_analyze(req: EditAnalyzeRequest):
    """Analyze text for length, readability band, and basic keywords."""
    text = req.text or ""
    tokens = tokenize_words(text)
    word_count = len(tokens)
    readability_band = compute_readability_band(word_count)
    keywords = extract_keywords(text, limit=10)

    return {
        "word_count": word_count,
        "readability_band": readability_band,
        "keywords": keywords,
    }


@app.post("/edit/rewrite")
async def edit_rewrite(req: RewriteRequest):
    """Rewrite raw text into structured content using Gemini (or a deterministic stub)."""
    preset = (req.preset or "trainer-update").strip().lower()
    prompt = build_prompt(
        preset,
        req.raw_text,
        tone=req.tone,
        length=req.length,
        audience=req.audience,
        style_flags=req.style_flags,
    )

    if not GEMINI_AVAILABLE or not GEMINI_API_KEY:
        fallback = stub_structured_content(req.raw_text, preset)
        return {
            **fallback,
            "source": "stub",
            "message": "Gemini not configured; returning deterministic stub.",
        }

    try:
        model_output = await generate_with_gemini(prompt)
        structured = parse_structured_response(model_output, preset, req.raw_text)
        return {**structured, "source": "gemini"}
    except Exception as exc:
        print(f"Gemini rewrite failed: {exc}")
        fallback = stub_structured_content(req.raw_text, preset)
        return JSONResponse(
            status_code=502,
            content={
                **fallback,
                "source": "stub",
                "error": "gemini_rewrite_failed",
                "message": "Gemini rewrite failed; returning fallback content.",
            },
        )


@app.post("/stage1/analyse")
async def stage1_analyse(req: Stage1AnalyzeRequest):
    text = req.text or ""
    tokens = tokenize_words(text)
    word_count = len(tokens)
    readability_band = compute_readability_band_stage1(word_count)
    keywords = extract_keywords(text, limit=10)
    return {
        "word_count": word_count,
        "readability_band": readability_band,
        "keywords": keywords,
        "suggestions": [],
    }


@app.post("/stage1/rewrite", response_model=Stage1Content)
async def stage1_rewrite(req: Stage1RewriteRequest):
    preset = req.preset
    audience = req.audience
    tone = req.tone
    length = req.length

    prompt = build_stage1_prompt(
        preset=preset,
        raw_text=req.raw_text,
        audience=audience,
        tone=tone,
        length=length,
    )

    if not GEMINI_AVAILABLE or not GEMINI_API_KEY:
        return build_stage1_stub(req.raw_text, preset, audience, tone, length)

    try:
        model_output = await generate_with_gemini(prompt)
        structured = parse_stage1_response(model_output, preset, audience, tone, length, req.raw_text)
        structured["source"] = "gemini"
        return structured
    except Exception as exc:
        print(f"Stage1 rewrite failed: {exc}")
        fallback = build_stage1_stub(req.raw_text, preset, audience, tone, length)
        fallback["error"] = "gemini_rewrite_failed"
        fallback["message"] = "Gemini rewrite failed; returning fallback content."
        return JSONResponse(status_code=502, content=fallback)


@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    """Analyze text content and return insights."""
    text = req.text or ""
    words = text.split()
    word_count = len(words)
    
    # Simple sentiment analysis based on keywords
    positive_words = ['great', 'excellent', 'amazing', 'fantastic', 'wonderful', 'victory', 'win', 'champion']
    negative_words = ['poor', 'bad', 'terrible', 'loss', 'defeat', 'unfortunate']
    
    text_lower = text.lower()
    positive_count = sum(1 for word in positive_words if word in text_lower)
    negative_count = sum(1 for word in negative_words if word in text_lower)
    
    if positive_count > negative_count:
        sentiment = 'positive'
    elif negative_count > positive_count:
        sentiment = 'negative'
    else:
        sentiment = 'neutral'
    
    # Extract potential keywords (simple approach: words > 5 chars, not too common)
    common_words = {'about', 'there', 'their', 'would', 'could', 'should', 'which', 'these', 'those'}
    keywords = list(set([
        word.strip('.,!?;:').lower() 
        for word in words 
        if len(word) > 5 and word.lower() not in common_words
    ]))[:8]
    
    # Readability assessment
    if word_count < 50:
        readability = 'Very easy to read - quite brief'
    elif word_count < 150:
        readability = 'Easy to read - good length'
    elif word_count < 300:
        readability = 'Moderate - slightly lengthy'
    else:
        readability = 'Complex - quite long'
    
    return {
        "sentiment": sentiment,
        "keywords": keywords,
        "wordCount": word_count,
        "readability": readability,
        "suggestions": []
    }


@app.post("/suggest")
async def suggest(req: SuggestRequest):
    """Generate content suggestions using Gemini API."""
    text = req.text or ""
    field = req.field or "body"
    tone = req.tone
    temperature = req.temperature
    target_words = req.target_words
    
    # Use Gemini if available
    if GEMINI_AVAILABLE and GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel('gemini-2.0-flash-exp')
            
            tone_desc = "formal and professional" if tone < 0.4 else "casual and friendly" if tone > 0.7 else "balanced"
            
            prompt = f"""Generate a {field} for Evolution Stables racing content.
            
Tone: {tone_desc}
Target length: approximately {target_words} words
Context: {text[:200] if text else 'Racing and horse training content'}

Requirements:
- Use Evolution Stables brand voice (premium, elegant, exciting)
- Focus on racing excellence and champion horses
- Keep it engaging and professional

Generate only the {field} text, no explanations."""

            response = model.generate_content(
                prompt,
                generation_config={
                    'temperature': temperature,
                    'max_output_tokens': target_words * 2,
                }
            )
            
            generated_text = response.text.strip()
            
            return {
                "headline": generated_text if field == "headline" else None,
                "body": generated_text if field == "body" else None,
                "subheadline": generated_text if field == "subheadline" else None,
                "polished": True
            }
        except Exception as e:
            print(f"Gemini suggestion failed: {e}")
            return {
                "headline": f"Sample {field} (Gemini unavailable)",
                "body": "AI generation temporarily unavailable. Please check API configuration.",
                "polished": False
            }
    else:
        # Fallback response
        return {
            "headline": f"Sample {field} for Evolution Stables",
            "body": "Configure Gemini API key to enable AI-powered suggestions.",
            "polished": False
        }


@app.get("/")
async def index():
    """Redirect to React frontend. In production, serve built dist instead."""
    # Check if React build exists (production)
    dist_index = "builder-ui/dist/index.html"
    if os.path.exists(dist_index):
        with open(dist_index) as f:
            return HTMLResponse(f.read())
    # Development: redirect to Vite dev server
    return RedirectResponse(url="http://localhost:5173", status_code=302)

@app.get("/api/taglines")
async def get_taglines():
    return {"taglines": TAGLINES}

@app.get("/api/assets")
async def get_assets():
    assets = []
    if os.path.exists("assets"):
        for filename in os.listdir("assets"):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.svg', '.webp')):
                assets.append(f"/assets/{filename}")
    return {"assets": assets}

@app.post("/api/generate")
async def generate(
    inputs: str = Form(""),
    structured: str = Form(None),
    assets: str = Form(""),
    tagline: str = Form(""),
    suggestions: str = Form(""),
    template: str = Form(""),
    llm: str = Form("none"),
    files: list[UploadFile] = File(None)
):
    # Process inputs
    content = inputs
    structured_payload = None
    if structured:
        try:
            structured_payload = json.loads(structured)
        except json.JSONDecodeError:
            structured_payload = None
    if structured_payload is not None and not isinstance(structured_payload, dict):
        structured_payload = None
    
    # Process selected assets
    selected_assets = [a.strip() for a in assets.split(',') if a.strip()]
    
    # Process uploaded files and extract info
    uploaded_images = []
    if files:
        for file in files:
            if file.content_type and file.content_type.startswith('image'):
                # Save uploaded image
                img_data = await file.read()
                img = Image.open(io.BytesIO(img_data))
                
                # Convert to base64 for embedding
                buffered = io.BytesIO()
                img.save(buffered, format="PNG")
                img_b64 = base64.b64encode(buffered.getvalue()).decode()
                
                uploaded_images.append({
                    'filename': file.filename,
                    'data': f"data:image/png;base64,{img_b64}",
                    'type': 'jockey' if 'jockey' in file.filename.lower() else 'horse' if 'horse' in file.filename.lower() else 'general'
                })
    
    preset_from_payload = structured_payload.get("preset") if structured_payload else None

    # Use selected template, provided preset, or auto-classify
    if preset_from_payload and preset_from_payload in TEMPLATES:
        template_key = preset_from_payload
    elif template and template in TEMPLATES:
        template_key = template
    else:
        # Auto-classify template based on keywords
        content_lower = content.lower()
        if "odds" in content_lower or "betting" in content_lower:
            template_key = "pre-race"
        elif "finish" in content_lower or "result" in content_lower:
            template_key = "post-race"
        elif "quote" in content_lower or "trainer" in content_lower:
            template_key = "trainer-update"
        else:
            template_key = "upcoming-race"
    
    template = TEMPLATES[template_key]
    
    llm_headline = ""
    llm_subheadline = ""
    llm_quote = None
    llm_quote_by = None

    if structured_payload:
        body_from_payload = structured_payload.get("body", [])
        if isinstance(body_from_payload, str):
            body_from_payload = [body_from_payload]
        body_text = "\n\n".join(body_from_payload) if body_from_payload else content
        content = body_text
        llm_headline = structured_payload.get("headline", "") or ""
        llm_subheadline = structured_payload.get("subheadline", "") or ""
        llm_quote = structured_payload.get("quote") or None
        llm_quote_by = structured_payload.get("quote_by") or None
    else:
        # LLM Content Polishing
        polished_result = polish_content(content, llm, template_key)
        
        # Use polished content if available
        if polished_result['polished'] and polished_result['body']:
            content = polished_result['body']
            llm_headline = polished_result['headline']
            llm_subheadline = polished_result['subheadline']
            llm_quote = polished_result.get('quote')
            llm_quote_by = polished_result.get('quote_by')
            print(f"Content polished with {llm}")
        else:
            print("Using raw content (no LLM polish)")
    
    # AI image generation with diffusers
    ai_generated_image = None
    if suggestions:  # Only generate if user adds creative direction
        try:
            pipeline = get_ai_pipeline()
            prompt = f"Evolution Racing {template_key.replace('-', ' ')}, {suggestions}, premium minimalist style, black and gold gradient, professional photography, high contrast, elegant"
            negative_prompt = "cartoon, illustration, low quality, blurry, text, watermark"
            
            print(f"Generating AI image with prompt: {prompt}")
            result = pipeline(
                prompt=prompt,
                negative_prompt=negative_prompt,
                num_inference_steps=25,  # Standard SDXL steps
                guidance_scale=7.5,
                height=768,
                width=1024
            )
            
            # Convert to base64
            buffered = io.BytesIO()
            result.images[0].save(buffered, format="PNG")
            ai_generated_image = f"data:image/png;base64,{base64.b64encode(buffered.getvalue()).decode()}"
            print("AI image generated successfully")
        except Exception as e:
            print(f"AI generation failed: {e}")
            ai_generated_image = None
    
    # Build asset HTML - separate header logo from body images
    logo_html = ""
    body_images_html = ""
    
    if selected_assets:
        # Find Evolution Stables logo for header (prioritize "Evolution + Logo")
        header_logo = None
        body_images = []
        
        print(f"DEBUG: Selected assets: {selected_assets}")
        
        for asset in selected_assets:
            asset_lower = asset.lower()
            print(f"DEBUG: Checking asset: {asset} (lower: {asset_lower})")
            # Prioritize "Evolution + Logo" for header
            if 'evolution + logo' in asset_lower or 'evolution+logo' in asset_lower:
                header_logo = asset
                print(f"DEBUG: Found Evolution + Logo: {header_logo}")
            # Fallback: any evolution/stables logo
            elif not header_logo and ('evolution' in asset_lower or 'stables' in asset_lower):
                header_logo = asset
                print(f"DEBUG: Found Evolution fallback: {header_logo}")
            else:
                # Everything else (First Gear, etc.) goes to quote section
                body_images.append(asset)
                print(f"DEBUG: Added to body images: {asset}")
        
        # Set header logo
        if header_logo:
            if not header_logo.startswith('http'):
                logo_url = f"http://localhost:8000{header_logo}"
            else:
                logo_url = header_logo
            logo_html = f'<img src="{logo_url}" alt="Evolution Stables" class="brand-logo">'
        
        # Set quote section images (First Gear logo, etc.)
        quote_section_image = None
        if body_images:
            # Use first image for quote section
            asset = body_images[0]
            if not asset.startswith('http'):
                asset_url = f"http://localhost:8000{asset}"
            else:
                asset_url = asset
            quote_section_image = asset_url 
    
    # Smart headline extraction from content
    # Prioritize LLM-generated headlines
    if llm_headline:
        headline_placeholder = llm_headline
        subheadline_placeholder = llm_subheadline
    else:
        # Fallback to smart extraction
        lines = [l.strip() for l in content.strip().split('\n') if l.strip()]
        headline_placeholder = "Race Update"
        subheadline_placeholder = ""
        
        # Extract headline intelligently
        if lines:
            # Look for key phrases that indicate this is the headline
            first_line = lines[0]
            
            # Check if first line contains race info, location, or result
            if any(keyword in first_line.lower() for keyword in ['race', 'location:', 'result:', 'track:', 'place']):
                # This is race metadata, extract key info for headline
                if 'result:' in first_line.lower():
                    # Extract placement
                    parts = first_line.split('Result:')
                    if len(parts) > 1:
                        result_text = parts[1].strip()
                        headline_placeholder = result_text.split('Post-Race')[0].strip()
                elif 'race' in first_line.lower() and 'location:' in first_line.lower():
                    # Extract race name
                    if 'Race:' in first_line:
                        race_name = first_line.split('Race:')[1].split('Track:')[0].strip()
                        headline_placeholder = f"Race Report: {race_name}"
            else:
                # First line is the headline
                if len(first_line) < 80:
                    headline_placeholder = first_line
                else:
                    # Take first sentence
                    first_sentence = first_line.split('.')[0]
                    headline_placeholder = first_sentence if len(first_sentence) < 80 else "Race Update"
            
            # Get subheadline from second line if it exists and is short
            if len(lines) > 1 and len(lines[1]) < 120:
                subheadline_placeholder = lines[1]
    
    # Split content into paragraphs and extract quotes
    paragraphs = content.split('\n\n') if '\n\n' in content else [content]
    quotes = []
    main_content = []
    
    for p in paragraphs:
        if p.strip():
            # Detect quotes (text in quotes or starting with quote marks)
            if ('"' in p or '"' in p or '"' in p) and len(p) < 200:
                quotes.append(p.strip().replace('"', '').replace('"', '').replace('"', ''))
            else:
                main_content.append(p.strip())
    
    content_html = ''.join([f'<p>{p}</p>' for p in main_content])
    
    # Build dynamic image section with uploaded images
    image_section_html = ""
    if uploaded_images:
        # If we have a jockey/person image, create a quote card
        jockey_img = next((img for img in uploaded_images if img['type'] == 'jockey'), None)
        if jockey_img and quotes:
            image_section_html = f'''
            <div class="image-quote-section">
                <img src="{jockey_img['data']}" alt="Jockey" class="featured-image">
                <div class="quote-overlay">
                    <blockquote>"{quotes[0]}"</blockquote>
                </div>
            </div>
            '''
        else:
            # Just show the uploaded image
            image_section_html = f'<img src="{uploaded_images[0]["data"]}" alt="Uploaded" class="featured-image">'
    elif ai_generated_image:
        image_section_html = f'<img src="{ai_generated_image}" alt="AI generated" class="featured-image">'
    
    # Build HTML output with 4MAT structure and Brand Bible tone
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        @page {{
            size: A4;
            margin: 0;
        }}
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            background: #ffffff;
            color: #000000;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            margin: 0;
            padding: 0;
            width: 210mm;
            min-height: 297mm;
            position: relative;
            overflow-y: auto;
        }}
        .page-container {{
            width: 100%;
            height: 100%;
            padding: 15mm 20mm;
            display: flex;
            flex-direction: column;
        }}
        header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12mm;
            padding-bottom: 5mm;
            border-bottom: 2px solid #000000;
        }}
        .header-left {{
            display: flex;
            align-items: center;
            gap: 15px;
        }}
        .brand-logo {{
            height: 50px;
            width: auto;
            max-width: 300px;
            object-fit: contain;
        }}
        .brand-name {{
            font-family: 'Inter', sans-serif;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.5px;
            text-transform: uppercase;
            color: #000000;
            line-height: 1;
        }}
        .template-type {{
            font-family: 'Inter', sans-serif;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 2.5px;
            text-transform: uppercase;
            color: #000000;
        }}
        main {{
            flex: 1;
            display: flex;
            flex-direction: column;
        }}
        .content-layout {{
            display: grid;
            grid-template-columns: 1fr 80mm;
            gap: 8mm;
            margin-bottom: 8mm;
        }}
        .main-content {{
            min-width: 0;
        }}
        .quote-sidebar {{
            background: #f8f8f8;
            padding: 25px 20px;
            border-left: 3px solid #000000;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 20px;
            min-height: 300px;
        }}
        .quote-logo {{
            width: 120px;
            height: auto;
            object-fit: contain;
        }}
        .quote-sidebar blockquote {{
            font-family: 'Playfair Display', serif;
            font-size: 18px;
            font-style: italic;
            line-height: 1.5;
            color: #000000;
            margin: 0;
            font-weight: 600;
        }}
        .quote-sidebar cite {{
            font-family: 'Inter', sans-serif;
            font-size: 11px;
            font-style: normal;
            color: #666666;
            font-weight: 500;
            text-align: right;
        }}
        .headline {{
            font-family: 'Playfair Display', serif;
            font-size: 52px;
            font-weight: 900;
            line-height: 1.1;
            margin-bottom: 8mm;
            color: #000000;
            letter-spacing: -1px;
        }}
        .subheadline {{
            font-family: 'Playfair Display', serif;
            font-size: 24px;
            font-weight: 600;
            line-height: 1.3;
            margin-bottom: 6mm;
            color: #333333;
            font-style: italic;
        }}
        .content {{
            font-family: 'Inter', sans-serif;
            font-size: 11px;
            line-height: 1.7;
            color: #1a1a1a;
            font-weight: 400;
        }}
        .content p {{
            margin-bottom: 1em;
            break-inside: avoid;
        }}
        .content p:first-letter {{
            font-size: 3em;
            font-weight: 700;
            line-height: 0.8;
            float: left;
            margin: 0.1em 0.1em 0 0;
            font-family: 'Playfair Display', serif;
        }}
        .body-image {{
            width: 100%;
            max-width: 300px;
            height: auto;
            margin: 15px 0;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }}
        .visual-section {{
            width: 100%;
            flex: 1;
            background: #f8f8f8;
            border: 1px solid #e0e0e0;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 6mm 0;
            min-height: 80mm;
            position: relative;
            overflow: hidden;
        }}
        .visual-section::before {{
            content: 'AI-Generated Visual';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-family: 'Inter', sans-serif;
            font-size: 11px;
            color: #999999;
            letter-spacing: 1px;
            text-transform: uppercase;
            z-index: 0;
        }}
        .featured-image {{
            width: 100%;
            height: 100%;
            object-fit: cover;
        }}
        .image-quote-section {{
            width: 100%;
            height: 100%;
            position: relative;
        }}
        .image-quote-section img {{
            width: 100%;
            height: 100%;
            object-fit: cover;
            filter: grayscale(20%);
        }}
        .quote-overlay {{
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%);
            padding: 30px 25px;
        }}
        .quote-overlay blockquote {{
            font-family: 'Playfair Display', serif;
            font-size: 18px;
            font-style: italic;
            color: #ffffff;
            margin: 0;
            line-height: 1.5;
            font-weight: 600;
        }}
        footer {{
            margin-top: auto;
            padding-top: 8mm;
            border-top: 2px solid #000000;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }}
        .footer-hero {{
            text-align: center;
            padding: 15px 0;
        }}
        .footer-hero h2 {{
            font-family: 'Playfair Display', serif;
            font-size: 28px;
            font-weight: 600;
            color: #000000;
            margin: 0 0 8px 0;
            letter-spacing: -0.5px;
        }}
        .footer-hero p {{
            font-family: 'Inter', sans-serif;
            font-size: 9px;
            color: #666666;
            margin: 0;
            font-weight: 400;
        }}
        .footer-bar {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 8px;
            border-top: 1px solid #e0e0e0;
        }}
        .footer-legal {{
            display: flex;
            gap: 12px;
            align-items: center;
            font-family: 'Inter', sans-serif;
            font-size: 8px;
            color: #666666;
        }}
        .footer-legal a {{
            color: #666666;
            text-decoration: none;
            transition: color 0.2s;
        }}
        .footer-legal a:hover {{
            color: #000000;
        }}
        .footer-social {{
            display: flex;
            gap: 12px;
            align-items: center;
        }}
        .footer-social svg {{
            width: 14px;
            height: 14px;
            fill: #666666;
            transition: fill 0.2s;
        }}
        .footer-social a:hover svg {{
            fill: #000000;
        }}
        
        /* Tablet Layout (768px) */
        @media (max-width: 768px) {{
            body {{
                width: 768px;
                height: 1024px;
            }}
            .page-container {{
                padding: 10mm 15mm;
            }}
            .headline {{
                font-size: 42px;
            }}
            .subheadline {{
                font-size: 20px;
            }}
            .content {{
                font-size: 10px;
            }}
            .content-layout {{
                grid-template-columns: 1fr 60mm;
                gap: 6mm;
            }}
            .quote-sidebar blockquote {{
                font-size: 16px;
            }}
        }}
        
        /* Phone Layout (375px) */
        @media (max-width: 375px) {{
            body {{
                width: 375px;
                height: 667px;
            }}
            .page-container {{
                padding: 5mm 10mm;
            }}
            .headline {{
                font-size: 28px;
            }}
            .subheadline {{
                font-size: 16px;
            }}
            .content {{
                font-size: 9px;
            }}
            .content-layout {{
                grid-template-columns: 1fr;
                gap: 4mm;
            }}
            .quote-sidebar {{
                margin-top: 4mm;
                padding: 15px;
            }}
            .quote-sidebar blockquote {{
                font-size: 14px;
            }}
            .brand-logo {{
                height: 35px;
            }}
            .template-type {{
                font-size: 9px;
            }}
        }}
    </style>
</head>
<body>
    <div class="page-container">
        <header>
            <div class="header-left">
                {logo_html if logo_html else '<div class="brand-name">Evolution Stables</div>'}
            </div>
            <div class="template-type">{TEMPLATES.get(template_key, {}).get('display_name', template_key.replace('-', ' ').title())}</div>
        </header>
        
        <main>
            <div class="content-layout">
                <div class="main-content">
                    <h1 class="headline">{headline_placeholder}</h1>
                    <div class="subheadline">{subheadline_placeholder}</div>
                    <div class="content">{content_html}</div>
                </div>
                {'<div class="quote-sidebar">' + (f'<img src="{quote_section_image}" alt="Brand" class="quote-logo">' if quote_section_image else '') + f'<blockquote>"{llm_quote}"</blockquote><cite>— {llm_quote_by}</cite></div>' if llm_quote and llm_quote_by else ('<div class="quote-sidebar">' + (f'<img src="{quote_section_image}" alt="Brand" class="quote-logo">' if quote_section_image else '') + f'<blockquote>"{quotes[0]}"</blockquote></div>' if quotes else '')}
            </div>
            <div class="visual-section">
                {image_section_html if image_section_html else '<span style="color:#999;font-size:11px;z-index:1;">Upload image or add suggestions for AI generation</span>'}
            </div>
        </main>
        
        <footer>
            <div class="footer-hero">
                <h2>The Future of Ownership Has Arrived</h2>
                <p>Digital-Syndication, by Evolution Stables, Powered By Tokinvest</p>
            </div>
            <div class="footer-bar">
                <div class="footer-legal">
                    <span>&copy; 2025 Evolution Stables</span>
                    <a href="#">Privacy Policy</a>
                    <a href="#">Terms of Service</a>
                </div>
                <div class="footer-social">
                    <a href="https://x.com/evostables" target="_blank" aria-label="X">
                        <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                    <a href="https://instagram.com/evostables" target="_blank" aria-label="Instagram">
                        <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </a>
                    <a href="https://www.linkedin.com/in/alex-baddeley/" target="_blank" aria-label="LinkedIn">
                        <svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    </a>
                    <a href="mailto:alex@evolutionstables.nz" aria-label="Email">
                        <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                    </a>
                </div>
            </div>
        </footer>
    </div>
</body>
</html>"""
    
    return JSONResponse({
        "html": html,
        "slug": "update-slug",
        "template": template_key
    })

@app.post("/api/generate_image")
async def generate_image(prompt: str = Form(...)):
    """Separate endpoint for AI image generation"""
    try:
        workflow = {
            "prompt": {
                "3": {
                    "inputs": {"text": prompt},
                    "class_type": "CLIPTextEncode"
                }
            }
        }
        resp = requests.post(f"{COMFY_URL}/prompt", json={"prompt": workflow}, timeout=5)
        return {"status": "queued", "data": resp.json()}
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
