from fastapi import FastAPI
from backend.google_seek.router import router as seek_router

app = FastAPI(
    title="Evolution Seek Engine",
    description="NeuralSeek-Clone using Gemini 3.0 Pro + Vertex AI Search",
    version="1.0.0",
)

app.include_router(seek_router, prefix="/api")


@app.get("/")
def root():
    return {"status": "Evolution Seek Engine running"}

