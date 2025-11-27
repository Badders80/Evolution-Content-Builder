import type { ReactNode } from 'react'

interface AppShellProps {
  template: string
  children: ReactNode
}

export default function AppShell({ template, children }: AppShellProps) {
  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Top Header - Tailwind Plus Hero Pattern */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/assets/Evolution+Logo.svg" 
                alt="Evolution Stables Logo" 
                className="h-12 w-auto"
              />
              <div>
                <p className="text-sm font-semibold text-evoGold">Powered by Gemini AI</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                  Evolution Content Builder
                </h1>
                <p className="mt-1 text-sm font-medium text-gray-500">
                  Create professional racing content with AI assistance
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">{template}</span>
              <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                <svg className="-ml-0.5 mr-1.5 h-2 w-2 fill-green-500" viewBox="0 0 6 6">
                  <circle cx="3" cy="3" r="3" />
                </svg>
                Live
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden bg-white">
        {children}
      </main>
    </div>
  )
}
