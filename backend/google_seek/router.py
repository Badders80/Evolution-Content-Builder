from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .service import EvolutionSeek

router = APIRouter()

seek_engine = EvolutionSeek()


class SeekRequest(BaseModel):
    query: str
    task: str = "general"
    dlp: bool = False


@router.post("/seek")
async def seek(request: SeekRequest):
    try:
        result = await seek_engine.generate_answer(
            user_query=request.query,
            task=request.task,
            enable_dlp=request.dlp,
        )
        return result
    except Exception as exc:  # surface clean error details to the caller
        raise HTTPException(status_code=500, detail=str(exc)) from exc

