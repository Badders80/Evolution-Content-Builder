/**
 * Audio Script Viewer - Displays podcast-style script
 * Ready for text-to-speech conversion
 */
import { useState } from 'react'
import type { AudioScriptResponse } from '../../lib/studioApi'

interface AudioScriptViewerProps {
  data: AudioScriptResponse
}

export default function AudioScriptViewer({ data }: AudioScriptViewerProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    // Clean script for speech (remove [pause] markers)
    const cleanScript = data.script.replace(/\[pause\]/gi, '...')
    
    const utterance = new SpeechSynthesisUtterance(cleanScript)
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    
    window.speechSynthesis.speak(utterance)
    setIsSpeaking(true)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(data.script)
  }

  const handleDownload = () => {
    const blob = new Blob([data.script], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.title.replace(/\s+/g, '-').toLowerCase()}-script.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-800">🎙️ {data.title}</h3>
        <div className="flex gap-2">
          <button
            onClick={handleSpeak}
            className={`text-xs px-3 py-1 rounded ${
              isSpeaking 
                ? 'bg-red-600 text-white' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSpeaking ? '⏹ Stop' : '▶ Play'}
          </button>
          <button
            onClick={handleCopy}
            className="text-xs text-gray-600 hover:text-gray-800"
          >
            Copy
          </button>
          <button
            onClick={handleDownload}
            className="text-xs text-gray-600 hover:text-gray-800"
          >
            Download
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex gap-4 mb-3 text-sm text-gray-500">
        <span>📝 {data.word_count} words</span>
        <span>⏱️ ~{data.estimated_duration}</span>
      </div>

      {/* Script content */}
      <div className="bg-gray-50 rounded-lg p-4 max-h-[400px] overflow-y-auto">
        <div className="prose prose-sm max-w-none">
          {data.script.split('\n\n').map((paragraph, i) => (
            <p key={i} className="mb-3 text-gray-700 leading-relaxed">
              {paragraph.split('[pause]').map((part, j, arr) => (
                <span key={j}>
                  {part}
                  {j < arr.length - 1 && (
                    <span className="text-gray-400 mx-1">•••</span>
                  )}
                </span>
              ))}
            </p>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        💡 Tip: Use browser TTS to preview, or copy script to ElevenLabs/Google TTS for professional audio.
      </p>
    </div>
  )
}
