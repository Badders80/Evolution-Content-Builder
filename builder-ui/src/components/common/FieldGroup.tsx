import type { ReactNode } from 'react'

interface FieldGroupProps {
  label: string
  helper?: string
  error?: string
  children: ReactNode
  required?: boolean
}

export default function FieldGroup({ label, helper, error, children, required }: FieldGroupProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-300">
        {label}
        {required && <span className="ml-1 text-[#d4a964]">*</span>}
      </label>
      {helper && <p className="text-xs text-gray-500">{helper}</p>}
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
