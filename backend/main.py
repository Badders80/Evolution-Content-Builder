"""
Evolution Content Builder - Unified Backend (ONE BACKEND TO RULE THEM ALL)

This is the SINGLE backend that consolidates:
✅ Stage 1: Analyze + Rewrite (Content Builder pipeline)
✅ Seek: Gemini-powered content generation
✅ RAG: Vertex AI Search grounded retrieval
✅ Web: DuckDuckGo news integration
✅ Auth: JWT search tokens
✅ Legacy: /api/generate HTML rendering

Architecture:
- All endpoints live here
- All routers mounted here
- Frontend hits ONE backend (this file)
- No more confusion, no more port conflicts
"""
import os
import google.auth
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import List, Optional
import traceback
import tempfile
import os
from backend.logging_utils import setup_logging, log_event

# Import all routers from modules
from backend.google_seek.router import router as seek_router
from backend.rag.router import router as rag_router
from backend.auth.router import router as auth_router
from backend.web.router import router as web_router

# Import configuration and services
from backend.google_seek.service import (
    DDG_ENABLED,
    DDG_AVAILABLE,
    GEMINI_API_KEY,
    PROJECT_ID,
    DATA_STORE_ID,
)

# Determine if Gemini is available
GEMINI_AVAILABLE = bool(GEMINI_API_KEY or PROJECT_ID)

# Import helper functions from app.py (we're consolidating, not deleting)
# These will be gradually moved into proper modules
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

try:
    from app import (
        tokenize_words,
        compute_readability_band,
        extract_keywords,
        build_prompt,
        generate_with_gemini,
        parse_structured_response,
        stub_structured_content,
        build_stage1_prompt,
        parse_stage1_response,
        build_stage1_stub,
        compute_readability_band_stage1,
    )
    APP_HELPERS_AVAILABLE = True
except ImportError:
    APP_HELPERS_AVAILABLE = False
    print("⚠️ Warning: Could not import helpers from app.py. Some endpoints will use stubs.")

# ============================================================================
# FASTAPI APP INITIALIZATION
# ============================================================================

app = FastAPI(
    title="Evolution Content Builder - Unified API",
    description="Single backend for Content Builder, Seek, RAG, and Web integration",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)
setup_logging()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "*",  # TODO: Restrict in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static assets
if os.path.exists("assets"):
    app.mount("/assets", StaticFiles(directory="assets"), name="assets")

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class AnalyzeRequest(BaseModel):
    text: str

class Stage1AnalyzeRequest(BaseModel):
    text: str

class RewriteRequest(BaseModel):
    preset: str = "trainer-update"
    raw_text: str
    tone: str = "balanced"
    length: str = "standard"
    audience: str = "investor"
    style_flags: Optional[List[str]] = []

class Stage1RewriteRequest(BaseModel):
    preset: str = Field(..., description="pre_race | post_race | race_announcement | trainer_update")
    audience: str = Field(..., description="investor | owner | social | mixed")
    tone: str = Field(..., description="formal | balanced | conversational")
    length: str = Field(..., description="short | standard | long")
    raw_text: str

class SuggestRequest(BaseModel):
    text: str
    field: str = "body"
    tone: float = 0.5
    temperature: float = 0.7
    target_words: int = 300

# ============================================================================
# HEALTH CHECK
# ============================================================================

def _vertex_search_configured() -> bool:
    """Check if Vertex Search can be used: env vars + ADC."""
    if not (PROJECT_ID and DATA_STORE_ID):
        return False
    try:
        google.auth.default()
        return True
    except Exception:
        return False

@app.get("/health")
async def health():
    """System health check - reports status of all integrated services"""
    services = {
        "gemini": bool(GEMINI_API_KEY),
        "vertex_search": _vertex_search_configured(),
        "duckduckgo": DDG_ENABLED and DDG_AVAILABLE,
        "app_helpers": APP_HELPERS_AVAILABLE,
    }
    log_event("health_check", **services)
    return {
        "status": "ok",
        "backend": "unified",
        "version": "3.0.0",
        "services": services,
        "endpoints": {
            "stage1_analyze": "/api/stage1/analyze",
            "stage1_rewrite": "/api/stage1/rewrite",
            "legacy_analyze": "/analyze",
            "legacy_suggest": "/suggest",
            "seek": "/api/seek",
            "rag": "/api/rag",
            "web": "/api/web",
            "auth": "/api/auth",
        }
    }

