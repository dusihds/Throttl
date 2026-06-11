'use client'

import { useState, useEffect, useRef } from 'react'

/* Fake online count:
   - Always starts at a number between 97 and 127
   - Drifts ±6 every 3-5 s so it feels alive
   - Never drops below 94
*/
function fakeCount(): number {
  return 100 + Math.floor(Math.random() * 28)
}

export default function OnlineCounter() {
  const [count, setCount] = useState<number | null>(null)
  const countRef = useRef(fakeCount())

  useEffect(() => {
    setCount(countRef.current)

    const drift = () => {
      const delta = Math.floor(Math.random() * 13) - 6   // -6 … +6
      countRef.current = Math.max(94, countRef.current + delta)
      setCount(countRef.current)
    }

    // Tick every 3-5 seconds at random
    let timer: ReturnType<typeof setTimeout>
    const schedule = () => {
      timer = setTimeout(() => { drift(); schedule() }, 3000 + Math.random() * 2000)
    }
    schedule()
    return () => clearTimeout(timer)
  }, [])

  if (count === null) return null

  return (
    <div className="flex items-center gap-2">
      {/* Pulsing live dot */}
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="ping-orange absolute inline-flex h-full w-full rounded-full bg-[#F97316] opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F97316]" />
      </span>
      <span className="text-[11px] font-mono uppercase tracking-widest" style={{ color: '#8C8680' }}>
        <span style={{ color: '#FB923C' }}>{count.toLocaleString()}</span>
        {' '}online now
      </span>
    </div>
  )
}
