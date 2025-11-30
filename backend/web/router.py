from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import os

router = APIRouter(prefix="/api/web", tags=["web"])

# Check if DDG is available
DDG_AVAILABLE = False
try:
    from duckduckgo_search import DDGS
    DDG_AVAILABLE = True
except ImportError:
    pass

DDG_ENABLED = os.getenv("DDG_ENABLED", "true").lower() == "true"


class WebSearchRequest(BaseModel):
    query: str
    max_results: Optional[int] = 5
    region: Optional[str] = "wt-wt"  # Worldwide


class WebSearchResult(BaseModel):
    title: str
    url: str
    snippet: str


@router.get("/status")
async def web_status():
    """Web search status."""
    return {
        "ok": True,
        "ddg_available": DDG_AVAILABLE,
        "ddg_enabled": DDG_ENABLED,
    }


@router.post("/search")
async def web_search(request: WebSearchRequest):
    """
    Search the web using DuckDuckGo.
    Returns news and web results relevant to the query.
    """
    if not DDG_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="DuckDuckGo search not available. Install: pip install duckduckgo-search"
        )
    
    if not DDG_ENABLED:
        raise HTTPException(
            status_code=503,
            detail="DuckDuckGo search is disabled. Set DDG_ENABLED=true in .env"
        )
    
    try:
        results = []
        
        with DDGS() as ddgs:
            # Search web
            for r in ddgs.text(
                request.query,
                region=request.region,
                max_results=request.max_results
            ):
                results.append({
                    "title": r.get("title", ""),
                    "url": r.get("href", ""),
                    "snippet": r.get("body", ""),
                    "source": "web"
                })
        
        return {
            "query": request.query,
            "results": results,
            "count": len(results)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.post("/news")
async def web_news(request: WebSearchRequest):
    """
    Search news using DuckDuckGo.
    Returns recent news articles relevant to the query.
    """
    if not DDG_AVAILABLE or not DDG_ENABLED:
        raise HTTPException(status_code=503, detail="DuckDuckGo not available")
    
    try:
        results = []
        
        with DDGS() as ddgs:
            for r in ddgs.news(
                request.query,
                region=request.region,
                max_results=request.max_results
            ):
                results.append({
                    "title": r.get("title", ""),
                    "url": r.get("url", ""),
                    "snippet": r.get("body", ""),
                    "date": r.get("date", ""),
                    "source": r.get("source", ""),
                })
        
        return {
            "query": request.query,
            "results": results,
            "count": len(results)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"News search failed: {str(e)}")

