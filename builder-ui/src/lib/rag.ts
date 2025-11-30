/**
 * RAG helper for Evolution Content Builder frontend.
 * Query the knowledge base from React components.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface RAGResponse {
  answer: string;
  sources: Array<{
    document_id: string;
    content: string;
    title?: string;
  }>;
  query: string;
}

/**
 * Query the RAG endpoint for grounded answers.
 */
export async function rag(query: string, maxResults = 5): Promise<RAGResponse> {
  const response = await fetch(`${API_URL}/api/rag`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, max_results: maxResults }),
  });

  if (!response.ok) {
    throw new Error(`RAG query failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get information about a specific horse.
 */
export async function getHorseInfo(horseName: string): Promise<RAGResponse> {
  return rag(`What do we know about ${horseName}? Include recent updates, race history, and trainer notes.`);
}

/**
 * Get trainer notes for a horse.
 */
export async function getTrainerNotes(horseName: string): Promise<RAGResponse> {
  return rag(`What are the latest trainer notes and updates for ${horseName}?`);
}

/**
 * Get NZTR rules on a specific topic.
 */
export async function getNZTRRules(topic: string): Promise<RAGResponse> {
  return rag(`Explain the NZTR rules and requirements for ${topic}.`);
}

/**
 * Generate content using RAG context.
 */
export async function generateWithRAG(
  contentType: 'investor' | 'social' | 'tiktok' | 'report',
  topic: string
): Promise<RAGResponse> {
  const prompts = {
    investor: `Write an investor update about ${topic}. Use an understated, confident tone.`,
    social: `Write a LinkedIn post about ${topic}. Keep it concise and professional.`,
    tiktok: `Write a short TikTok script about ${topic}. Make it punchy and engaging.`,
    report: `Write a detailed report about ${topic}. Include all relevant facts and figures.`,
  };

  return rag(prompts[contentType]);
}
