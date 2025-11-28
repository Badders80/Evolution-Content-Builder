import type {
  AnalyzeRequest,
  AnalyzeResponse,
  GenerateResponse,
  RewriteRequest,
  RewriteResponse,
  StructuredContent,
} from '../types/api'
import type {
  Stage1AnalyzeRequest,
  Stage1AnalyzeResponse,
  Stage1RewriteRequest,
  Stage1RewriteResponse,
} from '../types/stage1'

// In dev, Vite proxy handles /api/* -> localhost:8000
// In production, served from same origin
const API_BASE_URL = ''

export async function analyzeContent(payload: AnalyzeRequest): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE_URL}/edit/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Analysis failed: ${response.statusText}. ${errorText}`)
  }

  return response.json()
}

export async function rewriteContent(payload: RewriteRequest): Promise<RewriteResponse> {
  const response = await fetch(`${API_BASE_URL}/edit/rewrite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Rewrite failed: ${response.statusText}. ${errorText}`)
  }

  return response.json()
}

export async function generateHtml(structured: StructuredContent): Promise<GenerateResponse> {
  const formData = new FormData()
  formData.append('structured', JSON.stringify(structured))

  const response = await fetch(`${API_BASE_URL}/api/generate`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Generate failed: ${response.statusText}. ${errorText}`)
  }

  return response.json()
}

export async function stage1Analyze(payload: Stage1AnalyzeRequest): Promise<Stage1AnalyzeResponse> {
  const response = await fetch(`${API_BASE_URL}/stage1/analyse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Stage1 analyse failed: ${response.status} ${text}`)
  }

  return response.json()
}

export async function stage1Rewrite(payload: Stage1RewriteRequest): Promise<Stage1RewriteResponse> {
  const response = await fetch(`${API_BASE_URL}/stage1/rewrite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Stage1 rewrite failed: ${response.status} ${text}`)
  }

  return response.json()
}
