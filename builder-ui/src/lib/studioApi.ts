/**
 * Evolution Content Builder — Studio API Client
 * 
 * NotebookLM-style content generation:
 * - Mind Map
 * - Slide Deck
 * - Quiz
 * - Flashcards
 * - Audio Overview
 * - Report
 */

export type StudioOutputType = 
  | 'mindmap'
  | 'slides'
  | 'quiz'
  | 'flashcards'
  | 'audio_script'
  | 'report'

export interface StudioType {
  name: string
  description: string
  icon: string
}

export interface MindMapResponse {
  type: 'mindmap'
  format: 'mermaid'
  content: string
  title: string
}

export interface Slide {
  slide_number: number
  type: 'title' | 'content' | 'error'
  title: string
  subtitle?: string
  bullets?: string[]
  notes?: string
}

export interface SlidesResponse {
  type: 'slides'
  format: 'json'
  slides: Slide[]
  html: string
  title: string
}

export interface QuizQuestion {
  question_number: number
  type: 'multiple_choice' | 'true_false' | 'error'
  question: string
  options?: string[]
  correct_answer: string
  explanation?: string
}

export interface QuizResponse {
  type: 'quiz'
  format: 'json'
  questions: QuizQuestion[]
  total_questions: number
}

export interface Flashcard {
  card_number: number
  front: string
  back: string
  category?: string
}

export interface FlashcardsResponse {
  type: 'flashcards'
  format: 'json'
  cards: Flashcard[]
  total_cards: number
}

export interface AudioScriptResponse {
  type: 'audio_script'
  format: 'text'
  script: string
  word_count: number
  estimated_duration: string
  title: string
}

export interface ReportResponse {
  type: 'report'
  format: 'markdown'
  content: string
  title: string
}

export type StudioResponse = 
  | MindMapResponse 
  | SlidesResponse 
  | QuizResponse 
  | FlashcardsResponse 
  | AudioScriptResponse 
  | ReportResponse

export async function getStudioTypes(): Promise<Record<string, StudioType>> {
  const response = await fetch('/studio/types')
  if (!response.ok) {
    throw new Error('Failed to fetch studio types')
  }
  return response.json()
}

export async function generateStudioContent(
  content: string,
  outputType: StudioOutputType,
  title?: string
): Promise<StudioResponse> {
  const response = await fetch('/studio/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content,
      output_type: outputType,
      title,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || error.message || 'Generation failed')
  }

  return response.json()
}
