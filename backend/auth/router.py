from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/search-token")
async def get_search_token():
    """Generate JWT token for Vertex AI Search widget."""
    try:
        from .jwt_service import generate_vertex_search_jwt
        token = generate_vertex_search_jwt()
        return {"token": token}
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unable to generate JWT: {str(e)}")
