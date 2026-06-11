import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Car, Calendar, ShieldAlert, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import SpotCard from '@/components/SpotCard'
import EventCard from '@/components/EventCard'
import StarRating from '@/components/StarRating'
import type { CarSpot, CarEvent, ProfileReview } from '@/lib/types'
import SignOutButton from './SignOutButton'
import ProfileEditor from './ProfileEditor'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [{ data: profile }, { data: spots }, { data: events }, { data: reviews }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('car_spots').select('*, profiles(id, username, avatar_url, is_developer)')
      .eq('user_id', user.id).order('spotted_at', { ascending: false }).limit(20),
    supabase.from('car_events').select('*, profiles!user_id(id, username, avatar_url, is_developer), event_attendees(count)')
      .eq('user_id', user.id).order('start_time', { ascending: false }).limit(20),
    supabase.from('profile_reviews')
      .select('*, profiles!reviewer_id(id, username, avatar_url)')
      .eq('reviewee_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const enrichedEvents = (events ?? []).map((e: any) => ({
    ...e,
    attendee_count: e.event_attendees?.[0]?.count ?? 0,
  })) as CarEvent[]

  const reviewList   = (reviews ?? []) as ProfileReview[]
  const isDev        = profile?.is_developer ?? false
  const isEarlyAccess = profile?.is_early_access ?? false
  const username     = profile?.username ?? user.email?.split('@')[0] ?? 'U'

  const avgRating = reviewList.length > 0
    ? Math.round((reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length) * 10) / 10
    : null
  const showLowRatingBadge = !isDev && avgRating !== null && avgRating < 2 && reviewList.length >= 3

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">

      {/* Profile card */}
      <div className="card p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-5">
          <div className="flex items-start gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-[#F5F0EB] tracking-tight">@{username}</h1>
              {isDev && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full tracking-widest uppercase"
                  style={{ background: 'rgba(249,115,22,0.15)', color: '#FB923C', border: '1px solid rgba(249,115,22,0.30)' }}>
                  ⚡ Developer
                </span>
              )}
              {isEarlyAccess && (
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full tracking-widest uppercase"
                  style={{ background: 'rgba(125,211,252,0.10)', color: '#7dd3fc', border: '1px solid rgba(125,211,252,0.25)' }}>
                  <Sparkles className="w-2.5 h-2.5" />
                  Early Access
                </span>
              )}
              {showLowRatingBadge && (
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full tracking-widest uppercase"
                  style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }}>
                  <ShieldAlert className="w-3 h-3" />
                  Low Rating
                </span>
              )}
            </div>

            {/* Rating row */}
            {isDev ? (
              <div className="w-full flex items-center gap-2">
                <StarRating value={5} size="sm" color="#7dd3fc" />
              </div>
            ) : avgRating !== null ? (
              <div className="w-full flex items-center gap-2">
                <StarRating value={avgRating} size="sm" />
                <span className="text-xs font-semibold text-[#F5F0EB]">{avgRating.toFixed(1)}</span>
                <span className="text-xs" style={{ color: '#8C8680' }}>({reviewList.length} {reviewList.length === 1 ? 'review' : 'reviews'})</span>
              </div>
            ) : null}
          </div>
          <SignOutButton />
        </div>

        {/* Avatar + bio editor */}
        <ProfileEditor
          userId={user.id}
          avatarUrl={profile?.avatar_url ?? null}
          bio={profile?.bio ?? null}
          username={username}
        />

        <div className="flex items-center gap-5 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Stat label="Spots"  value={spots?.length ?? 0} />
          <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <Stat label="Events" value={events?.length ?? 0} />
          <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <Stat label="Reviews" value={reviewList.length} />
        </div>
      </div>

      {/* My Spots */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[11px] font-mono text-[#F97316] uppercase tracking-widest mb-1">Your logs</p>
            <h2 className="text-xl font-bold text-[#F5F0EB] tracking-tight flex items-center gap-2">
              <Car className="w-5 h-5 text-[#F97316]" /> My Spots
            </h2>
          </div>
          <Link href="/spots/new" className="btn-secondary text-sm py-2 px-4">+ Log Spot</Link>
        </div>
        {spots && spots.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(spots as CarSpot[]).map(spot => <SpotCard key={spot.id} spot={spot} />)}
          </div>
        ) : (
          <EmptyState message="You haven't logged any spots yet." cta="Log your first spot →" href="/spots/new" />
        )}
      </section>

      {/* My Events */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[11px] font-mono text-[#F97316] uppercase tracking-widest mb-1">Your meetups</p>
            <h2 className="text-xl font-bold text-[#F5F0EB] tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#F97316]" /> My Events
            </h2>
          </div>
          <Link href="/events/new" className="btn-secondary text-sm py-2 px-4">+ Create Event</Link>
        </div>
        {enrichedEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {enrichedEvents.map(event => <EventCard key={event.id} event={event} isOwner={true} />)}
          </div>
        ) : (
          <EmptyState message="You haven't created any events yet." cta="Create your first event →" href="/events/new" />
        )}
      </section>

      {/* Reviews received */}
      <section>
        <div className="mb-6">
          <p className="text-[11px] font-mono text-[#F97316] uppercase tracking-widest mb-1">Community feedback</p>
          <h2 className="text-xl font-bold text-[#F5F0EB] tracking-tight">Reviews</h2>
        </div>
        {reviewList.length === 0 ? (
          <div className="text-center py-10 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-sm" style={{ color: '#8C8680' }}>
              {isDev ? 'Developer accounts have a permanent 5-star status.' : 'No reviews yet — attend events to get rated.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reviewList.map(review => (
              <div key={review.id} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <StarRating value={review.rating} size="sm" color={isDev ? '#7dd3fc' : undefined} />
                    <span className="text-xs font-semibold text-[#F5F0EB]">{review.rating}/5</span>
                  </div>
                  <Link href={`/profile/${(review.profiles as any)?.username ?? ''}`} className="text-[11px] font-mono hover:text-[#F5F0EB] transition-colors" style={{ color: '#8C8680' }}>
                    @{(review.profiles as any)?.username ?? 'unknown'}
                  </Link>
                </div>
                {review.comment && <p className="text-sm leading-relaxed" style={{ color: '#F5F0EB' }}>{review.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span className="text-base font-bold text-[#F5F0EB]">{value}</span>
      <span className="text-xs font-mono ml-1.5" style={{ color: '#8C8680' }}>{label}</span>
    </div>
  )
}

function EmptyState({ message, cta, href }: { message: string; cta: string; href: string }) {
  return (
    <div className="text-center py-10 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p className="text-sm" style={{ color: '#8C8680' }}>{message}</p>
      <Link href={href} className="inline-block mt-3 text-sm font-medium text-[#F97316] hover:text-[#FB923C] transition-colors">
        {cta}
      </Link>
    </div>
  )
}
