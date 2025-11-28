export type PresetType = 'pre_race' | 'post_race' | 'race_announcement' | 'trainer_update'
export type AudienceType = 'investor' | 'owner' | 'social' | 'mixed'
export type ToneType = 'formal' | 'balanced' | 'conversational'
export type LengthType = 'short' | 'standard' | 'long'

export interface Stage1Section {
  id: string
  heading: string
  body: string
}

export interface Stage1Meta {
  word_count: number
  readability_band: 'very_short' | 'good' | 'long'
  keywords: string[]
}

export interface Stage1Content {
  preset: PresetType
  audience: AudienceType
  tone: ToneType
  length: LengthType
  headline: string
  subheadline: string
  sections: Stage1Section[]
  quote: string
  quote_by: string
  key_points: string[]
  social_caption: string
  meta: Stage1Meta
}

export interface Stage1AnalyzeRequest {
  text: string
}

export interface Stage1AnalyzeResponse extends Stage1Meta {}

export interface Stage1RewriteRequest {
  preset: PresetType
  audience: AudienceType
  tone: ToneType
  length: LengthType
  raw_text: string
}

export interface Stage1RewriteResponse extends Stage1Content {
  source?: string
  error?: string
  message?: string
}
