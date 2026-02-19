# CLAUDE.md - Evolution-Content-Builder

## What this repo is and what it solves
Evolution-Content-Builder is an AI-powered content generation platform for Evolution Stables. It solves the problem of creating high-quality racing content by leveraging Google Generative AI, Vertex AI Search, and various content creation tools to produce articles, social media posts, and other content formats.

## Full Stack
### What IS used:
- **Python 3.12** for backend logic
- **FastAPI** for API
- **React + TypeScript + Vite** for frontend
- **Google Generative AI (Gemini)** for content generation
- **Vertex AI Search** for RAG (Retrieval-Augmented Generation)
- **Whisper** for audio transcription
- **ComfyUI** for image generation
- **Kohya LoRA** for model training

### What IS NOT used:
- **OpenAI**: Not used (Google Generative AI preferred)
- **Hugging Face**: Not used (Google Cloud AI preferred)
- **WordPress**: Not used (Custom React app preferred)

## Hard Coding Rules

1. **No empty placeholder files** - Implement or don't create the file
2. **AI prompts must follow brand guidelines** - See brand-identity/BRAND_VOICE.md
3. **Content must be fact-checked** - Use Vertex AI Search for verification
4. **Performance must be optimized** - Respect RTX 3060 VRAM limits
5. **Security must be enforced** - Sanitize all user inputs

## Project Structure
```
Evolution-Content-Builder/
├── app.py                 # Main FastAPI application
├── seek_app.py            # Seek app for content search
├── backend/               # Backend logic
│   ├── core/             # Core functionality
│   ├── google_seek/      # Google Seek integration
│   ├── rag/              # RAG system
│   └── web/              # Web endpoints
├── builder-ui/            # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── lib/          # Utility functions
│   │   └── types/        # TypeScript types
│   └── public/           # Static assets
├── config/                # Configuration files
│   ├── schemas/          # JSON schemas
│   └── tone_guidelines.md # Tone guidelines
├── docs/                  # Documentation
├── lib/                   # Helper libraries
│   ├── prompts.py        # AI prompts
│   └── studio.py         # Studio integration
├── scripts/               # Helper scripts
├── assets/                # Media assets
├── requirements.txt       # Python dependencies
└── README.md             # Documentation
```

## Key Features
1. **AI Content Generation**: Generates content using Google Generative AI
2. **Audio Transcription**: Uses Whisper for audio transcription
3. **Research Mode**: Uses Vertex AI Search for fact-checking
4. **Device Preview**: Shows content on various device sizes
5. **ComfyUI Integration**: Generates images using ComfyUI

## Environment Variables
Required environment variables in `.env`:
```
GOOGLE_API_KEY=
GOOGLE_CLOUD_PROJECT=
VERTEX_API_KEY=
```

## WSL2 Paths
- **Project Path**: `/home/evo/projects/Evolution-Content-Builder/`
- **Windows Path**: `C:\Users\Evo\projects\Evolution-Content-Builder\`
- **Dev Server Port**: 8000 (default)

## Current Phase and Next Build Target
- **Current Phase**: Production Ready (Phase 1)
- **Next Build Target**: Integrate with Evolution_3.1 for content display

## Commands
- **Run Backend**: `python app.py` (runs on port 8000)
- **Run Frontend**: `cd builder-ui && npm run dev` (runs on port 5173)
- **Install Dependencies**: `pip install -r requirements.txt && cd builder-ui && npm install`

## Source of Truth
**All development standards are defined in 00_DNA**:
- **Build Philosophy**: `/home/evo/00_DNA/build-philosophy/Master_Config_2026.md`
- **System Prompts**: `/home/evo/00_DNA/system-prompts/PROMPT_LIBRARY.md`
- **Brand Voice**: `/home/evo/00_DNA/brand-identity/BRAND_VOICE.md`
- **Workflows**: `/home/evo/00_DNA/workflows/`

**Key Files to Reference**:
1. `/home/evo/00_DNA/AGENTS.core.md` - Universal agent rules
2. `/home/evo/00_DNA/build-philosophy/Master_Config_2026.md` - Hardware and architecture specs
3. `/home/evo/00_DNA/brand-identity/MESSAGING_CHEAT_SHEET.md` - Brand voice guidelines
