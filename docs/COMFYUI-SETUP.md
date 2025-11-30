# ComfyUI Integration Guide

## Overview

Evolution Content Builder now supports AI image generation through **ComfyUI** with SDXL (Stable Diffusion XL). This integration allows you to generate professional racing imagery to accompany your content.

## Prerequisites

### 1. Install ComfyUI

```bash
# Clone ComfyUI repository
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI

# Install dependencies
pip install -r requirements.txt

# Download SDXL base model (6.5GB)
cd models/checkpoints
wget https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors
cd ../..
```

### 2. Start ComfyUI

```bash
# From ComfyUI directory
python main.py --listen 127.0.0.1 --port 8188

# Or use the convenience script (if available)
./start-comfyui.sh
```

**Expected Output:**
```
To see the GUI go to: http://127.0.0.1:8188
```

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# ComfyUI server URL (default: http://127.0.0.1:8188)
COMFY_URL=http://127.0.0.1:8188
```

## API Usage

### Endpoint: `/api/generate_image`

**Method:** `POST`

**Parameters:**
- `prompt` (required): Description of the image to generate
- `negative_prompt` (optional): What to avoid in the image
- `width` (optional): Image width in pixels (default: 1024)
- `height` (optional): Image height in pixels (default: 768)

**Example Request:**

```bash
curl -X POST http://localhost:8000/api/generate_image \
  -F "prompt=Evolution Stables racing horse, winner's circle, professional photography, golden hour" \
  -F "negative_prompt=blurry, low quality, distorted" \
  -F "width=1024" \
  -F "height=768"
```

**Success Response:**

```json
{
  "status": "success",
  "image": "data:image/png;base64,iVBORw0KGg...",
  "prompt": "Evolution Stables racing horse...",
  "dimensions": {
    "width": 1024,
    "height": 768
  }
}
```

**Error Response (ComfyUI not running):**

```json
{
  "status": "error",
  "message": "ComfyUI not available. Ensure ComfyUI is running at http://127.0.0.1:8188"
}
```

## Testing

### Quick Test

```bash
# 1. Ensure ComfyUI is running
curl http://127.0.0.1:8188/system_stats

# 2. Run the test script
python scripts/test_comfyui.py
```

**Expected Output:**

```
============================================================
ComfyUI Integration Test
============================================================
🔍 Testing ComfyUI connection...
✅ ComfyUI is running at http://127.0.0.1:8188
   System: unknown

🎨 Testing image generation endpoint...
   Sending request to http://localhost:8000/api/generate_image
   Prompt: Evolution Stables racing horse, winner's circle, profess...
✅ Image generated successfully!
   Image size: 123456 characters (base64)
   Dimensions: {'width': 1024, 'height': 768}

============================================================
✅ ALL TESTS PASSED - ComfyUI integration working!
============================================================
```

## Workflow Architecture

### How It Works

1. **Request Received**: Frontend/API sends prompt to `/api/generate_image`
2. **Workflow Construction**: Backend constructs ComfyUI workflow JSON with:
   - SDXL checkpoint loader
   - CLIP text encoders (positive/negative prompts)
   - KSampler (20 steps, cfg=7.0)
   - VAE decoder
   - Image saver
3. **Queue Submission**: Workflow sent to ComfyUI via `/prompt` endpoint
4. **Polling**: Backend polls `/history/{prompt_id}` every 2 seconds
5. **Image Retrieval**: Once complete, downloads image via `/view` endpoint
6. **Base64 Encoding**: Converts image to base64 for JSON transport
7. **Response**: Returns data URI to frontend

### Workflow JSON Structure

```json
{
  "3": { "class_type": "KSampler", ... },
  "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": "sd_xl_base_1.0.safetensors" } },
  "5": { "class_type": "EmptyLatentImage", "inputs": { "width": 1024, "height": 768 } },
  "6": { "class_type": "CLIPTextEncode", "inputs": { "text": "prompt..." } },
  "7": { "class_type": "CLIPTextEncode", "inputs": { "text": "negative_prompt..." } },
  "8": { "class_type": "VAEDecode", ... },
  "9": { "class_type": "SaveImage", ... }
}
```

## Troubleshooting

### ComfyUI Not Running

**Error:**
```
❌ ComfyUI not running at http://127.0.0.1:8188
```

**Solution:**
```bash
# Start ComfyUI
cd /path/to/ComfyUI
python main.py --listen 127.0.0.1 --port 8188
```

### Model Not Found

**Error:**
```
Checkpoint "sd_xl_base_1.0.safetensors" not found
```

**Solution:**
```bash
cd ComfyUI/models/checkpoints
wget https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors
```

### Generation Timeout

**Error:**
```
⏱️ ComfyUI generation timed out
```

**Causes:**
- First generation (model loading) can take 2-3 minutes
- Insufficient GPU memory
- ComfyUI overloaded

**Solutions:**
- Wait longer on first run (model loads into VRAM)
- Close other GPU applications
- Reduce image dimensions (512x512 for testing)
- Check ComfyUI console for errors

### Connection Refused

**Error:**
```
requests.exceptions.ConnectionError
```

**Solutions:**
1. Verify ComfyUI port: `netstat -tuln | grep 8188`
2. Check firewall settings
3. Ensure ComfyUI started successfully (check console)

## Performance Optimization

### GPU Acceleration

ComfyUI automatically uses CUDA if available:

```bash
# Check GPU availability
nvidia-smi

# Monitor GPU usage during generation
watch -n 1 nvidia-smi
```

### Generation Speed

- **First generation**: 60-120 seconds (model loading)
- **Subsequent generations**: 10-30 seconds
- **CPU only**: 5-10 minutes (not recommended)

### Batch Generation

Modify workflow to set `batch_size > 1` in EmptyLatentImage node for multiple images per prompt.

## Evolution Brand Prompts

### Recommended Positive Prompts

```
Evolution Stables racing horse, winner's circle, professional photography, golden hour, cinematic, high resolution

First Gear thoroughbred, paddock, morning training, dawn light, sharp focus, editorial quality

Evolution livery, racing silks, burgundy and gold, post race celebration, photorealistic
```

### Recommended Negative Prompts

```
blurry, low quality, distorted, cartoon, anime, painting, sketch, grainy, amateur, oversaturated
```

## Integration with Content Pipeline

The image generation is designed to work with the 3-stage content pipeline:

1. **Stage 1**: Input text → AI rewrite (currently working)
2. **Stage 2**: Refined content (future)
3. **Stage 3**: Generate companion image with ComfyUI
4. **Export**: HTML report with embedded image

## Future Enhancements

- [ ] Custom trained LoRA for Evolution Stables style
- [ ] Automatic prompt enhancement from content
- [ ] Multiple image variants per prompt
- [ ] Style presets (editorial, social media, print)
- [ ] Background removal for composite images
- [ ] Evolution logo watermarking

## Resources

- **ComfyUI GitHub**: https://github.com/comfyanonymous/ComfyUI
- **SDXL Paper**: https://arxiv.org/abs/2307.01952
- **Model Card**: https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready
