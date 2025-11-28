import { useMemo, useState } from 'react'
import AppShell from './components/layout/AppShell'
import { stage1Analyze, stage1Rewrite } from './lib/api'
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

  const toneLabel = useMemo(() => toneFromSlider(toneValue), [toneValue])

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
                <textarea
                  rows={12}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste trainer notes, race updates, or announcements..."
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-inner focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
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
