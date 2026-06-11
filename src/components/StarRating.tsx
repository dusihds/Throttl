'use client'

interface Props {
  value: number
  interactive?: boolean
  onChange?: (rating: number) => void
  size?: 'xs' | 'sm' | 'md'
  color?: string
}

export default function StarRating({ value, interactive = false, onChange, size = 'md', color }: Props) {
  const dim = size === 'xs' ? 11 : size === 'sm' ? 14 : 20
  const fillColor   = color ?? '#facc15'
  const strokeColor = color ?? '#facc15'

  return (
    <div className="flex items-center gap-0.5" role={interactive ? 'radiogroup' : undefined}>
      {[1, 2, 3, 4, 5].map(star => {
        const filled = star <= Math.round(value)
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(star)}
            aria-label={interactive ? `${star} star` : undefined}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: interactive ? 'pointer' : 'default',
              lineHeight: 1,
            }}
          >
            <svg
              width={dim}
              height={dim}
              viewBox="0 0 24 24"
              fill={filled ? fillColor : 'none'}
              stroke={filled ? strokeColor : 'rgba(255,255,255,0.20)'}
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: 'fill 0.12s, stroke 0.12s' }}
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        )
      })}
    </div>
  )
}
