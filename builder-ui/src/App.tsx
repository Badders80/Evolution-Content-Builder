/**
 * Evolution Content Builder — Main Application
 * 
 * This is the entry point for the React frontend.
 * It orchestrates the 3-stage content pipeline:
 * 
 * Stage 1: Text Creation — Convert raw input to structured JSON
 * Stage 2: Refinement — Polish content, enforce brand tone
 * Stage 3: Output — Render to HTML/PDF, apply layouts
 * 
 * Architecture principles:
 * - All brand rules loaded from /config (see lib/config.ts)
 * - Each stage is isolated; they cannot bleed into each other
 * - AI outputs are validated against schemas
 * - The system is deterministic, not a chatbot
 * 
 * See BUILD_PHILOSOPHY.md for complete architectural guidance.
 */
import { useMemo, useState } from 'react'
import AppShell from './components/layout/AppShell'
import { stage1Analyze, stage1Rewrite } from './lib/api'
import { StudioPanel } from './components/Studio'
import type { Stage1AnalyzeResponse, Stage1Content, Stage1RewriteRequest, Stage1RewriteResponse, ToneType, LengthType, AudienceType, PresetType } from './types/stage1'

const PRESET_OPTIONS: { value: PresetType; label: string }[] = [
  { value: 'pre_race', label: 'Pre-race' },
  { value: 'post_race', label: 'Post-race' },
  { value: 'race_announcement', label: 'Race announcement' },
  { value: 'trainer_update', label: 'Trainer update' },
]

const AUDIENCE_OPTIONS: { value: AudienceType; label: string }[] = [
  { value: 'investor', label: 'Investors' },
  { value: 'owner', label: 'Owners' },
  { value: 'social', label: 'Social' },
  { value: 'mixed', label: 'Mixed' },
]

const toneFromSlider = (value: number): ToneType => {
  if (value < 34) return 'formal'
  if (value < 67) return 'balanced'
  return 'conversational'
}

