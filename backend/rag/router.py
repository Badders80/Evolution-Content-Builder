"""RAG endpoint - Query → Vertex Search → Gemini → Answer"""
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from dotenv import load_dotenv
from backend.logging_utils import log_event

load_dotenv()

router = APIRouter(prefix="/api/rag", tags=["rag"])

PROJECT_ID = os.getenv("GOOGLE_PROJECT_ID")
LOCATION = os.getenv("GOOGLE_LOCATION_ID", "global")
DATASTORE_ID = os.getenv("VERTEX_SEARCH_DATASTORE_ID")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


class RAGRequest(BaseModel):
    query: str
    max_results: Optional[int] = 5


class RAGResponse(BaseModel):
    answer: str
    sources: List[dict]
    query: str


@router.post("", response_model=RAGResponse)
async def rag_query(request: RAGRequest):
    """
    RAG endpoint: Search knowledge base → Ground with Gemini → Return answer.
    """
    try:
        # Step 1: Retrieve from Vertex AI Search (if configured)
        context = ""
        sources = []
        
        if PROJECT_ID and DATASTORE_ID:
            context, sources = await _search_vertex(request.query, request.max_results)
        
        # Step 2: Generate grounded answer with Gemini
        answer = await _generate_answer(request.query, context)
        log_event(
            "rag_query",
            ok=True,
            has_context=bool(context),
            source_count=len(sources),
        )
        return RAGResponse(
            answer=answer,
            sources=sources,
            query=request.query
        )
    except Exception as e:
        log_event("rag_query_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


async def _search_vertex(query: str, max_results: int) -> tuple[str, list]:
    """Search Vertex AI Search datastore."""
    try:
        from google.cloud import discoveryengine_v1beta as discoveryengine
        
        client = discoveryengine.SearchServiceClient()
        
        serving_config = client.serving_config_path(
            project=PROJECT_ID,
            location="global",
            data_store=DATASTORE_ID,
            serving_config="default_serving_config",
        )
        
        request = discoveryengine.SearchRequest(
            serving_config=serving_config,
            query=query,
            page_size=max_results,
            query_expansion_spec={"condition": "AUTO"},
            spell_correction_spec={"mode": "AUTO"},
        )
        
        response = client.search(request)
        
        context_parts = []
        sources = []
        
        for result in response.results:
            doc = result.document
            data = doc.derived_struct_data or doc.struct_data or {}
            
            content = (
                data.get("snippets", [{}])[0].get("snippet")
                or data.get("extractive_answers", [{}])[0].get("content")
                or data.get("content")
                or ""
            )
            
            context_parts.append(content)
            sources.append({
                "document_id": doc.name,
                "content": content[:500],  # Truncate for response
                "title": data.get("title", ""),
            })
        
        return "\n\n".join(context_parts), sources
        
    except Exception as e:
        print(f"Vertex Search error: {e}")
        return "", []


async def _generate_answer(query: str, context: str) -> str:
    """Generate answer using Gemini."""
    import google.generativeai as genai
    
    if not GEMINI_API_KEY:
        return "Gemini API key not configured."
    
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.0-flash")
    
    if context:
        prompt = f"""You are the Evolution Stables knowledge assistant.

CONTEXT FROM KNOWLEDGE BASE:
{context}

USER QUESTION:
{query}

Provide a clear, accurate answer based on the context above. 
If the context doesn't contain relevant information, say so.
Use an understated, confident tone. No hype or buzzwords."""
    else:
        prompt = f"""You are the Evolution Stables knowledge assistant.

USER QUESTION:
{query}

Note: No documents were found in the knowledge base for this query.
Provide a helpful response, but note that this answer is not grounded in specific documents."""
    
    result = model.generate_content(prompt)
    return result.text
