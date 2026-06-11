'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

interface Props {
  eventId: string
  onVerified: () => void
}

export default function RsvpSuccessHandler({ eventId, onVerified }: Props) {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const ran          = useRef(false)

  useEffect(() => {
    const rsvp      = searchParams.get('rsvp')
    const sessionId = searchParams.get('session_id')
    if (rsvp !== 'success' || !sessionId || ran.current) return
    ran.current = true

    fetch('/api/rsvp-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, event_id: eventId }),
    }).then(res => {
      if (res.ok) onVerified()
    }).finally(() => {
      const url = new URL(window.location.href)
      url.searchParams.delete('rsvp')
      url.searchParams.delete('session_id')
      router.replace(url.pathname + (url.search || ''))
    })
  }, [])

  return null
}
