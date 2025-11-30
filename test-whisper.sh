#!/bin/bash

# Test Whisper transcription endpoint
# Usage: ./test-whisper.sh <audio_file.mp3>

if [ $# -eq 0 ]; then
    echo "Usage: ./test-whisper.sh <audio_file>"
    echo "Example: ./test-whisper.sh test.mp3"
    exit 1
fi

AUDIO_FILE="$1"

if [ ! -f "$AUDIO_FILE" ]; then
    echo "Error: File '$AUDIO_FILE' not found"
    exit 1
fi

echo "Testing Whisper transcription endpoint..."
echo "File: $AUDIO_FILE"
echo ""

curl -X POST http://localhost:8000/api/transcribe \
  -F "file=@$AUDIO_FILE" \
  -H "Accept: application/json" \
  2>&1 | grep -E '(text|success|detail|error)' | head -20

echo ""
echo "Test complete!"
