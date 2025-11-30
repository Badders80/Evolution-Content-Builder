import os
from fastapi import FastAPI
import google.auth

from app import app as legacy_app  # reuse legacy routes/static mounts
from backend.google_seek.router import router as seek_router
from backend.rag.router import router as rag_router
from backend.auth.router import router as auth_router
from backend.web.router import router as web_router
from backend.google_seek.service import DDG_ENABLED, DDG_AVAILABLE, GEMINI_API_KEY, PROJECT_ID, DATA_STORE_ID

app: FastAPI = legacy_app

# Mount routers
app.include_router(seek_router, prefix="/api")
app.include_router(rag_router)
app.include_router(auth_router)
app.include_router(web_router)


def _vertex_search_configured() -> bool:
    """Check if Vertex Search can be used: env vars + ADC."""
    if not (PROJECT_ID and DATA_STORE_ID):
        return False
    try:
        google.auth.default()
        return True
    except Exception:
        return False


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "seek_enabled": bool(GEMINI_API_KEY or PROJECT_ID),
        "vertex_search_configured": _vertex_search_configured(),
        "duckduckgo_enabled": DDG_ENABLED and DDG_AVAILABLE,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("FASTAPI_PORT", "8000")))

