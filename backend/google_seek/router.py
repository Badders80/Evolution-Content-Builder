from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .service import EvolutionSeek

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
        return result
    except Exception as exc:  # surface clean error details to the caller
        raise HTTPException(status_code=500, detail=str(exc)) from exc
