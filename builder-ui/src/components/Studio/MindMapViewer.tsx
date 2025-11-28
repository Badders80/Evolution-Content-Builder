/**
 * Mind Map Viewer - Renders Mermaid.js mind maps
 */
import { useEffect, useRef } from 'react'
import type { MindMapResponse } from '../../lib/studioApi'

interface MindMapViewerProps {
  data: MindMapResponse
}

export default function MindMapViewer({ data }: MindMapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Dynamically load mermaid and render
    const renderMermaid = async () => {
      if (!containerRef.current) return
      
      try {
        // @ts-expect-error - mermaid loaded from CDN
        if (!window.mermaid) {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js'
          script.async = true
          await new Promise((resolve, reject) => {
            script.onload = resolve
            script.onerror = reject
            document.head.appendChild(script)
          })
        }
        
        // @ts-expect-error - mermaid loaded from CDN
        window.mermaid.initialize({ startOnLoad: false, theme: 'default' })
        
        const id = `mermaid-${Date.now()}`
        // @ts-expect-error - mermaid loaded from CDN
        const { svg } = await window.mermaid.render(id, data.content)
        
        if (containerRef.current) {
          containerRef.current.innerHTML = svg
        }
      } catch (err) {
        console.error('Mermaid render error:', err)
        if (containerRef.current) {
          containerRef.current.innerHTML = `<pre class="text-sm text-red-600">Error rendering mind map</pre>`
        }
      }
    }
    
    renderMermaid()
  }, [data.content])

  const handleCopyCode = () => {
    navigator.clipboard.writeText(data.content)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-800">🗺️ {data.title}</h3>
        <button
          onClick={handleCopyCode}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Copy Mermaid Code
        </button>
      </div>
      
      <div 
        ref={containerRef}
        className="bg-gray-50 rounded-lg p-4 min-h-[200px] flex items-center justify-center overflow-auto"
      >
        <div className="animate-pulse text-gray-400">Loading mind map...</div>
      </div>
      
      <details className="mt-3">
        <summary className="text-xs text-gray-500 cursor-pointer">View source code</summary>
        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
          {data.content}
        </pre>
      </details>
    </div>
  )
}
