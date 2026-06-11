'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import LeaveReviewModal from '@/components/LeaveReviewModal'

interface Props {
  event: { id: string; user_id: string; start_time: string; title: string }
  currentUserId: string | null
  currentUserIsAttendee: boolean
  organiserProfile: { id: string; username: string } | null
  attendees: { user_id: string; profiles?: { id: string; username: string } }[]
  existingReviews: { reviewer_id: string; reviewee_id: string }[]
}

interface ModalTarget {
  revieweeId: string
  revieweeName: string
}

export default function ReviewSection({
  event,
  currentUserId,
  currentUserIsAttendee,
  organiserProfile,
  attendees,
  existingReviews,
}: Props) {
  const [done, setDone]   = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<ModalTarget | null>(null)

  if (new Date(event.start_time) > new Date()) return null
  if (!currentUserId) return null

  const alreadyReviewed = (revieweeId: string) =>
    done.has(revieweeId) ||
    existingReviews.some(r => r.reviewer_id === currentUserId && r.reviewee_id === revieweeId)

  const isOrganiser = event.user_id === currentUserId

  const showOrganiserReviewButton =
    currentUserIsAttendee &&
    organiserProfile &&
    organiserProfile.id !== currentUserId &&
    !alreadyReviewed(organiserProfile.id)

  const attendeesToReview = isOrganiser
    ? attendees.filter(
        a => a.user_id !== currentUserId && a.profiles && !alreadyReviewed(a.user_id)
      )
    : []

  if (!showOrganiserReviewButton && attendeesToReview.length === 0) return null

  return (
    <>
      <div
        className="rounded-2xl p-5 mt-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest mb-4" style={{ color: '#8C8680' }}>
          <Star className="w-3.5 h-3.5 text-[#F97316]" />
          Reviews
        </div>

        <div className="flex flex-col gap-3">
          {showOrganiserReviewButton && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-[#F5F0EB]">Review the organiser</p>
              <button
                onClick={() => setModal({ revieweeId: organiserProfile!.id, revieweeName: organiserProfile!.username })}
                className="btn-secondary text-sm py-2 px-4 shrink-0"
              >
                Review @{organiserProfile!.username}
              </button>
            </div>
          )}

          {attendeesToReview.map(a => (
            <div key={a.user_id} className="flex items-center justify-between gap-4">
              <p className="text-sm text-[#F5F0EB]">@{a.profiles?.username}</p>
              <button
                onClick={() => setModal({ revieweeId: a.user_id, revieweeName: a.profiles!.username })}
                className="btn-secondary text-sm py-2 px-4 shrink-0"
              >
                Review
              </button>
            </div>
          ))}
        </div>
      </div>

      {modal && (
        <LeaveReviewModal
          eventId={event.id}
          revieweeId={modal.revieweeId}
          revieweeName={modal.revieweeName}
          onClose={() => setModal(null)}
          onSuccess={() => {
            setDone(prev => new Set(prev).add(modal.revieweeId))
            setModal(null)
          }}
        />
      )}
    </>
  )
}
