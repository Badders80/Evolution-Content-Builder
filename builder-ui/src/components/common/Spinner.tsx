interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeStyles = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-3',
  }
  
  return (
    <div
      className={`${sizeStyles[size]} animate-spin rounded-full border-[#d4a964] border-t-transparent ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}
