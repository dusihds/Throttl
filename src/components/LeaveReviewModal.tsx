'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import StarRating from './StarRating'

interface Props {
  eventId: string
  revieweeId: string
  revieweeName: string
  onClose: () => void
  onSuccess: () => void
}

export default function LeaveReviewModal({ eventId, revieweeId, revieweeName, onClose, onSuccess }: Props) {
  const [rating, setRating]   = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function submit() {
    if (rating === 0) { setError('Please select a star rating.'); return }
    setError('')
    setLoading(true)
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, reviewee_id: revieweeId, rating, comment }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return }
    onSuccess()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(5,5,6,0.80)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.09)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#F5F0EB] tracking-tight">Review @{revieweeName}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#8C8680' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F5F0EB')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8C8680')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium uppercase tracking-wide" style={{ color: '#8C8680' }}>Rating *</label>
          <StarRating value={rating} interactive onChange={setRating} size="md" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium uppercase tracking-wide" style={{ color: '#8C8680' }}>Comment (optional)</label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value.slice(0, 200))}
            rows={3}
            placeholder="Share your experience…"
            className="input resize-none text-sm"
          />
          <p className="text-[11px] text-right" style={{ color: comment.length >= 190 ? '#f87171' : '#8C8680' }}>
            {comment.length}/200
          </p>
        </div>

        {error && (
          <p className="text-xs px-3 py-2.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="btn-secondary flex-1 py-2.5 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading || rating === 0}
            className="btn-primary flex-1 py-2.5 text-sm"
          >
            {loading ? 'Submitting…' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  )
}
