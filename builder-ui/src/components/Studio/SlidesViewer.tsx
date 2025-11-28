/**
 * Slides Viewer - Displays generated presentation slides
 */
import { useState } from 'react'
import type { SlidesResponse } from '../../lib/studioApi'

interface SlidesViewerProps {
  data: SlidesResponse
}

export default function SlidesViewer({ data }: SlidesViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = data.slides
  const slide = slides[currentSlide]

  const handlePrev = () => {
    setCurrentSlide((prev) => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))
  }

  const handleOpenPresentation = () => {
    const blob = new Blob([data.html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-800">📊 {data.title}</h3>
        <button
          onClick={handleOpenPresentation}
          className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >
          Open Full Presentation
        </button>
      </div>

      {/* Slide preview */}
      <div className="bg-gray-900 rounded-lg p-8 min-h-[300px] text-white">
        {slide?.type === 'title' ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">{slide.title}</h1>
            {slide.subtitle && <p className="text-gray-300">{slide.subtitle}</p>}
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold mb-4">{slide?.title}</h2>
            <ul className="space-y-2">
              {slide?.bullets?.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-3">
        <button
          onClick={handlePrev}
          disabled={currentSlide === 0}
          className="px-3 py-1 text-sm border rounded disabled:opacity-50"
        >
          ← Previous
        </button>
        <span className="text-sm text-gray-600">
          Slide {currentSlide + 1} of {slides.length}
        </span>
        <button
          onClick={handleNext}
          disabled={currentSlide === slides.length - 1}
          className="px-3 py-1 text-sm border rounded disabled:opacity-50"
        >
          Next →
        </button>
      </div>

      {/* Speaker notes */}
      {slide?.notes && (
        <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-xs font-medium text-yellow-800 mb-1">Speaker Notes:</p>
          <p className="text-sm text-yellow-900">{slide.notes}</p>
        </div>
      )}

      {/* HTML toggle */}
      <details className="mt-3">
        <summary className="text-xs text-gray-500 cursor-pointer">View HTML</summary>
        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-48">
          {data.html}
        </pre>
      </details>
    </div>
  )
}
