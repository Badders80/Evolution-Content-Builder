from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.google_seek.router import router as seek_router
from backend.auth.router import router as auth_router
from backend.rag.router import router as rag_router

app = FastAPI(
    title="Evolution Seek Engine",
    description="NeuralSeek-Clone using Gemini 3.0 Pro + Vertex AI Search",
    version="1.0.0",
)

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(seek_router, prefix="/api")
app.include_router(auth_router)
app.include_router(rag_router)


@app.get("/")
def root():
    return {"status": "Evolution Seek Engine running"}

