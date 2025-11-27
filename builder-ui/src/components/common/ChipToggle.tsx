interface ChipToggleProps<T extends string> {
  options: readonly T[]
  value: T
  onChange: (value: T) => void
  labels?: Record<T, string>
}

export default function ChipToggle<T extends string>({
  options,
  value,
  onChange,
  labels,
}: ChipToggleProps<T>) {
  return (
    <div className="inline-flex rounded-lg bg-[#0a0a0a] p-1 gap-1">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            value === option
              ? 'bg-[#d4a964] text-black'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {labels?.[option] || option}
        </button>
      ))}
    </div>
  )
}
