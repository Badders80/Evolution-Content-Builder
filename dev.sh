#!/bin/bash

echo "🔥 Starting Evolution Content Builder..."
echo ""

# Kill any existing processes on our ports
fuser -k 8000/tcp 2>/dev/null
fuser -k 5173/tcp 2>/dev/null

# Activate venv and start backend
cd /mnt/e/Evolution-Content-Builder
source venv/bin/activate
python app.py &
BACKEND_PID=$!

# Start frontend
cd /mnt/e/Evolution-Content-Builder/builder-ui
npm run dev &
FRONTEND_PID=$!

# Wait for servers to start, then open browser
sleep 3
xdg-open http://localhost:5173 > /dev/null 2>&1 || explorer.exe http://localhost:5173 2>/dev/null || true

echo ""
echo "✅ Backend:  http://localhost:8000 (API only)"
echo "✅ Frontend: http://localhost:5173 (React UI)"
echo ""
echo "Press CTRL+C to stop everything."

# Clean shutdown on CTRL+C
cleanup() {
    echo ''
    echo '🛑 Stopping...'
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo '✅ Stopped.'
    exit 0
}
trap cleanup SIGINT SIGTERM

wait
