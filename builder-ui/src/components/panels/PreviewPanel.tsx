// @ts-nocheck
import { getTemplate } from '../../lib/templates'

type DeviceType = 'desktop' | 'tablet' | 'phone'

interface PreviewPanelProps {
  template: string
  title: string
  subtitle: string
  content: string
  tagline: string
  devicePreview: DeviceType
  onDevicePreviewChange: (device: DeviceType) => void
  isMinimized?: boolean
}

const DEVICE_OPTIONS: readonly DeviceType[] = ['desktop', 'tablet', 'phone']

export default function PreviewPanel({
  template,
  title,
  subtitle,
  content,
  tagline,
  devicePreview,
  onDevicePreviewChange,
}: PreviewPanelProps) {
  const templateConfig = getTemplate(template)
  const handleExportHTML = () => {
    const html = generateHTML()
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.toLowerCase().replace(/\s+/g, '-')}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportMarkdown = () => {
    const markdown = `# ${title}\n\n${subtitle ? `## ${subtitle}\n\n` : ''}${content}`
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.toLowerCase().replace(/\s+/g, '-')}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateHTML = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || template}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #ffffff;
      color: #111827;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #d4a964;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .brand {
      font-size: 12px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #d4a964;
      margin-bottom: 10px;
    }
    .template-name {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 36px;
      margin: 0 0 10px 0;
      color: #111827;
    }
    h2 {
      font-size: 24px;
      color: #6b7280;
      font-weight: normal;
      margin: 0 0 30px 0;
    }
    .content {
      white-space: pre-wrap;
      font-size: 16px;
      line-height: 1.8;
      color: #374151;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">Evolution Stables</div>
    <div class="template-name">${template}</div>
  </div>
  <h1>${title || 'Untitled'}</h1>
  ${subtitle ? `<h2>${subtitle}</h2>` : ''}
  <div class="content">${content || 'No content yet.'}</div>
  <div class="footer">
    ${tagline || 'Champions in the Making'}
  </div>
</body>
</html>`
  }

  const deviceMaxWidth = {
    desktop: 'max-w-4xl',
    tablet: 'max-w-2xl',
    phone: 'max-w-sm',
  }

  const deviceScale = {
    desktop: 'scale-100',
    tablet: 'scale-90',
    phone: 'scale-75',
  }

  // Split content into paragraphs for drop cap styling
  const paragraphs = content ? content.split('\n\n').filter(p => p.trim()) : []
  
  // Extract a pull quote from content
  const extractPullQuote = () => {
    if (!content) return null
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20 && s.trim().length < 150)
    return sentences[0] ? `"${sentences[0].trim()}."` : null
  }
  const pullQuote = extractPullQuote()

  // Render different layouts based on template
  const renderLayout = () => {
    switch (templateConfig.layout) {
      case 'magazine':
        return <MagazineLayout />
      case 'letter':
        return <LetterLayout />
      case 'social':
        return <SocialLayout />
      case 'report':
        return <ReportLayout />
      case 'newsletter':
        return <NewsletterLayout />
      default:
        return <MagazineLayout />
    }
  }

  // Magazine Layout - Two column with image and pull quote
  const MagazineLayout = () => (
    <div className="overflow-hidden rounded-lg bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
        <span className="text-xs font-bold tracking-widest text-gray-900 uppercase">Evolution Stables</span>
        <span className="text-[10px] font-medium tracking-widest text-gray-500 uppercase">{template}</span>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <h1 className="text-3xl lg:text-4xl font-black leading-tight text-gray-900 mb-3">
              {title || <span className="text-gray-300">Enter headline...</span>}
            </h1>
            {subtitle && <p className="text-base text-gray-600 leading-relaxed mb-6">{subtitle}</p>}
            {paragraphs.length > 0 ? (
              <div className="space-y-3 text-sm leading-relaxed text-gray-700">
                {paragraphs.map((para, idx) => (
                  <p key={idx} className={idx === 0 ? 'first-letter:text-4xl first-letter:font-bold first-letter:float-left first-letter:mr-2 first-letter:leading-none' : ''}>
                    {para}
                  </p>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-400 italic">Content appears here...</p>
              </div>
            )}
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
              <img src="/assets/Bruno.jpg" alt="Featured" className="w-full h-full object-cover" />
            </div>
            {pullQuote && (
              <blockquote className="border-l-4 border-amber-400 pl-3 py-1">
                <p className="text-xs italic text-gray-700 leading-relaxed">{pullQuote}</p>
                <footer className="mt-1 text-[10px] text-gray-500">— Stephen Gray, Trainer</footer>
              </blockquote>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100 px-6 py-3 bg-gray-50">
        <p className="text-center text-[10px] text-gray-500 tracking-wide">{tagline}</p>
      </div>
    </div>
  )

  // Letter Layout - Formal single column, signature
  const LetterLayout = () => (
    <div className="overflow-hidden rounded-lg bg-white shadow-2xl">
      <div className="border-b-2 border-gray-900 px-8 py-6">
        <div className="flex items-center gap-3">
          <img src="/assets/Evolution+Logo.svg" alt="Logo" className="h-10 w-auto" />
          <div>
            <p className="text-sm font-bold text-gray-900">Evolution Stables</p>
            <p className="text-xs text-gray-500">Owner Communication</p>
          </div>
        </div>
      </div>
      <div className="px-8 py-8">
        <p className="text-sm text-gray-500 mb-6">{new Date().toLocaleDateString('en-NZ', { dateStyle: 'long' })}</p>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          {title || 'Dear Valued Owners,'}
        </h1>
        {paragraphs.length > 0 ? (
          <div className="space-y-4 text-sm leading-relaxed text-gray-700" style={{ fontFamily: 'Georgia, serif' }}>
            {paragraphs.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-400 italic">Letter content appears here...</p>
          </div>
        )}
        <div className="mt-10 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-700">Warm regards,</p>
          <p className="text-lg font-semibold text-gray-900 mt-2">Stephen Gray</p>
          <p className="text-xs text-gray-500">Head Trainer, Evolution Stables</p>
        </div>
      </div>
    </div>
  )

  // Social Layout - Quick update, bold stats
  const SocialLayout = () => (
    <div className="overflow-hidden rounded-lg bg-white shadow-2xl">
      <div className="bg-gradient-to-r from-gray-900 to-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <span className="text-white font-bold text-sm">🏇 RACE DAY UPDATE</span>
          <span className="text-gray-300 text-xs">{new Date().toLocaleDateString()}</span>
        </div>
      </div>
      <div className="aspect-video bg-gray-100 overflow-hidden">
        <img src="/assets/Bruno.jpg" alt="Featured" className="w-full h-full object-cover" />
      </div>
      <div className="p-6">
        <h1 className="text-2xl font-black text-gray-900 mb-3">
          {title || <span className="text-gray-300">Quick Update...</span>}
        </h1>
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">1200m</p>
            <p className="text-[10px] text-gray-500 uppercase">Distance</p>
          </div>
          <div className="text-center border-x border-gray-200">
            <p className="text-lg font-bold text-gray-900">Good 4</p>
            <p className="text-[10px] text-gray-500 uppercase">Track</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">4th</p>
            <p className="text-[10px] text-gray-500 uppercase">Finish</p>
          </div>
        </div>
        {paragraphs.length > 0 ? (
          <p className="text-sm text-gray-700 leading-relaxed">{paragraphs[0]}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">Update content...</p>
        )}
      </div>
    </div>
  )

  // Report Layout - Technical with stats section
  const ReportLayout = () => (
    <div className="overflow-hidden rounded-lg bg-white shadow-2xl">
      <div className="bg-emerald-600 px-6 py-4">
        <p className="text-emerald-100 text-xs uppercase tracking-wider">Trainer Report</p>
        <h1 className="text-white font-bold text-xl mt-1">{title || 'Training Update'}</h1>
      </div>
      <div className="p-6">
        {subtitle && <p className="text-sm text-gray-600 mb-4 pb-4 border-b">{subtitle}</p>}
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {['Work Rate', 'Recovery', 'Weight', 'Condition'].map((stat, i) => (
            <div key={stat} className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-emerald-600">{['A+', '98%', '485kg', 'Peak'][i]}</p>
              <p className="text-[10px] text-gray-500 uppercase">{stat}</p>
            </div>
          ))}
        </div>
        {paragraphs.length > 0 ? (
          <div className="space-y-3 text-sm leading-relaxed text-gray-700">
            {paragraphs.map((para, idx) => <p key={idx}>{para}</p>)}
          </div>
        ) : (
          <div className="py-6 text-center bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-400 italic">Report content...</p>
          </div>
        )}
        <div className="mt-6 pt-4 border-t flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <span className="text-emerald-600 font-bold">SG</span>
          </div>
          <div>
            <p className="text-sm font-semibold">Stephen Gray</p>
            <p className="text-xs text-gray-500">Head Trainer</p>
          </div>
        </div>
      </div>
    </div>
  )

  // Newsletter Layout - Promotional with CTA
  const NewsletterLayout = () => (
    <div className="overflow-hidden rounded-lg bg-white shadow-2xl">
      <div className="bg-red-600 px-6 py-4 text-center">
        <p className="text-red-200 text-xs uppercase tracking-widest">Coming Up</p>
        <h1 className="text-white font-black text-2xl mt-1">{title || 'Race Preview'}</h1>
        {subtitle && <p className="text-red-100 text-sm mt-2">{subtitle}</p>}
      </div>
      <div className="grid grid-cols-2 gap-0">
        <div className="aspect-square bg-gray-100">
          <img src="/assets/Bruno.jpg" alt="Featured" className="w-full h-full object-cover" />
        </div>
        <div className="p-4 flex flex-col justify-center bg-gray-50">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date</span>
              <span className="font-semibold">Saturday</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Track</span>
              <span className="font-semibold">Wanganui</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Distance</span>
              <span className="font-semibold">1400m</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Barrier</span>
              <span className="font-semibold">5</span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6">
        {paragraphs.length > 0 ? (
          <p className="text-sm text-gray-700 leading-relaxed">{paragraphs[0]}</p>
        ) : (
          <p className="text-sm text-gray-400 italic text-center">Preview content...</p>
        )}
      </div>
      <div className="px-6 pb-6">
        <button className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold text-sm hover:bg-red-700 transition">
          Follow Race Live →
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-1 flex-col overflow-hidden border-l border-gray-200 bg-gray-100">
      {/* Device Preview Toggle */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-4 py-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Preview</h3>
          <div className="flex gap-1">
            {DEVICE_OPTIONS.map((device) => (
              <button
                key={device}
                onClick={() => onDevicePreviewChange(device)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  devicePreview === device
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {device.charAt(0).toUpperCase() + device.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className={`mx-auto transition-all ${deviceMaxWidth[devicePreview]}`}>
          {renderLayout()}
        </div>
      </div>

      {/* Export Buttons */}
      <div className="border-t border-gray-200 bg-white p-3">
        <div className="flex gap-2">
          <button
            onClick={handleExportHTML}
            className="flex-1 rounded-md bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800"
          >
            Export HTML
          </button>
          <button
            onClick={handleExportMarkdown}
            className="flex-1 rounded-md bg-white px-3 py-2 text-xs font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Export PDF
          </button>
        </div>
      </div>
    </div>
  )
}
