from typing import List, Optional
from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    text: str


class SuggestRequest(BaseModel):
    text: str
    field: str
    tone: float
    temperature: float
    target_words: int


class EditAnalyzeRequest(BaseModel):
    text: str


class RewriteRequest(BaseModel):
    raw_text: str
    preset: str
    tone: Optional[float] = 50
    length: Optional[str] = "standard"
    audience: Optional[str] = "owner"
    style_flags: Optional[List[str]] = None


class Stage1AnalyzeRequest(BaseModel):
    text: str


class Stage1Section(BaseModel):
    id: str
    heading: str
    body: str


class Stage1Content(BaseModel):
    preset: str
    audience: str
    tone: str
    length: str
    headline: str
    subheadline: str
    sections: List[Stage1Section]
    quote: str
    quote_by: str
    key_points: List[str]
    social_caption: str
    meta: dict
    source: Optional[str] = None
    error: Optional[str] = None
    message: Optional[str] = None


class Stage1RewriteRequest(BaseModel):
    preset: str = Field(..., description="pre_race | post_race | race_announcement | trainer_update")
    audience: str = Field(..., description="investor | owner | social | mixed")
    tone: str = Field(..., description="formal | balanced | conversational")
    length: str = Field(..., description="short | standard | long")
    raw_text: str


class StudioRequest(BaseModel):
    content: str
    output_type: str  # mindmap, slides, quiz, flashcards, audio_script, report
    title: Optional[str] = None

