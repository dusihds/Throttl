import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShieldAlert, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Avatar from '@/components/Avatar'
import StarRating from '@/components/StarRating'
import type { ProfileReview } from '@/lib/types'

export const revalidate = 120

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, bio, is_developer, is_early_access, created_at')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const [{ data: reviews }, { data: spotCount }, { data: eventCount }] = await Promise.all([
    supabase
      .from('profile_reviews')
      .select('*, profiles!reviewer_id(id, username, avatar_url)')
      .eq('reviewee_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('car_spots').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
    supabase.from('car_events').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
  ])

  const reviewList = (reviews ?? []) as ProfileReview[]
  const isDev      = profile.is_developer ?? false
  const isEarlyAccess = profile.is_early_access ?? false

  const avgRating = reviewList.length > 0
    ? Math.round((reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length) * 10) / 10
    : null
  const showLowRating = !isDev && avgRating !== null && avgRating < 2 && reviewList.length >= 3

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/search" className="inline-flex items-center gap-2 text-sm mb-8 transition-colors text-[#8A8F98] hover:text-[#EDEDEF]">
        <ArrowLeft className="w-4 h-4" /> Back to Search
      </Link>

      {/* Profile header */}
      <div className="card p-6 mb-8">
        <div className="flex items-start gap-4">
          <Avatar username={profile.username} avatarUrl={profile.avatar_url} size="lg" isDev={isDev} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-bold text-[#EDEDEF] tracking-tight">@{profile.username}</h1>
              {isDev && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full tracking-widest uppercase"
                  style={{ background: 'rgba(94,106,210,0.15)', color: '#818cf8', border: '1px solid rgba(94,106,210,0.30)' }}>
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
              {showLowRating && (
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full tracking-widest uppercase"
                  style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }}>
                  <ShieldAlert className="w-3 h-3" />
                  Low Rating
                </span>
              )}
            </div>

            {profile.bio && (
              <p className="text-sm leading-relaxed mb-2" style={{ color: '#8A8F98' }}>{profile.bio}</p>
            )}

            {isDev ? (
              <div className="flex items-center gap-2">
                <StarRating value={5} size="sm" color="#7dd3fc" />
                <span className="text-xs font-mono" style={{ color: '#7dd3fc' }}>Developer</span>
              </div>
            ) : avgRating !== null ? (
              <div className="flex items-center gap-2">
                <StarRating value={avgRating} size="sm" />
                <span className="text-xs font-semibold text-[#EDEDEF]">{avgRating.toFixed(1)}</span>
                <span className="text-xs" style={{ color: '#8A8F98' }}>({reviewList.length} {reviewList.length === 1 ? 'review' : 'reviews'})</span>
              </div>
            ) : (
              <p className="text-xs" style={{ color: '#8A8F98' }}>No reviews yet</p>
            )}

            <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Stat label="Spots"  value={(spotCount as any)?.count ?? 0} />
              <div className="w-px h-4" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <Stat label="Events" value={(eventCount as any)?.count ?? 0} />
              <div className="w-px h-4" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <Stat label="Reviews" value={reviewList.length} />
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mb-3">
        <p className="text-[11px] font-mono text-[#5E6AD2] uppercase tracking-widest mb-1">Community feedback</p>
        <h2 className="text-xl font-bold text-[#EDEDEF] tracking-tight mb-5">Reviews</h2>
      </div>

      {reviewList.length === 0 ? (
        <div className="text-center py-10 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-sm" style={{ color: '#8A8F98' }}>
            {isDev ? 'Developer accounts have a permanent 5-star status.' : 'No reviews yet.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reviewList.map(review => (
            <div key={review.id} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <StarRating value={review.rating} size="sm" color={isDev ? '#7dd3fc' : undefined} />
                  <span className="text-xs font-semibold text-[#EDEDEF]">{review.rating}/5</span>
                </div>
                <Link href={`/profile/${(review.profiles as any)?.username ?? ''}`} className="text-[11px] font-mono hover:text-[#EDEDEF] transition-colors" style={{ color: '#8A8F98' }}>
                  @{(review.profiles as any)?.username ?? 'unknown'}
                </Link>
              </div>
              {review.comment && <p className="text-sm leading-relaxed" style={{ color: '#EDEDEF' }}>{review.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span className="text-sm font-bold text-[#EDEDEF]">{value}</span>
      <span className="text-xs font-mono ml-1" style={{ color: '#8A8F98' }}>{label}</span>
    </div>
  )
}
