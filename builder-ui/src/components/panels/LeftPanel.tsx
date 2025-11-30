// @ts-nocheck
import { useState } from 'react'

interface Asset {
  id: string
  label: string
  url: string
}

interface Attachment {
  id: string
  name: string
  url?: string
}

interface LeftPanelProps {
  template: string
  onTemplateChange: (template: string) => void
  llm: string
  onLlmChange: (llm: string) => void
  rawContent: string
  onRawContentChange: (content: string) => void
  attachments: Attachment[]
  onAttachmentsChange: (attachments: Attachment[]) => void
  selectedAssets: Asset[]
  onSelectedAssetsChange: (assets: Asset[]) => void
  tagline: string
  onTaglineChange: (tagline: string) => void
  onAnalyze: () => void
  onSuggest: () => void
  loadingAnalyze: boolean
  loadingSuggest: boolean
}

const TEMPLATES = [
  'Post-Race Report',
  'Race Day Update',
  'Owner Update',
  'Trainer Update',
  'Pre-Race Preview',
]

const LLMS = [
  'Gemini 2.0 Flash Exp',
  'Gemini 1.5 Pro',
  'Mistral 7B (Local)',
]

const TAGLINES = [
  'Champions in the Making',
  'Excellence in Every Stride',
  'Where Legends Are Born',
  'Racing Towards Greatness',
  'Custom...',
]

const PLACEHOLDER_ASSETS: Asset[] = [
  { id: '1', label: 'Logo', url: '/assets/Evolution+Logo.svg' },
  { id: '2', label: 'Crest', url: '/assets/Evolution-Stables-Logo.png' },
  { id: '3', label: 'Photo 1', url: '/assets/Bruno.jpg' },
  { id: '4', label: 'Photo 2', url: '/assets/Bruno.jpg' },
]

