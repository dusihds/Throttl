'use client'

import { useState } from 'react'
import { CheckCircle, PlusCircle, DollarSign, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  eventId: string
  userId: string
  initialAttending: boolean
  requiresPayment: boolean
  eventTitle: string
  isFull: boolean
  skipPayment?: boolean
}

export default function AttendButton({ eventId, userId, initialAttending, requiresPayment, eventTitle, isFull, skipPayment = false }: Props) {
  const [attending, setAttending] = useState(initialAttending)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const supabase = createClient()

  async function handleFreeToggle() {
    setLoading(true)
    setError('')
    if (attending) {
      await supabase.from('event_attendees').delete().match({ event_id: eventId, user_id: userId })
      setAttending(false)
    } else {
      await supabase.from('event_attendees').insert({ event_id: eventId, user_id: userId })
      setAttending(true)
    }
    setLoading(false)
  }

  async function handlePaidRsvp() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/rsvp-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, event_title: eventTitle }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Could not start checkout.'); return }
    window.location.href = data.url
  }

  async function cancelPaidRsvp() {
    setLoading(true)
    setError('')
    await supabase.from('event_attendees').delete().match({ event_id: eventId, user_id: userId })
    setAttending(false)
    setLoading(false)
  }

  if (isFull && !attending) {
    return (
      <button
        disabled
        className="w-full flex items-center justify-center gap-2.5 py-4 text-base font-semibold rounded-xl opacity-50 cursor-not-allowed"
        style={{ background: 'rgba(255,255,255,0.05)', color: '#8C8680', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Users className="w-5 h-5" />
        Event Full
      </button>
    )
  }

  if (attending) {
    return (
      <>
        <button
          onClick={requiresPayment ? cancelPaidRsvp : handleFreeToggle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 py-4 text-base font-semibold rounded-xl transition-all duration-200 disabled:opacity-50"
          style={{
            background: 'rgba(249,115,22,0.10)',
            color: '#FB923C',
            border: '1px solid rgba(249,115,22,0.25)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
            e.currentTarget.style.color = '#f87171'
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.20)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(249,115,22,0.10)'
            e.currentTarget.style.color = '#FB923C'
            e.currentTarget.style.borderColor = 'rgba(249,115,22,0.25)'
          }}
        >
          <CheckCircle className="w-5 h-5" />
          {loading ? 'Updating…' : "You're Going — Cancel RSVP"}
        </button>
        {error && (
          <p className="text-xs mt-2 text-center" style={{ color: '#f87171' }}>{error}</p>
        )}
      </>
    )
  }

  if (requiresPayment && !skipPayment) {
    return (
      <>
        <button
          onClick={handlePaidRsvp}
          disabled={loading}
          className="btn-primary w-full py-4 text-base disabled:opacity-50"
        >
          <DollarSign className="w-5 h-5" />
          {loading ? 'Redirecting…' : 'RSVP · $1'}
        </button>
        {error && (
          <p className="text-xs mt-2 text-center" style={{ color: '#f87171' }}>{error}</p>
        )}
      </>
    )
  }

  return (
    <button
      onClick={handleFreeToggle}
      disabled={loading}
      className="btn-primary w-full py-4 text-base disabled:opacity-50"
    >
      <PlusCircle className="w-5 h-5" />
      {loading ? 'Updating…' : "I'm Going!"}
    </button>
  )
}
