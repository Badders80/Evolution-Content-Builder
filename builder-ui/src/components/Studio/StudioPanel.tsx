/**
 * Evolution Content Builder — Studio Panel
 * 
 * NotebookLM-style content generation interface.
 * Displays available output types and generated content.
 */
import { useState } from 'react'
import { 
  generateStudioContent, 
  type StudioOutputType, 
  type StudioResponse 
} from '../../lib/studioApi'
import MindMapViewer from './MindMapViewer'
import SlidesViewer from './SlidesViewer'
import QuizViewer from './QuizViewer'
import FlashcardsViewer from './FlashcardsViewer'
import AudioScriptViewer from './AudioScriptViewer'
import ReportViewer from './ReportViewer'
import InfographicsViewer from './InfographicsViewer'

interface StudioPanelProps {
  content: string
  title?: string
}

const STUDIO_OPTIONS: { type: StudioOutputType; name: string; icon: string; description: string }[] = [
  { type: 'mindmap', name: 'Mind Map', icon: '🗺️', description: 'Visual concept map' },
  { type: 'slides', name: 'Slide Deck', icon: '📊', description: 'Presentation slides' },
  { type: 'infographic', name: 'Infographic', icon: '📈', description: 'Charts & stats' },
  { type: 'quiz', name: 'Quiz', icon: '❓', description: 'Knowledge check' },
  { type: 'flashcards', name: 'Flashcards', icon: '🃏', description: 'Study cards' },
  { type: 'audio_script', name: 'Audio Overview', icon: '🎙️', description: 'Podcast script' },
  { type: 'report', name: 'Report', icon: '📄', description: 'Structured report' },
]

export default function StudioPanel({ content, title }: StudioPanelProps) {
  const [selectedType, setSelectedType] = useState<StudioOutputType | null>(null)
  const [result, setResult] = useState<StudioResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async (type: StudioOutputType) => {
    if (!content.trim()) {
      setError('Please enter some content first')
      return
    }

    setSelectedType(type)
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await generateStudioContent(content, type, title)
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const renderResult = () => {
    if (!result) return null

    switch (result.type) {
      case 'mindmap':
        return <MindMapViewer data={result} />
      case 'slides':
        return <SlidesViewer data={result} />
      case 'quiz':
        return <QuizViewer data={result} />
      case 'flashcards':
        return <FlashcardsViewer data={result} />
      case 'audio_script':
        return <AudioScriptViewer data={result} />
      case 'report':
        return <ReportViewer data={result} />
      case 'infographic':
        return <InfographicsViewer data={result} />
      default:
        return <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">✨</span>
        <h2 className="text-lg font-semibold text-gray-800">Studio</h2>
      </div>

      {/* Output type buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {STUDIO_OPTIONS.map((option) => (
          <button
            key={option.type}
            onClick={() => handleGenerate(option.type)}
            disabled={loading || !content.trim()}
            className={`
              flex flex-col items-center p-3 rounded-lg border transition-all
              ${selectedType === option.type && loading
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
              ${!content.trim() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span className="text-2xl mb-1">{option.icon}</span>
            <span className="text-xs font-medium text-gray-700">{option.name}</span>
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Generating {selectedType}...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="border-t border-gray-200 pt-4">
          {renderResult()}
        </div>
      )}

      {/* Empty state */}
      {!content.trim() && !loading && !result && (
        <p className="text-gray-500 text-sm text-center py-4">
          Enter content above to generate Studio outputs
        </p>
      )}
    </div>
  )
}