function App() {
  const [rawText, setRawText] = useState('')
  const [preset, setPreset] = useState<PresetType>('post_race')
  const [audience, setAudience] = useState<AudienceType>('investor')
  const [toneValue, setToneValue] = useState(50)
  const [lengthPreference, setLengthPreference] = useState<LengthType>('standard')
  const [analysis, setAnalysis] = useState<Stage1AnalyzeResponse | null>(null)
  const [content, setContent] = useState<Stage1Content | null>(null)
  const [loadingAnalyze, setLoadingAnalyze] = useState(false)
  const [loadingRewrite, setLoadingRewrite] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Multi-input state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)

  const toneLabel = useMemo(() => toneFromSlider(toneValue), [toneValue])

  // Handle file upload
  const handleFileUpload = (files: FileList | null) => {
    if (!files) return
    const newFiles = Array.from(files).filter(f => 
      f.type.startsWith('image/') || 
      f.type === 'application/pdf' || 
      f.type.startsWith('text/') ||
      f.type.startsWith('audio/') ||
      f.name.endsWith('.m4a') ||
      f.name.endsWith('.mp3') ||
      f.name.endsWith('.wav')
    )
    setUploadedFiles(prev => [...prev, ...newFiles])
    
    // Auto-extract text from text files
    newFiles.forEach(file => {
      if (file.type.startsWith('text/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const text = e.target?.result as string
          setRawText(prev => prev + (prev ? '\n\n' : '') + text)
        }
        reader.readAsText(file)
      }
    })
  }

  // Handle drag events
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
    handleFileUpload(e.dataTransfer.files)
  }

  // Handle URL input
  const handleAddUrl = () => {
    if (urlInput.trim()) {
      setRawText(prev => prev + (prev ? '\n\n' : '') + `Source URL: ${urlInput.trim()}`)
      setUrlInput('')
      setShowUrlInput(false)
    }
  }

  // Remove uploaded file
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleAnalyze = async () => {
    if (!rawText.trim()) return
    setLoadingAnalyze(true)
    setErrorMessage(null)
    try {
      const res = await stage1Analyze({ text: rawText })
      setAnalysis(res)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed'
      setErrorMessage(message)
    } finally {
      setLoadingAnalyze(false)
    }
  }

  const handleRewrite = async (overrides?: Partial<Stage1RewriteRequest>) => {
    if (!rawText.trim()) return
    setLoadingRewrite(true)
    setErrorMessage(null)
    try {
      const res: Stage1RewriteResponse = await stage1Rewrite({
        raw_text: rawText,
        preset,
        audience,
        tone: toneLabel,
        length: lengthPreference,
        ...overrides,
      })
      setContent(res)
      if (res.error) {
        setErrorMessage(res.message || 'Rewrite returned an error')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Rewrite failed'
      setErrorMessage(message)
    } finally {
      setLoadingRewrite(false)
    }
  }

  return (
    <AppShell template="Stage 1 — Text Creation">
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Stage 1</p>
              <h1 className="text-2xl font-semibold text-gray-900">Text Creation & Refinement</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                Raw → Structured JSON
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Controls + Raw Input */}
            <section className="lg:col-span-5 space-y-4 rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm ring-1 ring-gray-100">
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">Preset</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {PRESET_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setPreset(opt.value)}
                        className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                          preset === opt.value
                            ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
                            : 'border-gray-200 bg-white text-gray-800 hover:border-gray-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">Audience</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {AUDIENCE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setAudience(opt.value)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                          audience === opt.value
                            ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
                            : 'border-gray-200 bg-white text-gray-800 hover:border-gray-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Tone</p>
                      <span className="text-xs font-semibold text-gray-900">{toneLabel}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={toneValue}
                      onChange={(e) => setToneValue(Number(e.target.value))}
                      className="mt-2 w-full accent-gray-900"
                    />
                    <div className="mt-1 flex justify-between text-[11px] text-gray-500">
                      <span>Formal</span>
                      <span>Balanced</span>
                      <span>Conversational</span>
                    </div>
                  </div>
                </div>

                <div className="col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Length</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(['short', 'standard', 'long'] as LengthType[]).map((len) => (
                      <button
                        key={len}
                        onClick={() => setLengthPreference(len)}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                          lengthPreference === len
                            ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
                            : 'border-gray-200 bg-white text-gray-800 hover:border-gray-400'
                        }`}
                      >
                        {len.charAt(0).toUpperCase() + len.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800">Raw input</label>
                
                {/* Drag & Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative rounded-xl border-2 border-dashed transition ${
                    dragActive
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <textarea
                    rows={8}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste trainer notes, race updates, or announcements...&#10;&#10;Or drag & drop files here"
                    className="w-full rounded-xl border-0 bg-transparent px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-0"
                  />
                  {dragActive && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-gray-900/5">
                      <p className="text-sm font-semibold text-gray-700">Drop files here</p>
                    </div>
                  )}
                </div>

                {/* File Upload & URL Buttons */}
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload File
                    <input
                      type="file"
                      multiple
                      accept="image/*,application/pdf,text/*,audio/*,.m4a,.mp3,.wav"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                    />
                  </label>
                  
                  <button
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Add URL
                  </button>
                </div>

                {/* URL Input (conditional) */}
                {showUrlInput && (
                  <div className="flex gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/article"
                      className="flex-1 rounded-md border-0 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
                    />
                    <button
                      onClick={handleAddUrl}
                      className="rounded-md bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-800"
                    >
                      Add
                    </button>
                  </div>
                )}

                {/* Uploaded Files Display */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-1 rounded-lg border border-gray-200 bg-gray-50 p-2">
                    <p className="text-xs font-semibold text-gray-600">Attached Files:</p>
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-md bg-white px-2 py-1">
                        <div className="flex items-center gap-2">
                          {file.type.startsWith('image/') && (
                            <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                          {(file.type.startsWith('audio/') || file.name.endsWith('.m4a')) && (
                            <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                          )}
                          <span className="text-xs text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          onClick={() => removeFile(idx)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleAnalyze}
                    disabled={!rawText.trim() || loadingAnalyze}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loadingAnalyze && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />}
                    Analyse
                  </button>
                  <button
                    onClick={() => handleRewrite()}
                    disabled={!rawText.trim() || loadingRewrite}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-900 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:border-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loadingRewrite && <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900/60 border-t-transparent" />}
                    AI Rewrite
                  </button>
                  <button
                    onClick={() => setRawText('')}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:text-gray-900"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-600">Analysis</p>
                  {analysis ? (
                    <span className="text-xs font-semibold text-gray-700">
                      {analysis.word_count} words • {analysis.readability_band}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">Run analyse</span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {analysis?.keywords?.length ? (
                    analysis.keywords.map((kw) => (
                      <span key={kw} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-800 ring-1 ring-inset ring-gray-200">
                        {kw}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500">Keywords appear here after analyse.</span>
                  )}
                </div>
              </div>

              {/* Studio Panel - NotebookLM-style features */}
              <StudioPanel 
                content={rawText} 
                title={content?.headline || undefined}
              />
            </section>

            {/* Structured Output */}
            <section className="lg:col-span-7 space-y-4 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">Structured JSON</p>
                  <h2 className="text-lg font-semibold text-gray-900">Stage1Content</h2>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRewrite({ length: 'short' })}
                    disabled={!rawText.trim() || loadingRewrite}
                    className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-800 transition hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Tighten
                  </button>
                  <button
                    onClick={() => handleRewrite({ audience: 'investor' })}
                    disabled={!rawText.trim() || loadingRewrite}
                    className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-800 transition hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Explain for investors
                  </button>
                </div>
              </div>

              {content ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-gray-700">
                      <span className="rounded-full bg-white px-3 py-1 ring-1 ring-inset ring-gray-200">Preset: {content.preset}</span>
                      <span className="rounded-full bg-white px-3 py-1 ring-1 ring-inset ring-gray-200">Audience: {content.audience}</span>
                      <span className="rounded-full bg-white px-3 py-1 ring-1 ring-inset ring-gray-200">Tone: {content.tone}</span>
                      <span className="rounded-full bg-white px-3 py-1 ring-1 ring-inset ring-gray-200">Length: {content.length}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Headline</p>
                    <p className="text-2xl font-semibold text-gray-900">{content.headline || '—'}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Subheadline</p>
                    <p className="text-lg text-gray-800">{content.subheadline || '—'}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sections</p>
                    {content.sections.length ? (
                      <div className="space-y-2">
                        {content.sections.map((section) => (
                          <div key={section.id} className="rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-inner">
                            <p className="text-sm font-semibold text-gray-900">{section.heading}</p>
                            <p className="mt-1 text-sm text-gray-800 whitespace-pre-line">{section.body}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No sections yet.</p>
                    )}
                  </div>

                  {content.key_points?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Key points</p>
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-gray-900">
                        {content.key_points.map((point, idx) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {content.quote && (
                    <blockquote className="rounded-lg border-l-4 border-gray-900 bg-gray-50 px-4 py-3 text-sm text-gray-800">
                      "{content.quote}"
                      {content.quote_by && <span className="ml-2 text-gray-600">— {content.quote_by}</span>}
                    </blockquote>
                  )}

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Social caption</p>
                    <p className="text-sm text-gray-900">{content.social_caption || '—'}</p>
                  </div>

                  {content.meta && (
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-600">Meta</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-800">
                        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-inset ring-gray-200">
                          {content.meta.word_count} words
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-inset ring-gray-200">
                          {content.meta.readability_band}
                        </span>
                        {content.meta.keywords.slice(0, 6).map((kw) => (
                          <span key={kw} className="rounded-full bg-white px-3 py-1 ring-1 ring-inset ring-gray-200">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full min-h-[300px] items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
                  Run "AI Rewrite" to see Stage1Content here.
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="fixed bottom-6 left-1/2 w-96 -translate-x-1/2">
          <div className="rounded-md bg-red-50 p-4 shadow-lg ring-1 ring-red-600/10">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{errorMessage}</p>
                </div>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setErrorMessage(null)}
                    className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}

export default App
