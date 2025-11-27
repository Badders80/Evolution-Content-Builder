import type { AnalyzeRequest, AnalyzeResponse, SuggestRequest, SuggestResponse } from '../types/api'

const API_BASE_URL = 'http://localhost:8000'

export async function analyzeContent(payload: AnalyzeRequest): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
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

export async function suggestContent(payload: SuggestRequest): Promise<SuggestResponse> {
  const response = await fetch(`${API_BASE_URL}/suggest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Suggestion failed: ${response.statusText}. ${errorText}`)
  }

  return response.json()
}

export async function healthCheck(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE_URL}/`)
  
  if (!response.ok) {
    throw new Error('Backend not reachable')
  }

  return response.json()
}
