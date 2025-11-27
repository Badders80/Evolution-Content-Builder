// API types matching the Pydantic models in app.py

export interface AnalyzeRequest {
  text: string
}

export interface AnalyzeResponse {
  sentiment: string
  keywords: string[]
  wordCount: number
  readability: string
  suggestions?: Array<{
    field: string
    content: string
    confidence: number
  }>
}

export interface SuggestRequest {
  text: string
  field: string
  tone: number
  temperature: number
  target_words: number
}

export interface SuggestResponse {
  headline?: string
  subheadline?: string
  body?: string
  quote?: string
  quote_by?: string
  polished: boolean
}
