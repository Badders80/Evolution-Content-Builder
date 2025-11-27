#!/bin/bash
# Start ComfyUI for AI image generation

cd /mnt/e/Evolution-Content-Builder/ComfyUI

if [ ! -d "venv" ]; then
    echo "Error: ComfyUI not set up. Run ./setup.sh first."
    exit 1
fi

source venv/bin/activate

echo "=== Starting ComfyUI (GPU Mode) ==="
echo "Access at: http://localhost:8188"
echo "Press Ctrl+C to stop"
echo ""

python main.py --force-fp16 --cuda-device 0
