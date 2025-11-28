/**
 * Report Viewer - Displays generated markdown report
 */
import type { ReportResponse } from '../../lib/studioApi'

interface ReportViewerProps {
  data: ReportResponse
}

export default function ReportViewer({ data }: ReportViewerProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(data.content)
  }

  const handleDownload = () => {
    const blob = new Blob([data.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.title.replace(/\s+/g, '-').toLowerCase()}-report.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Simple markdown to HTML (basic conversion)
  const renderMarkdown = (md: string) => {
    return md
      .split('\n')
      .map((line, i) => {
        // Headers
        if (line.startsWith('### ')) {
          return <h4 key={i} className="text-md font-semibold mt-4 mb-2">{line.slice(4)}</h4>
        }
        if (line.startsWith('## ')) {
          return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.slice(3)}</h3>
        }
        if (line.startsWith('# ')) {
          return <h2 key={i} className="text-xl font-bold mt-4 mb-2">{line.slice(2)}</h2>
        }
        // Bullet points
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return <li key={i} className="ml-4">{line.slice(2)}</li>
        }
        // Bold
        if (line.includes('**')) {
          const parts = line.split(/\*\*(.*?)\*\*/g)
          return (
            <p key={i} className="mb-2">
              {parts.map((part, j) => 
                j % 2 === 1 ? <strong key={j}>{part}</strong> : part
              )}
            </p>
          )
        }
        // Empty line
        if (!line.trim()) {
          return <br key={i} />
        }
        // Regular paragraph
        return <p key={i} className="mb-2">{line}</p>
      })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-800">📄 {data.title}</h3>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="text-xs text-gray-600 hover:text-gray-800"
          >
            Copy Markdown
          </button>
          <button
            onClick={handleDownload}
            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            Download
          </button>
        </div>
      </div>

      {/* Rendered report */}
      <div className="bg-white border rounded-lg p-6 max-h-[500px] overflow-y-auto prose prose-sm max-w-none">
        {renderMarkdown(data.content)}
      </div>

      {/* Raw markdown */}
      <details className="mt-3">
        <summary className="text-xs text-gray-500 cursor-pointer">View raw markdown</summary>
        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-48">
          {data.content}
        </pre>
      </details>
    </div>
  )
}