@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "message": "Evolution Content Builder - Unified Backend API",
        "version": "3.0.0",
        "docs": "/docs",
        "health": "/health",
    }

# ============================================================================
# STAGE 1 ENDPOINTS (Content Builder Pipeline)
# ============================================================================

@app.post("/api/stage1/analyze")
async def stage1_analyze(req: Stage1AnalyzeRequest):
    """
    Stage 1: Analyze raw text content
    Returns: word count, readability band, keywords
    """
    try:
        if not APP_HELPERS_AVAILABLE:
            # Fallback simple analysis
            words = req.text.split()
            return {
                "word_count": len(words),
                "readability_band": "good" if 50 <= len(words) <= 300 else "short" if len(words) < 50 else "long",
                "keywords": list(set(w.lower() for w in words if len(w) > 5))[:10],
                "suggestions": [],
            }
        
        tokens = tokenize_words(req.text)
        word_count = len(tokens)
        readability_band = compute_readability_band_stage1(word_count)
        keywords = extract_keywords(req.text, limit=10)
        
        return {
            "word_count": word_count,
            "readability_band": readability_band,
            "keywords": keywords,
            "suggestions": [],
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/api/stage1/rewrite")
async def stage1_rewrite(req: Stage1RewriteRequest):
    """
    Stage 1: Rewrite raw text into structured content
    Uses Gemini API with brand voice enforcement
    """
    try:
        if not APP_HELPERS_AVAILABLE:
            # Return stub content
            return {
                "preset": req.preset,
                "audience": req.audience,
                "tone": req.tone,
                "length": req.length,
                "headline": "Sample Headline",
                "subheadline": "Sample subheadline for testing",
                "sections": [{"id": "sec-1", "heading": "Introduction", "body": req.raw_text[:200]}],
                "quote": "",
                "quote_by": "",
                "key_points": ["Point 1", "Point 2"],
                "social_caption": "Evolution Stables update",
                "meta": {
                    "word_count": len(req.raw_text.split()),
                    "readability_band": "good",
                    "keywords": [],
                },
                "source": "stub",
                "message": "App helpers not available. Using stub response.",
            }
        
        prompt = build_stage1_prompt(
            preset=req.preset,
            raw_text=req.raw_text,
            audience=req.audience,
            tone=req.tone,
            length=req.length,
        )
        
        if not GEMINI_AVAILABLE or not GEMINI_API_KEY:
            fallback = build_stage1_stub(req.raw_text, req.preset, req.audience, req.tone, req.length)
            fallback["source"] = "stub"
            fallback["message"] = "Gemini not configured; returning deterministic stub."
            return fallback
        
        model_output = await generate_with_gemini(prompt)
        structured = parse_stage1_response(model_output, req.preset, req.audience, req.tone, req.length, req.raw_text)
        structured["source"] = "gemini"
        return structured
        
    except Exception as e:
        traceback.print_exc()
        if APP_HELPERS_AVAILABLE:
            fallback = build_stage1_stub(req.raw_text, req.preset, req.audience, req.tone, req.length)
            fallback["error"] = "gemini_rewrite_failed"
            fallback["message"] = f"Gemini rewrite failed: {str(e)}. Returning fallback."
            return JSONResponse(status_code=502, content=fallback)
        else:
            raise HTTPException(status_code=500, detail=f"Rewrite failed: {str(e)}")

# ============================================================================
# LEGACY ENDPOINTS (Builder UI compatibility)
# ============================================================================

@app.post("/analyze")
async def legacy_analyze(req: AnalyzeRequest):
    """Legacy analyze endpoint for builder UI compatibility"""
    text = req.text or ""
    words = text.split()
    word_count = len(words)
    
    # Simple sentiment analysis
    positive_words = ['great', 'excellent', 'amazing', 'fantastic', 'wonderful', 'victory', 'win', 'champion']
    negative_words = ['poor', 'bad', 'terrible', 'loss', 'defeat', 'unfortunate']
    
    text_lower = text.lower()
    positive_count = sum(1 for word in positive_words if word in text_lower)
    negative_count = sum(1 for word in negative_words if word in text_lower)
    
    sentiment = 'positive' if positive_count > negative_count else 'negative' if negative_count > positive_count else 'neutral'
    
    # Extract keywords
    common_words = {'about', 'there', 'their', 'would', 'could', 'should', 'which', 'these', 'those'}
    keywords = list(set([
        word.strip('.,!?;:').lower() 
        for word in words 
        if len(word) > 5 and word.lower() not in common_words
    ]))[:8]
    
    # Readability
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
async def legacy_suggest(req: SuggestRequest):
    """Legacy suggest endpoint for builder UI compatibility"""
    if not GEMINI_AVAILABLE or not GEMINI_API_KEY:
        return {
            "headline": f"Sample {req.field} for Evolution Stables",
            "body": "Configure Gemini API key to enable AI-powered suggestions.",
            "polished": False
        }
    
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        tone_desc = "formal and professional" if req.tone < 0.4 else "casual and friendly" if req.tone > 0.7 else "balanced"
        
        prompt = f"""Generate a {req.field} for Evolution Stables racing content.

Tone: {tone_desc}
Target length: approximately {req.target_words} words
Context: {req.text[:200] if req.text else 'Racing and horse training content'}

Requirements:
- Use Evolution Stables brand voice (premium, elegant, exciting)
- Focus on racing excellence and champion horses
- Keep it engaging and professional

Generate only the {req.field} text, no explanations."""

        response = model.generate_content(
            prompt,
            generation_config={
                'temperature': req.temperature,
                'max_output_tokens': req.target_words * 2,
            }
        )
        
        generated_text = response.text.strip()
        
        return {
            "headline": generated_text if req.field == "headline" else None,
            "body": generated_text if req.field == "body" else None,
            "subheadline": generated_text if req.field == "subheadline" else None,
            "polished": True
        }
    except Exception as e:
        return {
            "headline": f"Sample {req.field} (Gemini unavailable)",
            "body": f"AI generation temporarily unavailable: {str(e)}",
            "polished": False
        }

# ============================================================================
# AUDIO TRANSCRIPTION (Gemini)
# ============================================================================

@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Transcribe audio files using Google Gemini 2.0 (multimodal)
    Supports: .m4a, .mp3, .wav, .webm, .mp4, .flac, .ogg
    """
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Gemini API key not configured. Add GEMINI_API_KEY to .env file."
        )
    
    # Validate file type
    allowed_extensions = {'.m4a', '.mp3', '.wav', '.webm', '.mp4', '.mpeg', '.mpga', '.flac', '.ogg'}
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file_ext}. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Read audio content
    content = await file.read()
    
    # Check file size (reasonable limit for Gemini: 50MB)
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size: 50MB"
        )
    
    try:
        import google.generativeai as genai
        import mimetypes
        
        # Configure Gemini
        genai.configure(api_key=GEMINI_API_KEY)
        
        # Determine MIME type
        mime_type = mimetypes.guess_type(file.filename)[0]
        if not mime_type:
            mime_type = 'audio/mpeg' if file_ext == '.mp3' else 'audio/mp4'
        
        # Save to temporary file for upload
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        try:
            # Upload audio file to Gemini
            audio_file = genai.upload_file(tmp_path, mime_type=mime_type)
            
            # Use Gemini 3.0 Pro - best multimodal model for audio transcription
            model = genai.GenerativeModel('gemini-3-pro-preview')
            
            # Generate transcription
            response = model.generate_content([
                audio_file,
                "Transcribe this audio file verbatim. Return ONLY the transcription text, no additional commentary."
            ])
            
            # Clean up uploaded file from Gemini
            try:
                audio_file.delete()
            except:
                pass
            
            return {
                "text": response.text,
                "filename": file.filename,
                "success": True,
                "provider": "gemini-3-pro"
            }
        
        finally:
            # Clean up temp file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
    
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Transcription failed: {str(e)}"
        )

# ============================================================================
# MOUNT ALL MODULE ROUTERS
# ============================================================================

app.include_router(seek_router, prefix="/api", tags=["Seek"])
app.include_router(rag_router, tags=["RAG"])
app.include_router(auth_router, tags=["Auth"])
app.include_router(web_router, tags=["Web"])

# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("FASTAPI_PORT", "8000"))
    print(f"🚀 Starting Evolution Content Builder Backend on port {port}")
    print(f"📚 API Docs: http://localhost:{port}/docs")
    print(f"❤️ Health Check: http://localhost:{port}/health")
    uvicorn.run(app, host="0.0.0.0", port=port, reload=True)
