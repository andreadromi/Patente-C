'use client'

interface CircularProgressProps {
  percentage: number
  size?: number
  strokeWidth?: number
  passed: boolean
  label?: string
  showPercentage?: boolean
}

export function CircularProgress({
  percentage,
  size = 120,
  strokeWidth = 8,
  passed,
  label,
  showPercentage = true,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  const color = passed ? '#10b981' : '#f43f5e' // emerald-500 : rose-500
  const darkColor = passed ? '#059669' : '#e11d48' // emerald-600 : rose-600

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0 0 6px ${darkColor})`,
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        {showPercentage && (
          <span
            className={`text-2xl font-bold ${
              passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {Math.round(percentage)}%
          </span>
        )}
        {label && (
          <span className="text-xs text-gray-600 dark:text-gray-300 mt-1 text-center">
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
