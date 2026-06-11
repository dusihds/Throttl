import Link from 'next/link'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Avatar from '@/components/Avatar'
import StarRating from '@/components/StarRating'
import SearchInput from './SearchInput'

export const revalidate = 0

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''
  const supabase = await createClient()

  const profiles = query.length >= 1
    ? await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio, is_developer, is_early_access')
        .ilike('username', `%${query}%`)
        .limit(24)
        .then(r => r.data ?? [])
    : []

  const profileIds = profiles.map(p => p.id)
  const reviewMap: Record<string, { avg: number; count: number }> = {}

  if (profileIds.length > 0) {
    const { data: reviews } = await supabase
      .from('profile_reviews')
      .select('reviewee_id, rating')
      .in('reviewee_id', profileIds)
    for (const r of reviews ?? []) {
      if (!reviewMap[r.reviewee_id]) reviewMap[r.reviewee_id] = { avg: 0, count: 0 }
      reviewMap[r.reviewee_id].count++
      reviewMap[r.reviewee_id].avg += r.rating
    }
    for (const id of Object.keys(reviewMap)) {
      reviewMap[id].avg = Math.round((reviewMap[id].avg / reviewMap[id].count) * 10) / 10
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="text-[11px] font-mono text-[#5E6AD2] uppercase tracking-widest mb-2">Community</p>
        <h1 className="text-3xl font-bold text-[#EDEDEF] tracking-tight flex items-center gap-2 mb-6">
          <Search className="w-7 h-7 text-[#5E6AD2]" />
          Find People
        </h1>
        <SearchInput initialQuery={query} />
      </div>

      {query.length === 0 && (
        <p className="text-sm text-center py-16" style={{ color: '#8A8F98' }}>Start typing to search profiles</p>
      )}

      {query.length > 0 && profiles.length === 0 && (
        <p className="text-sm text-center py-16" style={{ color: '#8A8F98' }}>No profiles found for &quot;{query}&quot;</p>
      )}

      {profiles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {profiles.map(profile => {
            const stats   = reviewMap[profile.id]
            const avgRating = stats ? stats.avg : null
            const isDev   = profile.is_developer ?? false
            return (
              <Link
                key={profile.id}
                href={`/profile/${profile.username}`}
                className="card p-4 flex items-center gap-4 group hover:border-[rgba(94,106,210,0.25)] transition-all"
              >
                <Avatar username={profile.username} avatarUrl={profile.avatar_url} size="md" isDev={isDev} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-[#EDEDEF] group-hover:text-white transition-colors">
                      @{profile.username}
                    </span>
                    {isDev && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full tracking-widest"
                        style={{ background: 'rgba(94,106,210,0.15)', color: '#818cf8' }}>
                        DEV
                      </span>
                    )}
                    {profile.is_early_access && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full tracking-widest"
                        style={{ background: 'rgba(125,211,252,0.10)', color: '#7dd3fc' }}>
                        EARLY
                      </span>
                    )}
                  </div>
                  {profile.bio && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: '#8A8F98' }}>{profile.bio}</p>
                  )}
                  <div className="mt-1.5">
                    {isDev ? (
                      <StarRating value={5} size="xs" color="#7dd3fc" />
                    ) : avgRating !== null ? (
                      <div className="flex items-center gap-1.5">
                        <StarRating value={avgRating} size="xs" />
                        <span className="text-[11px] font-mono text-[#EDEDEF]">{avgRating.toFixed(1)}</span>
                        <span className="text-[10px] font-mono" style={{ color: '#8A8F98' }}>({stats!.count})</span>
                      </div>
                    ) : (
                      <span className="text-[11px] font-mono" style={{ color: '#8A8F98' }}>No reviews yet</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
