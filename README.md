# Evolution Content Builder

AI-powered content generation system for Evolution Racing's brand materials, social posts, and race updates.

## Features

- **Multi-Input Support**: Drag/drop files, paste text/images, or upload media
- **Brand Asset Library**: Select from pre-approved Evolution brand assets
- **Smart Templates**: Auto-classifies content (pre-race, post-race, trainer updates, etc.)
- **AI Image Generation**: ComfyUI integration with custom LoRA for brand consistency
- **4MAT Structure**: Outputs follow proven content framework
- **Brand Bible Compliance**: Taglines, tone, and styling match Evolution guidelines
- **Export Options**: HTML and PDF output

## Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: Vanilla JS + Pico CSS
- **AI Image Gen**: ComfyUI + SDXL Lightning
- **LoRA Training**: Kohya_ss
- **GPU**: CUDA 12.1 (RTX 3060 optimized)

## Installation

### Quick Start (Automated)

```bash
cd /mnt/e/Evolution-Content-Builder
chmod +x setup.sh
./setup.sh
```

The script will:
1. Update system packages
2. Install Python dependencies
3. Clone and configure ComfyUI
4. Clone and configure Kohya_ss
5. Download SDXL Lightning model
6. Create necessary directories

### Manual Setup

If you prefer manual installation:

```bash
# System dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install python3-venv python3-pip git wget curl -y

# Main app
cd /mnt/e/Evolution-Content-Builder
python3 -m venv venv
source venv/bin/activate
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
python app.py
```

Access at: http://localhost:8000

### Evolution Seek (NeuralSeek clone)

Set environment variables (or add them to a local `.env`):

```
GOOGLE_PROJECT_ID=<your_gcp_project_id>
GOOGLE_LOCATION_ID=global  # optional, defaults to global
VERTEX_SEARCH_DATASTORE_ID=<vertex_ai_search_datastore>
```

Then start the Seek API and UI in separate terminals:

```bash
# Terminal 1: FastAPI + Vertex AI Search
uvicorn backend.server:app --reload --port 8000

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

### Customizing Taglines

Edit `lib/taglines.json` with your brand taglines.

### Modifying Styles

Edit the `<style>` section in `index.html` or generated HTML templates in `app.py`.

## License

Proprietary - Evolution Racing

## Support

For issues or questions, contact the Evolution tech team.
