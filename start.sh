#!/bin/bash

echo "-------------------------------------------------"
echo " 🚀 Evolution Content Builder — Starting Engine"
echo "-------------------------------------------------"

# Kill stale ports (8000 + 5173)
echo "🔧 Cleaning old processes..."
lsof -ti:8000 | xargs -r kill -9
lsof -ti:5173 | xargs -r kill -9

# Start backend
echo "🟢 Starting Backend (port 8000)..."
(uvicorn backend.main:app --port 8000 --reload > backend.log 2>&1 &)
sleep 2

# Start frontend
echo "🟣 Starting Frontend (port 5173)..."
(cd builder-ui && npm run dev > frontend.log 2>&1 &)
sleep 3

# Open browser
echo "🌐 Opening the Builder UI..."
if command -v xdg-open >/dev/null; then
    xdg-open http://localhost:5173
elif command -v open >/dev/null; then
    open http://localhost:5173
else
    echo "Please open: http://localhost:5173"
fi

echo "-------------------------------------------------"
echo " ✅ Evolution Engine is LIVE"
echo " 🧠 Backend: http://localhost:8000/health"
echo " 🎨 Frontend: http://localhost:5173"
echo "-------------------------------------------------"
