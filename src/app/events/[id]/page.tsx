import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { ArrowLeft, MapPin, Clock, Users, RefreshCw, FileText, ShieldCheck, Mail, DollarSign, Star } from 'lucide-react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { DEV_EMAIL, EARLY_ACCESS_EMAIL } from '@/lib/utils'
import type { CarEvent } from '@/lib/types'
import AttendButton from './AttendButton'
import DeleteEventButton from './DeleteEventButton'
import VerifyEventButton from './VerifyEventButton'
import ReviewSection from './ReviewSection'
import RsvpSuccessHandler from './RsvpSuccessHandler'

export const revalidate = 30

function recurrenceLabel(rule: string): string {
  const days: Record<string, string> = {
    MO: 'Monday', TU: 'Tuesday', WE: 'Wednesday', TH: 'Thursday',
    FR: 'Friday', SA: 'Saturday', SU: 'Sunday',
  }
  if (rule.includes('FREQ=WEEKLY')) {
    const m = rule.match(/BYDAY=([A-Z,]+)/)
    if (m) return `Every ${m[1].split(',').map(d => days[d] || d).join(', ')}`
    return 'Every week'
  }
  if (rule.includes('FREQ=MONTHLY')) return 'Every month'
  if (rule.includes('FREQ=DAILY')) return 'Every day'
  return 'Recurring'
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: event }, { data: { user } }] = await Promise.all([
    supabase
      .from('car_events')
      .select('*, profiles!user_id(id, username, avatar_url), event_attendees(user_id, profiles!user_id(id, username)), profile_reviews(reviewer_id, reviewee_id)')
      .eq('id', id)
      .single(),
    supabase.auth.getUser(),
  ])

  if (!event) notFound()

  const { data: profile } = user
    ? await supabase.from('profiles').select('is_developer, is_early_access').eq('id', user.id).single()
    : { data: null }
  const isDev         = profile?.is_developer === true || user?.email === DEV_EMAIL
  const isEarlyAccess = profile?.is_early_access === true || user?.email === EARLY_ACCESS_EMAIL
  const skipPayment   = isDev || isEarlyAccess
  const isOwner = user?.id === event.user_id

  const attendees: { user_id: string; profiles?: { id: string; username: string } }[] =
    event.event_attendees ?? []
  const attendeeCount = attendees.length
  const isAttending = user ? attendees.some((a: any) => a.user_id === user.id) : false

  const maxCapacity: number | null = event.max_capacity ?? null
  const isFull = maxCapacity !== null && attendeeCount >= maxCapacity

  const e = { ...event, attendee_count: attendeeCount } as CarEvent & { attendee_count: number }

  const organiserProfile = event.profiles
    ? { id: event.profiles.id as string, username: event.profiles.username as string }
    : null

  const existingReviews: { reviewer_id: string; reviewee_id: string }[] =
    event.profile_reviews ?? []

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/events" className="inline-flex items-center gap-2 text-sm mb-8 transition-colors duration-200 text-[#8C8680] hover:text-[#F5F0EB]">
        <ArrowLeft className="w-4 h-4" /> Back to Events
      </Link>

      {/* Cover */}
      <div className="aspect-video rounded-2xl overflow-hidden relative mb-6" style={{ background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.06)' }}>
        {e.cover_image_url ? (
          <Image src={e.cover_image_url} alt={e.title} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-10 select-none">🏁</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
          {e.is_recurring && e.recurrence_rule && (
            <span
              className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(249,115,22,0.18)', color: '#FB923C', backdropFilter: 'blur(8px)', border: '1px solid rgba(249,115,22,0.30)' }}
            >
              <RefreshCw className="w-3 h-3" />
              {recurrenceLabel(e.recurrence_rule)}
            </span>
          )}
          {e.is_verified && (
            <span
              className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(34,197,94,0.18)', color: '#4ade80', backdropFilter: 'blur(8px)', border: '1px solid rgba(34,197,94,0.35)' }}
            >
              <ShieldCheck className="w-3 h-3" />
              Verified Event
            </span>
          )}
          {e.requires_payment && (
            <span
              className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(234,179,8,0.18)', color: '#fbbf24', backdropFilter: 'blur(8px)', border: '1px solid rgba(234,179,8,0.30)' }}
            >
              <DollarSign className="w-3 h-3" />
              $1 RSVP
            </span>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#F5F0EB] tracking-tight">{e.title}</h1>
          {e.profiles && <p className="text-sm font-mono mt-1" style={{ color: '#8C8680' }}>by @{e.profiles.username}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isDev && <VerifyEventButton id={e.id} isVerified={e.is_verified} />}
          {isOwner && (
            <Link
              href={`/events/${e.id}/edit`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
              style={{ background: 'rgba(249,115,22,0.12)', color: '#FB923C', border: '1px solid rgba(249,115,22,0.25)' }}
            >
              Edit
            </Link>
          )}
          {isOwner && <DeleteEventButton id={e.id} />}
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <DetailCard icon={<Clock className="w-4 h-4 text-[#F97316]" />} label="Date & Time" value={format(new Date(e.start_time), 'EEE, MMM d yyyy · h:mm a')} />
        <DetailCard icon={<MapPin className="w-4 h-4 text-[#F97316]" />} label="Location" value={e.location_name} />
        {e.end_time && <DetailCard icon={<Clock className="w-4 h-4 text-[#F97316]" />} label="Ends" value={format(new Date(e.end_time), 'h:mm a')} />}
        <DetailCard icon={<Users className="w-4 h-4 text-[#F97316]" />} label="Attending" value={`${attendeeCount} ${attendeeCount === 1 ? 'person' : 'people'}`} highlight />
        {e.min_rating_required && (
          <DetailCard icon={<Star className="w-4 h-4 text-[#F97316]" />} label="Min. Rating" value={`${e.min_rating_required}+ stars recommended`} />
        )}
      </div>

      {/* Capacity bar */}
      {maxCapacity !== null && (
        <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#8C8680' }}>Capacity</span>
            <span className="text-xs font-semibold" style={{ color: isFull ? '#f87171' : '#F5F0EB' }}>
              {attendeeCount} / {maxCapacity} {isFull ? '· Full' : ''}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (attendeeCount / maxCapacity) * 100)}%`,
                background: isFull ? '#ef4444' : '#F97316',
              }}
            />
          </div>
        </div>
      )}

      {e.description && (
        <div className="rounded-2xl p-5 mb-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: '#8C8680' }}>
            <FileText className="w-3.5 h-3.5 text-[#F97316]" />
            About
          </div>
          <p className="text-sm text-[#F5F0EB] leading-relaxed whitespace-pre-wrap">{e.description}</p>
        </div>
      )}

      {e.organizer_contact && (
        <div className="rounded-2xl p-5 mb-6" style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.18)' }}>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: '#4ade80' }}>
            <Mail className="w-3.5 h-3.5" />
            Organiser Contact
          </div>
          <p className="text-sm text-[#F5F0EB]">{e.organizer_contact}</p>
        </div>
      )}

      {/* RSVP */}
      {user ? (
        <>
          {e.requires_payment && (
            <Suspense>
              <RsvpSuccessHandler
                eventId={e.id}
                onVerified={() => {}}
              />
            </Suspense>
          )}
          <AttendButton
            eventId={e.id}
            userId={user.id}
            initialAttending={isAttending}
            requiresPayment={e.requires_payment ?? false}
            eventTitle={e.title}
            isFull={isFull}
            skipPayment={skipPayment}
          />
        </>
      ) : (
        <Link href="/auth" className="btn-primary w-full py-4 text-base justify-center">
          Sign in to RSVP
        </Link>
      )}

      {/* Reviews */}
      <ReviewSection
        event={{ id: e.id, user_id: e.user_id, start_time: e.start_time, title: e.title }}
        currentUserId={user?.id ?? null}
        currentUserIsAttendee={isAttending}
        organiserProfile={organiserProfile}
        attendees={attendees}
        existingReviews={existingReviews}
      />
    </div>
  )
}

function DetailCard({ icon, label, value, highlight = false }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: '#8C8680' }}>
        {icon}
        {label}
      </div>
      <p className={`text-sm font-semibold ${highlight ? 'text-[#FB923C]' : 'text-[#F5F0EB]'}`}>{value}</p>
    </div>
  )
}
