/**
 * Infographics Viewer - Renders charts and statistics
 * Uses inline SVG for simple, dependency-free chart rendering
 */
import type { InfographicResponse, ChartData } from '../../lib/studioApi'

interface InfographicsViewerProps {
  data: InfographicResponse
}

// Simple bar chart using SVG
function BarChart({ chart }: { chart: ChartData }) {
  if (!chart.data) return null
  
  const { labels, values, colors } = chart.data
  const maxValue = Math.max(...values)
  const barWidth = 100 / labels.length
  const defaultColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
  
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <h4 className="font-medium text-gray-800 mb-3">{chart.title}</h4>
      <svg viewBox="0 0 400 200" className="w-full h-40">
        {values.map((value, i) => {
          const height = (value / maxValue) * 150
          const x = i * (400 / labels.length) + 20
          const color = colors?.[i] || defaultColors[i % defaultColors.length]
          
          return (
            <g key={i}>
              <rect
                x={x}
                y={180 - height}
                width={barWidth * 3}
                height={height}
                fill={color}
                rx={4}
              />
              <text
                x={x + (barWidth * 1.5)}
                y={195}
                textAnchor="middle"
                className="text-xs fill-gray-600"
                fontSize="12"
              >
                {labels[i].length > 10 ? labels[i].slice(0, 10) + '...' : labels[i]}
              </text>
              <text
                x={x + (barWidth * 1.5)}
                y={175 - height}
                textAnchor="middle"
                className="text-xs fill-gray-800 font-medium"
                fontSize="11"
              >
                {value}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// Simple pie chart using SVG
function PieChart({ chart }: { chart: ChartData }) {
  if (!chart.data) return null
  
  const { labels, values, colors } = chart.data
  const total = values.reduce((a, b) => a + b, 0)
  const defaultColors = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444']
  
  let currentAngle = 0
  const slices = values.map((value, i) => {
    const percentage = value / total
    const angle = percentage * 360
    const startAngle = currentAngle
    currentAngle += angle
    
    // Calculate arc path
    const startRad = (startAngle - 90) * (Math.PI / 180)
    const endRad = (startAngle + angle - 90) * (Math.PI / 180)
    const x1 = 100 + 80 * Math.cos(startRad)
    const y1 = 100 + 80 * Math.sin(startRad)
    const x2 = 100 + 80 * Math.cos(endRad)
    const y2 = 100 + 80 * Math.sin(endRad)
    const largeArc = angle > 180 ? 1 : 0
    
    return {
      path: `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color: colors?.[i] || defaultColors[i % defaultColors.length],
      label: labels[i],
      percentage: Math.round(percentage * 100)
    }
  })
  
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <h4 className="font-medium text-gray-800 mb-3">{chart.title}</h4>
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 200 200" className="w-32 h-32">
          {slices.map((slice, i) => (
            <path
              key={i}
              d={slice.path}
              fill={slice.color}
              stroke="white"
              strokeWidth="2"
            />
          ))}
        </svg>
        <div className="flex-1 space-y-1">
          {slices.map((slice, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: slice.color }}
              />
              <span className="text-gray-700">{slice.label}</span>
              <span className="text-gray-500 ml-auto">{slice.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Line chart using SVG
function LineChart({ chart }: { chart: ChartData }) {
  if (!chart.data) return null
  
  const { labels, values, colors } = chart.data
  const maxValue = Math.max(...values)
  const minValue = Math.min(...values)
  const range = maxValue - minValue || 1
  const color = colors?.[0] || '#3B82F6'
  
  const points = values.map((value, i) => {
    const x = 40 + (i / (values.length - 1)) * 320
    const y = 160 - ((value - minValue) / range) * 140
    return `${x},${y}`
  }).join(' ')
  
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <h4 className="font-medium text-gray-800 mb-3">{chart.title}</h4>
      <svg viewBox="0 0 400 200" className="w-full h-40">
        {/* Grid lines */}
        <line x1="40" y1="20" x2="40" y2="160" stroke="#e5e7eb" strokeWidth="1" />
        <line x1="40" y1="160" x2="360" y2="160" stroke="#e5e7eb" strokeWidth="1" />
        
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Points */}
        {values.map((value, i) => {
          const x = 40 + (i / (values.length - 1)) * 320
          const y = 160 - ((value - minValue) / range) * 140
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="4" fill={color} />
              <text
                x={x}
                y={180}
                textAnchor="middle"
                fontSize="10"
                className="fill-gray-500"
              >
                {labels[i].length > 8 ? labels[i].slice(0, 8) : labels[i]}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// Stat card
function StatCard({ chart }: { chart: ChartData }) {
  const trendIcon = chart.trend === 'up' ? '↑' : chart.trend === 'down' ? '↓' : '→'
  const trendColor = chart.trend === 'up' ? 'text-green-600' : chart.trend === 'down' ? 'text-red-600' : 'text-gray-600'
  
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
      <p className="text-sm text-gray-600 mb-1">{chart.title}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900">{chart.value}</span>
        {chart.trend && (
          <span className={`text-lg font-medium ${trendColor}`}>{trendIcon}</span>
        )}
      </div>
      {chart.subtitle && (
        <p className="text-xs text-gray-500 mt-1">{chart.subtitle}</p>
      )}
    </div>
  )
}

export default function InfographicsViewer({ data }: InfographicsViewerProps) {
  const { data: infographic } = data
  
  const handleDownload = () => {
    const json = JSON.stringify(infographic, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${infographic.title.replace(/\s+/g, '-').toLowerCase()}-infographic.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-800">📈 {infographic.title}</h3>
        <button
          onClick={handleDownload}
          className="text-xs text-gray-600 hover:text-gray-800"
        >
          Download JSON
        </button>
      </div>

      {/* Summary */}
      <p className="text-sm text-gray-600 mb-4">{infographic.summary}</p>

      {/* Charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {infographic.charts.map((chart, i) => {
          switch (chart.type) {
            case 'bar':
              return <BarChart key={i} chart={chart} />
            case 'pie':
              return <PieChart key={i} chart={chart} />
            case 'line':
              return <LineChart key={i} chart={chart} />
            case 'stat':
              return <StatCard key={i} chart={chart} />
            default:
              return null
          }
        })}
      </div>

      {/* Key points */}
      {infographic.key_points && infographic.key_points.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Key Insights</h4>
          <ul className="space-y-1">
            {infographic.key_points.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-blue-500">•</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
