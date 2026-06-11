import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { event_id, reviewee_id, rating, comment } = await req.json()

  if (!event_id || !reviewee_id || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: revieweeProfile } = await supabase
    .from('profiles')
    .select('is_developer')
    .eq('id', reviewee_id)
    .single()
  if (revieweeProfile?.is_developer) {
    return NextResponse.json({ error: 'This account cannot receive reviews.' }, { status: 403 })
  }

  const { data: event } = await supabase
    .from('car_events')
    .select('user_id, start_time, event_attendees(user_id)')
    .eq('id', event_id)
    .single()

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  if (new Date(event.start_time) > new Date()) {
    return NextResponse.json({ error: 'Event has not happened yet' }, { status: 400 })
  }

  const attendeeIds: string[] = (event.event_attendees ?? []).map((a: any) => a.user_id)
  const isOrganiser = event.user_id === user.id
  const isAttendee  = attendeeIds.includes(user.id)
  const revieweeIsOrganiser = event.user_id === reviewee_id
  const revieweeIsAttendee  = attendeeIds.includes(reviewee_id)

  const canReview =
    (isAttendee  && revieweeIsOrganiser) ||
    (isOrganiser && revieweeIsAttendee)

  if (!canReview) {
    return NextResponse.json({ error: 'You are not permitted to review this person for this event' }, { status: 403 })
  }

  const { error } = await supabase.from('profile_reviews').insert({
    reviewer_id: user.id,
    reviewee_id,
    event_id,
    rating,
    comment: comment?.trim() || null,
  })

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'You have already reviewed this person for this event' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
