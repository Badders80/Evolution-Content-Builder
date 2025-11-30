from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .service import EvolutionSeek
from backend.logging_utils import log_event

router = APIRouter()

seek_engine = EvolutionSeek()


class SeekRequest(BaseModel):
    query: str
    task: str = "general"
    dlp: bool = False
    grounded: bool = False
    web: bool | None = None
    web_results: int = 5


@router.post("/seek")
async def seek(request: SeekRequest):
    try:
        # Automatic DDG defaults for race preview/update unless explicitly disabled
        auto_web = request.web
        if request.web is None and request.task in ["race_preview", "race_update"]:
            auto_web = True

        result = await seek_engine.generate_answer(
            user_query=request.query,
            task=request.task,
            enable_dlp=request.dlp,
            grounded=request.grounded,
            web=bool(auto_web),
            web_results=request.web_results,
        )
        log_event(
            "seek_request",
            ok=result.get("ok", True),
            task=request.task,
            grounded=request.grounded,
            web=bool(auto_web),
            has_sources=bool(result.get("sources")),
            has_web=bool(result.get("web_sources")),
        )
        return result
    except Exception as exc:  # surface clean error details to the caller
        log_event("seek_request_error", task=request.task, error=str(exc))
        raise HTTPException(status_code=500, detail=str(exc)) from exc
