'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { useCallback, useState } from 'react'

export default function SearchInput({ initialQuery }: { initialQuery: string }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [value, setValue] = useState(initialQuery)

  const push = useCallback((q: string) => {
    const url = q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname
    router.push(url)
  }, [router, pathname])

  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#8C8680' }} />
      <input
        type="text"
        value={value}
        onChange={e => {
          setValue(e.target.value)
          push(e.target.value)
        }}
        placeholder="Search by username…"
        className="input pl-11"
        autoFocus
      />
    </div>
  )
}
