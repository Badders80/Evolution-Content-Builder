#!/usr/bin/env python3
"""
Test ComfyUI image generation integration.
"""
import requests
import json
import sys

def test_comfyui_health():
    """Check if ComfyUI is running"""
    print("🔍 Testing ComfyUI connection...")
    comfy_url = "http://127.0.0.1:8188"
    
    try:
        response = requests.get(f"{comfy_url}/system_stats", timeout=2)
        if response.ok:
            print(f"✅ ComfyUI is running at {comfy_url}")
            stats = response.json()
            print(f"   System: {stats.get('system', 'unknown')}")
            return True
        else:
            print(f"❌ ComfyUI responded with status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ ComfyUI not running at {comfy_url}")
        print("   Start ComfyUI first: ./start-comfyui.sh")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def test_image_generation():
    """Test the /api/generate_image endpoint"""
    print("\n🎨 Testing image generation endpoint...")
    
    api_url = "http://localhost:8000/api/generate_image"
    payload = {
        "prompt": "Evolution Stables racing horse, winner's circle, professional photography, golden hour",
        "negative_prompt": "blurry, low quality, distorted, cartoon",
        "width": 1024,
        "height": 768
    }
    
    try:
        print(f"   Sending request to {api_url}")
        print(f"   Prompt: {payload['prompt'][:60]}...")
        
        response = requests.post(api_url, data=payload, timeout=120)
        
        if response.ok:
            result = response.json()
            status = result.get("status")
            
            if status == "success":
                print("✅ Image generated successfully!")
                image_data = result.get("image", "")
                print(f"   Image size: {len(image_data)} characters (base64)")
                print(f"   Dimensions: {result.get('dimensions')}")
                return True
            elif status == "error":
                print(f"❌ Generation failed: {result.get('message')}")
                return False
        else:
            print(f"❌ API responded with status {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Backend not running at http://localhost:8000")
        print("   Start backend first: ./start.sh")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("ComfyUI Integration Test")
    print("=" * 60)
    
    # Test 1: ComfyUI health
    comfy_ok = test_comfyui_health()
    
    # Test 2: Image generation (only if ComfyUI is running)
    if comfy_ok:
        image_ok = test_image_generation()
        
        if image_ok:
            print("\n" + "=" * 60)
            print("✅ ALL TESTS PASSED - ComfyUI integration working!")
            print("=" * 60)
            sys.exit(0)
    
    print("\n" + "=" * 60)
    print("⚠️ TESTS INCOMPLETE - Check errors above")
    print("=" * 60)
    sys.exit(1)
