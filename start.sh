#!/bin/bash
# Quick start script for Evolution Content Builder

cd /mnt/e/Evolution-Content-Builder

echo "=== Starting Evolution Content Builder ==="
echo ""

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "Error: Virtual environment not found. Run ./setup.sh first."
    exit 1
fi

# Activate venv and start app
source venv/bin/activate

echo "Starting FastAPI backend on http://localhost:8000"
echo "Press Ctrl+C to stop"
echo ""

python app.py
