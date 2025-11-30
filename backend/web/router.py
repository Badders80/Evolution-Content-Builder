from fastapi import APIRouter

router = APIRouter(prefix="/api/web", tags=["web"])


@router.get("/status")
async def web_status():
    """Placeholder web router status."""
    return {"ok": True, "message": "Web router ready"}

