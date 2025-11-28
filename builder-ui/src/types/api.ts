export interface AnalyzeRequest {
  text: string
}

export interface AnalyzeResponse {
  word_count: number
  readability_band: string
  keywords: string[]
}

export type Preset = 'pre-race' | 'post-race' | 'race-announcement' | 'trainer-update'

export interface RewriteRequest {
  raw_text: string
  preset: Preset
  tone?: number
  length?: 'short' | 'standard' | 'long'
  audience?: 'investor' | 'owner' | 'social'
  style_flags?: string[]
}

export interface StructuredContent {
  preset: Preset
  headline: string
  subheadline: string
  body: string[]
  key_points: string[]
  quote: string
  quote_by: string
  social_caption: string
  cta: string
  source?: string
  error?: string
  message?: string
}

export interface RewriteResponse extends StructuredContent {}

export interface GenerateResponse {
  html: string
  slug: string
  template: string
}
