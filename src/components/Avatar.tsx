import Image from 'next/image'

interface Props {
  username: string
  avatarUrl?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
  isDev?: boolean
}

const SIZES = { xs: 28, sm: 36, md: 48, lg: 64 }

export default function Avatar({ username, avatarUrl, size = 'md', isDev = false }: Props) {
  const px = SIZES[size]
  const radius = size === 'lg' ? '14px' : size === 'md' ? '10px' : '8px'
  const fontSize = size === 'lg' ? '1.4rem' : size === 'md' ? '1.1rem' : size === 'sm' ? '0.9rem' : '0.7rem'

  return (
    <div
      className="relative shrink-0 overflow-hidden flex items-center justify-center font-black select-none"
      style={{
        width: px,
        height: px,
        borderRadius: radius,
        background: 'rgba(94,106,210,0.12)',
        border: isDev ? '1px solid rgba(94,106,210,0.45)' : '1px solid rgba(94,106,210,0.25)',
        color: '#818cf8',
        fontSize,
      }}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={username}
          fill
          sizes={`${px}px`}
          className="object-cover"
          unoptimized={avatarUrl.includes('?t=')}
        />
      ) : (
        username[0]?.toUpperCase() ?? '?'
      )}
    </div>
  )
}
