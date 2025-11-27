#!/usr/bin/env python3
"""Pre-download SDXL Lightning model in background"""

import torch
from diffusers import DiffusionPipeline

print("Starting SDXL Lightning model download (~7GB)...")
print("This will take 5-10 minutes depending on your connection.")
print("")

try:
    pipeline = DiffusionPipeline.from_pretrained(
        "stabilityai/stable-diffusion-xl-base-1.0",
        torch_dtype=torch.float16,
        variant="fp16",
        use_safetensors=True
    )
    
    if torch.cuda.is_available():
        print("Moving model to GPU...")
        pipeline.to("cuda")
        print("✅ Model loaded on GPU successfully!")
    else:
        print("⚠️  Warning: CUDA not available, model loaded on CPU")
    
    print("")
    print("✅ SDXL Lightning model downloaded and ready!")
    print("Your app can now generate images in ~5-10 seconds")
    
except Exception as e:
    print(f"❌ Error downloading model: {e}")
    print("The model will download automatically when you first generate an image.")
