// @ts-nocheck
import { useState } from 'react'
import type { AnalyzeResponse, SuggestResponse } from '../../types/api'

interface EditorPanelProps {
  title: string
  onTitleChange: (title: string) => void
  subtitle: string
  onSubtitleChange: (subtitle: string) => void
  editorContent: string
  onEditorContentChange: (content: string) => void
  tone: number
  onToneChange: (tone: number) => void
  creativity: number
  onCreativityChange: (creativity: number) => void
  maxWords: number
  onMaxWordsChange: (maxWords: number) => void
  analysis: AnalyzeResponse | null
  suggestion: SuggestResponse | null
  onRequestRewrite: () => void
  onApplySuggestion: (content: string) => void
  loadingSuggest: boolean
}

export default function EditorPanel({
  title,
  onTitleChange,
  subtitle,
  onSubtitleChange,
  editorContent,
  onEditorContentChange,
  tone,
  onToneChange,
  creativity,
  onCreativityChange,
  maxWords,
  onMaxWordsChange,
  analysis,
  suggestion,
  onRequestRewrite,
  onApplySuggestion,
  loadingSuggest,
}: EditorPanelProps) {
  const [showSuggestion, setShowSuggestion] = useState(false)

  const handleApply = () => {
    if (suggestion?.body) {
      onApplySuggestion(suggestion.body)
      setShowSuggestion(false)
    }
  }

  const handleCopy = () => {
    if (suggestion?.body) {
      navigator.clipboard.writeText(suggestion.body)
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-white">
      {/* Analysis Summary Bar - Tailwind Plus Stats */}
      {analysis && (
        <div className="border-b border-gray-200 bg-white">
          <dl className="grid grid-cols-4 divide-x divide-gray-200">
            <div className="px-4 py-4">
              <dt className="text-xs font-medium text-gray-500">Words</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">{analysis.wordCount}</dd>
            </div>
            <div className="px-4 py-4">
              <dt className="text-xs font-medium text-gray-500">Sentiment</dt>
              <dd className="mt-1 flex items-center gap-1.5">
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                  analysis.sentiment === 'positive'
                    ? 'bg-green-50 text-green-700 ring-green-600/20'
                    : analysis.sentiment === 'negative'
                    ? 'bg-red-50 text-red-700 ring-red-600/20'
                    : 'bg-gray-50 text-gray-600 ring-gray-500/10'
                }`}>
                  {analysis.sentiment}
                </span>
              </dd>
            </div>
            <div className="px-4 py-4">
              <dt className="text-xs font-medium text-gray-500">Readability</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">{analysis.readability}</dd>
            </div>
            <div className="px-4 py-4">
              <dt className="text-xs font-medium text-gray-500">Keywords</dt>
              <dd className="mt-1 flex flex-wrap gap-1">
                {analysis.keywords.slice(0, 3).map((kw, i) => (
                  <span key={i} className="inline-flex items-center rounded-md bg-evoGold/10 px-2 py-1 text-xs font-medium text-evoGold ring-1 ring-inset ring-evoGold/20">
                    {kw}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        <div className="mx-auto max-w-4xl space-y-4">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Enter headline..."
            className="w-full border-0 bg-transparent text-3xl font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
          />

          {/* Subtitle */}
          <input
            type="text"
            value={subtitle}
            onChange={(e) => onSubtitleChange(e.target.value)}
            placeholder="Enter subheadline (optional)..."
            className="w-full border-0 bg-transparent text-xl text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-0"
          />

          {/* Main Editor */}
          <div className="min-h-[400px] rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <textarea
              value={editorContent}
              onChange={(e) => onEditorContentChange(e.target.value)}
              placeholder="Start writing your content here...

You can use markdown formatting:
**bold** _italic_ [link](url)
- bullet points"
              className="h-full min-h-[400px] w-full resize-none border-0 bg-transparent font-mono text-sm leading-relaxed text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-0"
            />
          </div>
        </div>
      </div>

      {/* Controls Panel - Tailwind Plus */}
      <div className="border-t border-gray-200 bg-white p-6 shadow-lg">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Sliders */}
          <div className="grid grid-cols-3 gap-6">
            {/* Tone Slider */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Tone
                </label>
                <span className="text-sm font-semibold text-evoGold">
                  {tone < 33 ? 'Formal' : tone > 66 ? 'Casual' : 'Balanced'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={tone}
                onChange={(e) => onToneChange(Number(e.target.value))}
                className="mt-2 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-evoGold"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>Formal</span>
                <span>Casual</span>
              </div>
            </div>

            {/* Creativity Slider */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Creativity
                </label>
                <span className="text-sm font-semibold text-evoGold">{creativity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={creativity}
                onChange={(e) => onCreativityChange(Number(e.target.value))}
                className="mt-2 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-evoGold"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>Conservative</span>
                <span>Creative</span>
              </div>
            </div>

            {/* Max Words Slider */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Max Words
                </label>
                <span className="text-sm font-semibold text-evoGold">{maxWords}</span>
              </div>
              <input
                type="range"
                min="100"
                max="600"
                step="50"
                value={maxWords}
                onChange={(e) => onMaxWordsChange(Number(e.target.value))}
                className="mt-2 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-evoGold"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>100</span>
                <span>600</span>
              </div>
            </div>
          </div>

          {/* Rewrite Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onRequestRewrite()
                setShowSuggestion(true)
              }}
              disabled={!editorContent.trim() || loadingSuggest}
              className="rounded-md bg-evoGold px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-evoGoldDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-evoGold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingSuggest ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Asking Gemini...
                </span>
              ) : (
                'Ask Gemini for Rewrite'
              )}
            </button>

            {suggestion && showSuggestion && (
              <div className="flex gap-2">
                <button
                  onClick={handleApply}
                  className="rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Apply
                </button>
                <button
                  onClick={handleCopy}
                  className="rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Copy
                </button>
                <button
                  onClick={() => setShowSuggestion(false)}
                  className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* Suggestion Display - Tailwind Plus Notification */}
          {suggestion && showSuggestion && (
            <div className="rounded-lg bg-evoGold/5 p-4 ring-1 ring-evoGold/20">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-evoGold" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-gray-900">AI Suggestion</h3>
                  {suggestion.headline && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-500">Headline</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{suggestion.headline}</p>
                    </div>
                  )}
                  {suggestion.subheadline && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-500">Subheadline</p>
                      <p className="mt-1 text-sm text-gray-700">{suggestion.subheadline}</p>
                    </div>
                  )}
                  {suggestion.body && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-500">Body</p>
                      <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{suggestion.body}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
