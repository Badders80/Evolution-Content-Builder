# Frontend Contract (Content Builder x Seek)

This document defines the payload shapes and expectations for the UI layers (Stage 1/2/3) so the frontend can ship independently of backend iteration.

## Reference Flow

```
Stage 1 (Input Console)
  - Toggle: Raw Paste | RAG Research
  - DraftState (Zustand) captures raw text + RAG queries
  - POST /api/rag (or /api/seek) for generation

Stage 2 (Structured Refinery)
  - Dynamic Editor Container renders based on type
    • Structured Text Form
    • Slide Deck Editor
    • Mermaid MindMap Viewer
  - StructuredState (Zustand) holds normalized payloads
  - Validate API (/api/validate-text) for Brand Guardian (tone, hype, compliance)
  - Citations: `[Source 1]` hover shows snippet metadata

Stage 3 (Output & Preview)
  - Renderer API (/api/render or /api/export-pdf) returns HTML/PDF
  - Sandboxed iframe preview (WeasyPrint HTML)
  - Export buttons (PDF, HTML)
  - Layout Assistant chat updates layout config
```

## Payload Shapes

### Structured Text (Stage 2 default)
```json
{
  "preset": "trainer-update",
  "headline": "Sample Headline",
  "subheadline": "Short supporting line",
  "body": ["Paragraph 1", "Paragraph 2"],
  "key_points": ["Point A", "Point B"],
  "quote": "Quoted line",
  "quote_by": "Speaker",
  "social_caption": "Short social caption",
  "cta": "Call to action",
  "meta": {
    "word_count": 180,
    "readability_band": "good",
    "keywords": ["form", "fitness"]
  },
  "citations": [
    {"id": "Source 1", "snippet": "context...", "uri": "doc://vertex/123"}
  ]
}
```

### Slide Deck
```json
{
  "type": "slides",
  "title": "Presentation",
  "slides": [
    {
      "title": "Slide 1",
      "bullets": ["Point 1", "Point 2"],
      "notes": "Speaker notes",
      "media": []
    },
    {
      "title": "Slide 2",
      "bullets": ["Point A", "Point B"],
      "notes": "",
      "media": []
    }
  ],
  "html": "<section>...</section>"
}
```

### Mindmap (Mermaid)
```json
{
  "type": "mindmap",
  "format": "mermaid",
  "content": "graph TD; A-->B; B-->C;",
  "title": "Mindmap Title"
}
```

### Validation Response (Brand Guardian)
```json
{
  "scorecard": {
    "tone": 0.92,
    "hype": 0.08,
    "compliance": 0.9
  },
  "issues": [
    {
      "id": "tone_high",
      "severity": "warning",
      "message": "Tone is too promotional",
      "span": {"start": 120, "end": 150}
    },
    {
      "id": "missing_citation",
      "severity": "error",
      "message": "Claim needs a source",
      "span": null
    }
  ],
  "suggestions": [
    "Reduce hype words in paragraph 2",
    "Add citation to ownership claim"
  ]
}
```

### PDF Render Request/Response (target shape)
```json
// Request
{
  "html": "<html>...</html>",
  "filename": "evolution-report.pdf"
}

// Response (stream or URL)
{
  "ok": true,
  "filename": "evolution-report.pdf",
  "content_type": "application/pdf"
}
```

## API Endpoints (contract view)
- `/api/seek`: generation with optional grounding (Vertex) and web snippets (DDG). Returns `{ ok, answer, sources[], web_sources[], rewritten_query, grounded }`.
- `/api/rag`: retrieval + synthesis; returns `{ answer, sources[], query }`.
- `/api/stage1/analyze` and `/api/stage1/rewrite`: structured text pipeline for Stage 1.
- `/api/studio/generate`: polymorphic outputs: mindmap, slides, quiz, flashcards, audio_script, report, infographic.
- `/api/render` or `/api/export-pdf` (to be hooked to WeasyPrint): renders HTML/PDF for Stage 3 preview/export.
- `/api/auth/search-token`: JWT for Search widget (Vertex).
- `/health`: capability flags (seek, vertex_search_configured, duckduckgo_enabled).

## Implementation Notes for Frontend
- DraftState (Stage 1) stores raw input and RAG queries; StructuredState (Stage 2) stores normalized payloads above.
- Citations: expect `citations` array; render `[Source n]` markers with hover popovers showing `snippet`/`uri`.
- Web snippets: show separately from internal sources (DDG URLs vs internal doc IDs).
- PDF: backend render endpoint should be treated as the single source of truth; UI should not bundle client-side PDF libs.

