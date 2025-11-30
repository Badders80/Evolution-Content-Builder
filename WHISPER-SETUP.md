# Audio Transcription Setup (Google Gemini 3.0 Pro)

## Overview
The Evolution Content Builder uses **Gemini 3.0 Pro** - Google's most intelligent multimodal model - for automatic audio transcription. When you upload audio files (.mp3, .m4a, .wav), they are automatically transcribed with state-of-the-art accuracy and the text is added to your content for analysis/rewriting.

## Why Gemini 3.0 Pro?
- **Best multimodal understanding** in the world
- Superior audio processing compared to 2.0 models
- Handles multiple languages automatically
- Better noise handling and accuracy
- Same API key as content generation

## Setup Required

### 1. Gemini API Key (Already Configured!)
Your `.env` file already has the Gemini API key configured:
```bash
GEMINI_API_KEY=AIzaSyBGDmffnr9vyluiDoL9M8jxMdKrCd6LMu4
```

No additional setup needed - the same key used for content generation now handles audio transcription!

### 2. Restart Backend
After confirming your key is set, restart the backend:

```bash
cd /mnt/e/Evolution-Content-Builder
./start-unified.sh
```

Look for this startup message:
```
✅ Gemini API configured (gemini-3-pro-preview)
```

## Usage

### Frontend (Automatic)
1. Open the app: http://localhost:5174
2. Upload an audio file (.mp3, .m4a, .wav)
3. Transcription happens automatically
4. Transcribed text appears in the text field
5. "Analyse" and "AI Rewrite" buttons become enabled

### API Endpoint (Direct)
```bash
curl -X POST http://localhost:8000/api/transcribe \
  -F "file=@your-audio.mp3" \
  -H "Accept: application/json"
```

Response:
```json
{
  "text": "This is the transcribed text...",
  "filename": "your-audio.mp3",
  "success": true
}
```

## Supported File Types
- `.mp3` - MPEG audio
- `.m4a` - Apple audio
- `.wav` - Wave audio
- `.webm` - WebM audio
- `.mp4` - MPEG-4 audio/video
- `.mpeg` - MPEG audio
- `.mpga` - MPEG audio
- `.flac` - FLAC audio
- `.ogg` - Ogg Vorbis

## Limitations
- Maximum file size: **50MB** (Gemini limit)
- Free tier: 15 requests per minute, 1500 per day
- Processing time: ~5-10 seconds per minute of audio (faster than Whisper!)
- Supports 100+ languages automatically
- Superior accuracy with Gemini 3.0 Pro's enhanced reasoning

## Pricing (Gemini API)
- **FREE** tier includes:
  - 15 RPM (requests per minute)
  - 1 million tokens per day
  - Audio processing included
- **Pay-as-you-go**: Much cheaper than OpenAI
  - Audio input: Included in token count
  - No separate audio pricing

Check current pricing: https://ai.google.dev/pricing

## Testing
Use the provided test script:

```bash
./test-whisper.sh path/to/audio.mp3
```

## Troubleshooting

### Error: "Gemini API key not configured"
- Check `.env` file has valid `GEMINI_API_KEY`
- Restart backend after updating `.env`
- Same key used for content generation

### Error: "File too large"
- Maximum size is 50MB (2x larger than OpenAI!)
- Compress audio or split into smaller chunks

### Error: "Unsupported file type"
- Only audio formats listed above are supported
- Convert to .mp3 or .wav if using other formats

### Transcription is slow
- Normal: ~5-15s per minute of audio
- Check Google API status: https://status.cloud.google.com

### Transcription accuracy issues
- Gemini 3.0 Pro handles 100+ languages automatically
- Best-in-class performance even with background noise
- Enhanced reasoning for technical/domain-specific content
- For best results: clear audio, minimal echo

### Rate limit errors
- Free tier: 15 requests/minute, 1500/day
- Wait a minute and retry
- Consider upgrading to paid tier if needed

## Cost Estimation
With Gemini's FREE tier:
- **15 audio files per minute** (free)
- **1,500 audio files per day** (free)
- After free tier: Minimal cost (audio included in token pricing)

Much more cost-effective than OpenAI Whisper! 🎉

## Privacy & Security
- Audio files are sent to Google's Gemini API for processing
- Google's data retention policies apply
- For sensitive content, review: https://ai.google.dev/terms
- Never commit your `GEMINI_API_KEY` to version control
- Same security considerations as content generation
