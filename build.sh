#!/bin/bash
# Build Evolution Content Builder for production

echo "🔨 Building Evolution Content Builder..."
echo ""

# Build React frontend
cd /mnt/e/Evolution-Content-Builder/builder-ui
echo "Building React frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build complete!"
    echo ""
    echo "To run in production:"
    echo "  cd /mnt/e/Evolution-Content-Builder"
    echo "  source venv/bin/activate"
    echo "  python app.py"
    echo ""
    echo "Access at: http://localhost:8000"
else
    echo ""
    echo "❌ Build failed!"
    exit 1
fi
