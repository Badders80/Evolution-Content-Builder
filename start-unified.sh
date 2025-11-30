#!/bin/bash
# Evolution Content Builder - Unified Startup Script

echo "🚀 Starting Evolution Content Builder (Unified Backend)"
echo "=================================================="
echo ""

# Change to project root
cd "$(dirname "$0")"

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Run: python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Activate venv
source venv/bin/activate

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your API keys, then run this script again."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

echo "✅ Environment loaded"
echo "✅ Gemini API: ${GEMINI_API_KEY:0:10}..."
echo ""

# Start backend
echo "🔧 Starting unified backend on port 8000..."
echo "📚 API Docs: http://localhost:8000/docs"
echo "❤️  Health Check: http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop"
echo ""

uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
