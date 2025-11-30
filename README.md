# Evolution Content Builder

AI-powered content generation system for **Evolution Stables** - transforming race updates into professional investor reports.

## 🎯 Current Status: Phase 1 (API-Driven) - Production Ready

**✅ Working NOW:**
- 🎙️ Audio transcription (Gemini 3.0 Pro)
- 🤖 AI content rewriting (Gemini 2.0 Flash)
- 🔍 Research Mode (RAG via Vertex AI)
- 📸 Manual image upload (real horse photos)
- 📊 Content analysis & brand compliance

**⏳ Phase 2 (Planned):**
- Ollama (local LLM for offline mode)
- ComfyUI (brand-specific AI image generation)

👉 **See [IMPLEMENTATION-STATUS.md](./IMPLEMENTATION-STATUS.md) for detailed feature breakdown**

---

## Features

- **Audio Transcription**: Upload race day voice memos → auto-transcribe to text
- **Research Mode**: Query your knowledge base → auto-populate content
- **AI Rewriting**: Raw updates → polished investor reports (brand-compliant)
- **Multi-Input Support**: Drag/drop files, paste text/images, or upload media
- **Smart Analysis**: Word count, readability, keywords, sentiment
- **4MAT Structure**: Content follows proven framework (Why, What, How, What If)
- **Device Preview**: See how reports look on desktop/tablet/mobile
- **Export Options**: HTML and Markdown output

## Tech Stack

### Phase 1 (Current)
- **Backend**: FastAPI 0.109.0 (Python 3.10+)
- **Frontend**: React 19 + TypeScript + Vite 7.2 + Tailwind CSS
- **AI Services**: Google Gemini (3.0 Pro, 2.0 Flash), Vertex AI Search
- **Hosting**: Local development (ports 8000, 5173)

### Phase 2 (Future)
- **Local LLM**: Ollama + Mistral 7B / Llama 3 8B
- **Image Gen**: ComfyUI + SDXL + Custom LoRA
- **GPU**: CUDA 12.1+ (RTX 3060 or better recommended)

---

## Quick Start

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** (for frontend)
- **Google Cloud API Key** (for Gemini)

### Installation

```bash
# 1. Clone repository
git clone https://github.com/Badders80/Evolution-Content-Builder.git
cd Evolution-Content-Builder

# 2. Configure API key
cp .env.example .env
nano .env  # Add your GEMINI_API_KEY

# 3. Install dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cd builder-ui
npm install
cd ..

# 4. Start servers
./start.sh
```

**Access Points:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Testing

```bash
# Health check
curl http://localhost:8000/health

# Test audio transcription
curl -X POST http://localhost:8000/api/transcribe \
  -F "audio=@your_audio.mp3"

# Test AI rewrite
curl -X POST http://localhost:8000/api/stage1/rewrite \
  -H "Content-Type: application/json" \
  -d '{
    "preset": "post_race",
    "raw_text": "First Gear won at Wanganui",
    "tone": "balanced",
    "length": "standard",
    "audience": "investors"
  }'
```

---

## Phase 2 Setup (Optional - For Later)

### Local LLM (Ollama)
pip install -r requirements.txt

# ComfyUI
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI
python3 -m venv venv
source venv/bin/activate
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install -r requirements.txt
cd models/checkpoints
wget https://huggingface.co/ByteDance/SDXL-Lightning/resolve/main/sdxl_lightning_4step.safetensors
cd ../..

# Kohya_ss
cd ..
git clone https://github.com/bmaltais/kohya_ss.git
cd kohya_ss
source ../ComfyUI/venv/bin/activate
pip install -r requirements.txt
pip install accelerate bitsandbytes xformers tensorboard lion_pytorch dadaptation prodigyopt
mkdir training_data
```

## Usage

### 1. Start the Application

```bash
cd /mnt/e/Evolution-Content-Builder
source venv/bin/activate
uvicorn backend.main:app --reload --port 8000
```

Access at: http://localhost:8000

### How the Engine Flows

```
Streamlit UI / API client
        ↓
    /api/seek
        ↓
   task router
   ├─ grounded? → Vertex AI Search
   ├─ web?      → DuckDuckGo snippets
   ↓
  Gemini (flash/pro)
        ↓
      Response → UI
```

Health check:

```
GET /health
# -> { "status": "ok", "seek_enabled": true/false, "vertex_search_configured": true/false, "duckduckgo_enabled": true/false }
```

Frontend contract and payload shapes: see `docs/FRONTEND-CONTRACT.md`.

Task defaults:
- `race_preview`, `race_update`: web context auto-enabled (DuckDuckGo) unless toggled off.
- `legal`, `investor`, `governance`: web off by default (internal-only).
- Grounding (Vertex Search) requires `GOOGLE_PROJECT_ID`, `VERTEX_SEARCH_DATASTORE_ID`, and ADC/service account.

DDG toggle: controlled per-request (`web` flag) and via UI toggle; safe to leave off if external web context not desired.

Grounding warnings: if `grounded=true` but Vertex Search/ADC isn’t configured, the API responds with `{ok: false, error: "..."}`

### Evolution Seek (NeuralSeek clone)

Set environment variables (or add them to a local `.env`):

```
GOOGLE_PROJECT_ID=<your_gcp_project_id>
GOOGLE_LOCATION_ID=global  # optional, defaults to global
VERTEX_SEARCH_DATASTORE_ID=<vertex_ai_search_datastore>
```

Then start the Seek API and UI in separate terminals:

```bash
# Terminal 1: Unified FastAPI backend (legacy + Seek)
uvicorn backend.main:app --reload --port 8000