export default function LeftPanel({
  template,
  onTemplateChange,
  llm,
  onLlmChange,
  rawContent,
  onRawContentChange,
  attachments,
  onAttachmentsChange,
  selectedAssets,
  onSelectedAssetsChange,
  tagline,
  onTaglineChange,
  onAnalyze,
  onSuggest,
  loadingAnalyze,
  loadingSuggest,
}: LeftPanelProps) {
  const [dragActive, setDragActive] = useState(false)
  const [customTagline, setCustomTagline] = useState('')
  const [inputMode, setInputMode] = useState<'text' | 'research'>('text')
  const [researchQuery, setResearchQuery] = useState('')
  const [researchLoading, setResearchLoading] = useState(false)
  const isCustomTagline = tagline === 'Custom...' || !TAGLINES.includes(tagline)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    const newAttachments: Attachment[] = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      url: URL.createObjectURL(file),
    }))

    onAttachmentsChange([...attachments, ...newAttachments])
  }

  const removeAttachment = (id: string) => {
    onAttachmentsChange(attachments.filter((a) => a.id !== id))
  }

  const toggleAsset = (asset: Asset) => {
    const isSelected = selectedAssets.some((a) => a.id === asset.id)
    if (isSelected) {
      onSelectedAssetsChange(selectedAssets.filter((a) => a.id !== asset.id))
    } else {
      onSelectedAssetsChange([...selectedAssets, asset])
    }
  }

  const handleTaglineChange = (value: string) => {
    if (value === 'Custom...') {
      onTaglineChange(customTagline || '')
    } else {
      onTaglineChange(value)
    }
  }

  const handleResearch = async () => {
    if (!researchQuery.trim()) return
    
    setResearchLoading(true)
    try {
      const response = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: researchQuery, max_results: 5 })
      })
      
      if (!response.ok) {
        throw new Error('Research failed')
      }
      
      const data = await response.json()
      
      // Append research results to raw content
      let researchText = `[Research: ${researchQuery}]\n\n${data.answer}\n\n`
      if (data.sources && data.sources.length > 0) {
        researchText += 'Sources:\n' + data.sources.map((s: any) => `- ${s.title || s.url}`).join('\n')
      }
      
      onRawContentChange(rawContent + (rawContent ? '\n\n' : '') + researchText)
      setResearchQuery('')
    } catch (error) {
      console.error('Research error:', error)
      alert('Research failed. Check console for details.')
    } finally {
      setResearchLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-gray-100">
      {/* Centered Content Container */}
      <div className="mx-auto w-full max-w-3xl px-8 py-10">
        
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create Content</h2>
          <p className="mt-1 text-sm text-gray-600">Configure your content settings and paste your source material.</p>
        </div>

        {/* Settings Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Settings</h3>
          <div className="grid grid-cols-3 gap-4">
            {/* Template */}
            <div>
              <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1">
                Template
              </label>
              <select
                id="template"
                value={template}
                onChange={(e) => onTemplateChange(e.target.value)}
                className="block w-full rounded-lg border-gray-300 bg-gray-50 py-2.5 pl-3 pr-8 text-sm focus:border-gray-500 focus:ring-gray-500"
              >
                {TEMPLATES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* AI Model */}
            <div>
              <label htmlFor="llm" className="block text-sm font-medium text-gray-700 mb-1">
                AI Model
              </label>
              <select
                id="llm"
                value={llm}
                onChange={(e) => onLlmChange(e.target.value)}
                className="block w-full rounded-lg border-gray-300 bg-gray-50 py-2.5 pl-3 pr-8 text-sm focus:border-gray-500 focus:ring-gray-500"
              >
                {LLMS.map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>

            {/* Tagline */}
            <div>
              <label htmlFor="tagline" className="block text-sm font-medium text-gray-700 mb-1">
                Tagline
              </label>
              <select
                id="tagline"
                value={isCustomTagline ? 'Custom...' : tagline}
                onChange={(e) => handleTaglineChange(e.target.value)}
                className="block w-full rounded-lg border-gray-300 bg-gray-50 py-2.5 pl-3 pr-8 text-sm focus:border-gray-500 focus:ring-gray-500"
              >
                {TAGLINES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Tagline Input */}
          {isCustomTagline && (
            <div className="mt-4">
              <input
                type="text"
                value={isCustomTagline ? tagline : customTagline}
                onChange={(e) => {
                  setCustomTagline(e.target.value)
                  onTaglineChange(e.target.value)
                }}
                placeholder="Enter custom tagline..."
                className="block w-full rounded-lg border-gray-300 bg-gray-50 py-2 px-3 text-sm focus:border-gray-500 focus:ring-gray-500"
              />
            </div>
          )}
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Source Content</h3>
            
            {/* Input Mode Toggle */}
            <div className="flex gap-2 rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => setInputMode('text')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  inputMode === 'text'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Raw Text
              </button>
              <button
                onClick={() => setInputMode('research')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  inputMode === 'research'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🔍 Research
              </button>
            </div>
          </div>

          {inputMode === 'text' ? (
            <textarea
              id="content"
              value={rawContent}
              onChange={(e) => onRawContentChange(e.target.value)}
              placeholder="Paste your raw content here (race notes, transcripts, updates)..."
              rows={8}
              className="block w-full rounded-lg border-gray-300 bg-gray-50 py-3 px-4 text-sm focus:border-gray-500 focus:ring-gray-500 resize-none"
            />
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={researchQuery}
                  onChange={(e) => setResearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleResearch()}
                  placeholder="Ask a question... (e.g., 'Summarise First Gear's last race')"
                  className="block w-full rounded-lg border-gray-300 bg-gray-50 py-3 px-4 text-sm focus:border-gray-500 focus:ring-gray-500"
                  disabled={researchLoading}
                />
                <button
                  onClick={handleResearch}
                  disabled={!researchQuery.trim() || researchLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {researchLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
              
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-xs text-blue-900">
                  <strong>Research Mode:</strong> Ask questions about horses, races, or owners. 
                  Results will be added to your content automatically.
                </p>
              </div>
              
              {rawContent && (
                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">Current Content:</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">{rawContent}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Assets Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Brand Assets</h3>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {PLACEHOLDER_ASSETS.map((asset) => {
              const isSelected = selectedAssets.some((a) => a.id === asset.id)
              return (
                <button
                  key={asset.id}
                  onClick={() => toggleAsset(asset)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    isSelected 
                      ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-2' 
                      : 'border-gray-200 hover:border-gray-400 bg-gray-50'
                  }`}
                >
                  <img
                    src={asset.url}
                    alt={asset.label}
                    className="w-full h-full object-contain"
                  />
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              )
            })}
            {/* Add More Button */}
            <button className="flex-shrink-0 w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-500 transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Attachments Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Attachments</h3>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`flex items-center justify-center rounded-lg border-2 border-dashed px-6 py-5 transition-colors ${
              dragActive ? 'border-gray-500 bg-gray-100' : 'border-gray-300 bg-gray-50'
            }`}
          >
            <div className="text-center">
              <svg className="mx-auto h-8 w-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="mt-2 flex items-center justify-center gap-1 text-sm text-gray-600">
                <label htmlFor="file-upload" className="cursor-pointer font-semibold text-gray-900 hover:text-gray-700">
                  Upload files
                </label>
                <span>or drag and drop</span>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple />
              </div>
            </div>
          </div>

          {/* Uploaded Files */}
          {attachments.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {attachments.map((file) => (
                <div key={file.id} className="inline-flex items-center gap-2 rounded-lg bg-gray-100 border border-gray-200 px-3 py-1.5 text-sm">
                  <span className="truncate max-w-[150px] font-medium">{file.name}</span>
                  <button onClick={() => removeAttachment(file.id)} className="text-gray-500 hover:text-gray-700">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onSuggest}
          disabled={!rawContent.trim() || loadingSuggest}
          className="w-full rounded-xl bg-gray-900 px-6 py-4 text-sm font-semibold text-white shadow-lg hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loadingSuggest ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </span>
          ) : (
            'Generate Content'
          )}
        </button>

      </div>
    </div>
  )
}
