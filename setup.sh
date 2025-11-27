#!/bin/bash
# Evolution Content Builder Setup Script
# Run in WSL2 Ubuntu

set -e

echo "=== Evolution Content Builder Setup ==="
echo "Location: /mnt/e/Evolution-Content-Builder"
echo ""

# Check if running in correct directory
if [ ! -f "app.py" ]; then
    echo "Error: Run this script from /mnt/e/Evolution-Content-Builder"
    exit 1
fi

# Update system packages
echo "Step 1/6: Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install dependencies
echo "Step 2/6: Installing system dependencies..."
sudo apt install -y python3-venv python3-pip git wget curl

# Create Python virtual environment for main app
echo "Step 3/6: Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python packages
echo "Step 4/6: Installing Python packages..."
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "Step 5/6: Setting up ComfyUI (GPU-enabled)..."
if [ ! -d "ComfyUI" ]; then
    git clone https://github.com/comfyanonymous/ComfyUI.git
    cd ComfyUI
    python3 -m venv venv
    source venv/bin/activate
    
    # Install PyTorch with CUDA 12.1 support for RTX 3060
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
    pip install -r requirements.txt
    
    # Download SDXL Lightning model
    echo "Downloading SDXL Lightning model..."
    mkdir -p models/checkpoints
    cd models/checkpoints
    wget -q --show-progress https://huggingface.co/ByteDance/SDXL-Lightning/resolve/main/sdxl_lightning_4step.safetensors
    cd ../..
    
    deactivate
    cd ..
else
    echo "ComfyUI already exists, skipping..."
fi

echo ""
echo "Step 6/6: Setting up Kohya_ss for LoRA training..."
if [ ! -d "kohya_ss" ]; then
    git clone https://github.com/bmaltais/kohya_ss.git
    cd kohya_ss
    
    # Use ComfyUI's venv for consistency
    source ../ComfyUI/venv/bin/activate
    pip install -r requirements.txt
    pip install accelerate bitsandbytes xformers tensorboard
    pip install lion_pytorch dadaptation prodigyopt
    pip install safetensors diffusers invisible-watermark
    pip install transformers ftfy scipy tomesd timm
    pip install open-clip-torch torchmetrics pytorch-lightning gradio
    
    # Create training data directory
    mkdir -p training_data
    
    deactivate
    cd ..
else
    echo "Kohya_ss already exists, skipping..."
fi

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Next steps:"
echo "1. Add your brand assets to: /mnt/e/Evolution-Content-Builder/assets/"
echo "2. For LoRA training, add images to: /mnt/e/Evolution-Content-Builder/kohya_ss/training_data/"
echo ""
echo "To start the application:"
echo "  cd /mnt/e/Evolution-Content-Builder"
echo "  source venv/bin/activate"
echo "  python app.py"
echo ""
echo "To start ComfyUI (in separate terminal):"
echo "  cd /mnt/e/Evolution-Content-Builder/ComfyUI"
echo "  source venv/bin/activate"
echo "  python main.py --force-fp16 --cuda-device 0"
echo ""
echo "To train LoRA (in separate terminal):"
echo "  cd /mnt/e/Evolution-Content-Builder/kohya_ss"
echo "  source ../ComfyUI/venv/bin/activate"
echo "  python kohya_gui.py"
echo ""
echo "Access the dashboard at: http://localhost:8000"