# Terminal 2: Streamlit UI
streamlit run seek_app.py
# optional override if deploying backend elsewhere:
# SEEK_API_URL=http://localhost:8000/api/seek streamlit run seek_app.py
```

The Seek engine rewrites queries with Gemini, retrieves context from Vertex AI Search, and generates answers with Gemini 3.0 Pro/Flash. Enable DLP in the UI to sanitize PII before retrieval.

### 2. Start ComfyUI (Optional - for AI image generation)

In a separate terminal:

```bash
cd /mnt/e/Evolution-Content-Builder/ComfyUI
source venv/bin/activate
python main.py --force-fp16 --cuda-device 0
```

ComfyUI runs at: http://localhost:8188

### 3. Train Custom LoRA (Optional - for brand-specific images)

1. Add training images to `kohya_ss/training_data/`
2. Start Kohya GUI:

```bash
cd /mnt/e/Evolution-Content-Builder/kohya_ss
source ../ComfyUI/venv/bin/activate
python kohya_gui.py
```

3. Configure training:
   - Model: SDXL Lightning
   - Dataset: training_data folder
   - Epochs: 15
   - Batch size: 1
   - Optimizer: AdamW8bit
   - Learning rate: 1e-4
   - Prompt: "premium minimalist racing brand, black gold accents"
   - Enable FP16 for GPU

4. Move trained LoRA to: `ComfyUI/models/loras/evolution-brand.safetensors`

## Project Structure

```
/mnt/e/Evolution-Content-Builder/
├── app.py                 # FastAPI backend
├── index.html             # Dashboard frontend
├── requirements.txt       # Python dependencies
├── setup.sh              # Automated setup script
├── README.md             # This file
├── lib/
│   └── taglines.json     # Brand taglines
├── assets/               # Brand assets (logos, graphics)
├── venv/                 # Python virtual environment
├── ComfyUI/              # AI image generation
│   ├── models/
│   │   ├── checkpoints/  # SDXL Lightning model
│   │   └── loras/        # Custom LoRA models
│   └── venv/
└── kohya_ss/             # LoRA training
    ├── training_data/    # Training images
    └── output/           # Trained LoRA files
```

## Adding Brand Assets

1. Copy your brand assets (logos, graphics, etc.) to the `assets/` folder
2. Supported formats: PNG, JPG, JPEG, SVG, WEBP
3. Assets will automatically appear in the dashboard selector

## Content Templates

The system auto-classifies content into four templates:

- **Pre-Race**: Odds, betting info → 70% visual poster with hero banner
- **Post-Race**: Results, finish → Report with recap + quotes
- **Trainer Update**: Quotes, fitness → Quote cards with insights
- **Upcoming Race**: General updates → Teaser with CTA

## GPU Optimization

For RTX 3060 (12GB VRAM):

- ComfyUI: `--force-fp16` flag reduces memory usage
- LoRA training: Use FP16 precision, batch size 1
- Monitor with: `nvidia-smi`

## Troubleshooting

### CUDA Not Found
```bash
# Check CUDA installation
nvidia-smi
# Reinstall PyTorch with correct CUDA version
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

### ComfyUI Connection Failed
- Ensure ComfyUI is running on port 8188
- Check firewall settings
- App will use placeholder images if ComfyUI unavailable

### Permission Errors
```bash
# Fix ownership
sudo chown -R $USER:$USER /mnt/e/Evolution-Content-Builder
```

## Development

### Adding New Templates

Edit `app.py`:

```python
TEMPLATES = {
    "your-template": {
        "style": "description",
        "structure": "layout details"
    }
}
```

---

## 📚 Documentation

- **[IMPLEMENTATION-STATUS.md](./IMPLEMENTATION-STATUS.md)** - Phase 1 vs Phase 2 breakdown
- **[TECHNICAL-OVERVIEW.md](./TECHNICAL-OVERVIEW.md)** - Full architecture documentation  
- **[docs/COMFYUI-SETUP.md](./docs/COMFYUI-SETUP.md)** - Image generation (Phase 2)

---

## 🎯 Quick Decision Guide

**"Should I set up ComfyUI now?"**  
→ No. Use real horse photos for investor reports (more credible than AI).

**"Should I set up Ollama now?"**  
→ No. Gemini API is fast and has free tier. Local LLM = cost optimization later.

**"What should I focus on NOW?"**  
→ Test full workflow → Generate sample reports → Get feedback → Prove ROI

**"When should I do Phase 2?"**  
→ When generating 100+ reports/month OR need offline capability OR want brand-specific AI imagery for social media.

---

## License

Proprietary - Evolution Stables © 2025

## Support

For issues or questions, contact the Evolution development team.
