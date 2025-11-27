#!/bin/bash
# Quick ComfyUI setup for AI image generation

set -e

echo "=== Quick ComfyUI Setup ==="
cd /mnt/e/Evolution-Content-Builder

# Clone ComfyUI if not exists
if [ ! -d "ComfyUI" ]; then
    echo "Cloning ComfyUI..."
    git clone https://github.com/comfyanonymous/ComfyUI.git
fi

cd ComfyUI

# Create venv if not exists
if [ ! -d "venv" ]; then
    echo "Creating Python environment..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "Installing PyTorch with CUDA 12.1..."
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

echo "Installing ComfyUI requirements..."
pip install -r requirements.txt

echo "Downloading SDXL Lightning model (this may take a few minutes)..."
mkdir -p models/checkpoints
cd models/checkpoints

if [ ! -f "sdxl_lightning_4step.safetensors" ]; then
    wget https://huggingface.co/ByteDance/SDXL-Lightning/resolve/main/sdxl_lightning_4step.safetensors
fi

cd ../..

echo ""
echo "=== ComfyUI Setup Complete! ==="
echo ""
echo "To start ComfyUI:"
echo "  cd /mnt/e/Evolution-Content-Builder/ComfyUI"
echo "  source venv/bin/activate"
echo "  python main.py --force-fp16 --cuda-device 0"
echo ""
echo "ComfyUI will run on: http://localhost:8188"
