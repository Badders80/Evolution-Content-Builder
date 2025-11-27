import { useState } from 'react'
import AppShell from './components/layout/AppShell'
import LeftPanel from './components/panels/LeftPanel'
import EditorPanel from './components/panels/EditorPanel'
import PreviewPanel from './components/panels/PreviewPanel'
import { analyzeContent, suggestContent } from './lib/api'
import type { AnalyzeResponse, SuggestResponse } from './types/api'

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

type FocusPanel = 'left' | 'editor' | 'preview'

function App() {
  // Layout State
  const [focusPanel, setFocusPanel] = useState<FocusPanel>('left')
  const [hasGenerated, setHasGenerated] = useState(false)
  
  // Template & LLM
  const [template, setTemplate] = useState('Post-Race Report')
  const [llm, setLlm] = useState('Gemini 2.0 Flash Exp')

  // Left Panel State
  const [rawContent, setRawContent] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([])
  const [tagline, setTagline] = useState('Champions in the Making')

  // Editor State
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [editorContent, setEditorContent] = useState('')
  const [tone, setTone] = useState(50)
  const [creativity, setCreativity] = useState(70)
  const [maxWords, setMaxWords] = useState(300)

  // Preview State
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'tablet' | 'phone'>('desktop')

  // API State
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null)
  const [suggestion, setSuggestion] = useState<SuggestResponse | null>(null)
  const [loadingAnalyze, setLoadingAnalyze] = useState(false)
  const [loadingSuggest, setLoadingSuggest] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Analyze Content
  const handleAnalyze = async () => {
    if (!rawContent.trim()) return

    setLoadingAnalyze(true)
    setErrorMessage(null)

    try {
      const result = await analyzeContent({ text: rawContent })
      setAnalysis(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Analysis failed'
      setErrorMessage(message)
      console.error('Analysis error:', error)
    } finally {
      setLoadingAnalyze(false)
    }
  }

  // Generate Suggestion (from left panel)
  const handleSuggest = async () => {
    if (!rawContent.trim()) return

    setLoadingSuggest(true)
    setErrorMessage(null)

    try {
      const result = await suggestContent({
        text: rawContent,
        field: 'body',
        tone: tone / 100,
        temperature: creativity / 100,
        target_words: maxWords,
      })
      setSuggestion(result)
      
      // Auto-apply to editor if we have content
      if (result.headline) setTitle(result.headline)
      if (result.subheadline) setSubtitle(result.subheadline)
      if (result.body) setEditorContent(result.body)
      // Show other panels now that we have content
      setHasGenerated(true)
      setFocusPanel('editor')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Suggestion failed'
      setErrorMessage(message)
      console.error('Suggestion error:', error)
    } finally {
      setLoadingSuggest(false)
    }
  }

  // Request Rewrite (from editor panel)
  const handleRequestRewrite = async () => {
    if (!editorContent.trim()) return

    setLoadingSuggest(true)
    setErrorMessage(null)

    try {
      const result = await suggestContent({
        text: editorContent,
        field: 'body',
        tone: tone / 100,
        temperature: creativity / 100,
        target_words: maxWords,
      })
      setSuggestion(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Rewrite failed'
      setErrorMessage(message)
      console.error('Rewrite error:', error)
    } finally {
      setLoadingSuggest(false)
    }
  }

  // Apply Suggestion
  const handleApplySuggestion = (content: string) => {
    setEditorContent(content)
  }

  return (
    <>
      <AppShell template={template}>
        {/* Phase 1: Input Panel (Full Width) */}
        {!hasGenerated && (
          <div className="w-full">
            <LeftPanel
              template={template}
              onTemplateChange={setTemplate}
              llm={llm}
              onLlmChange={setLlm}
              rawContent={rawContent}
              onRawContentChange={setRawContent}
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              selectedAssets={selectedAssets}
              onSelectedAssetsChange={setSelectedAssets}
              tagline={tagline}
              onTaglineChange={setTagline}
              onAnalyze={handleAnalyze}
              onSuggest={handleSuggest}
              loadingAnalyze={loadingAnalyze}
              loadingSuggest={loadingSuggest}
            />
          </div>
        )}

        {/* Phase 2: Editor + Preview (60/40 split) */}
        {hasGenerated && (
          <>
            {/* Editor Panel */}
            <div 
              onClick={() => setFocusPanel('editor')}
              className={`transition-all duration-300 ${
                focusPanel === 'editor' ? 'w-[60%]' : 'w-[40%]'
              }`}
            >
              <EditorPanel
                title={title}
                onTitleChange={setTitle}
                subtitle={subtitle}
                onSubtitleChange={setSubtitle}
                editorContent={editorContent}
                onEditorContentChange={setEditorContent}
                tone={tone}
                onToneChange={setTone}
                creativity={creativity}
                onCreativityChange={setCreativity}
                maxWords={maxWords}
                onMaxWordsChange={setMaxWords}
                analysis={analysis}
                suggestion={suggestion}
                onRequestRewrite={handleRequestRewrite}
                onApplySuggestion={handleApplySuggestion}
                loadingSuggest={loadingSuggest}
              />
            </div>

            {/* Preview Panel - Auto mobile when minimized */}
            <div 
              onClick={() => setFocusPanel('preview')}
              className={`transition-all duration-300 ${
                focusPanel === 'preview' ? 'w-[60%]' : 'w-[40%]'
              }`}
            >
              <PreviewPanel
                template={template}
                title={title}
                subtitle={subtitle}
                content={editorContent}
                tagline={tagline}
                devicePreview={focusPanel === 'preview' ? devicePreview : 'phone'}
                onDevicePreviewChange={setDevicePreview}
                isMinimized={focusPanel !== 'preview'}
              />
            </div>
          </>
        )}
      </AppShell>

      {/* Error Toast - Tailwind Plus Alert */}
      {errorMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-96">
          <div className="rounded-md bg-red-50 p-4 shadow-lg ring-1 ring-red-600/10">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
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
    </>
  )
}

export default App
