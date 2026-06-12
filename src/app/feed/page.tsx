import { createClient } from '@/lib/supabase/server'
import FeedClient from './FeedClient'
import type { FeedPost } from '@/lib/types'
import { MessageCircle } from 'lucide-react'
import OnlineCounter from '@/components/OnlineCounter'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Feed — Throttl',
  description: 'Community discussions, polls, and car talk from Throttl members.',
}

export const revalidate = 0

export default async function FeedPage() {
  const supabase = await createClient()

  const [{ data: { user } }, { data: posts }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('feed_posts')
      .select(`
        *,
        profiles!user_id(id, username, avatar_url, is_developer),
        feed_poll_options(id, text, position, feed_poll_votes(count)),
        feed_replies(count),
        feed_reactions(id, reaction, user_id)
      `)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
          <p className="text-[11px] font-mono text-[#F97316] uppercase tracking-widest">Community</p>
          <OnlineCounter />
        </div>
        <h1 className="text-3xl font-bold text-[#F5F0EB] tracking-tight flex items-center gap-2">
          <MessageCircle className="w-7 h-7 text-[#F97316]" />
          The Feed
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8C8680' }}>
          Share opinions, drop polls, and talk cars.
        </p>
      </div>

      <FeedClient
        initialPosts={(posts ?? []) as FeedPost[]}
        currentUserId={user?.id ?? null}
      />
    </div>
  )
}
