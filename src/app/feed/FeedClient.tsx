'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { containsSlur } from '@/lib/filter'
import FeedPostCard from '@/components/FeedPostCard'
import type { FeedPost } from '@/lib/types'
import { PlusCircle, X, BarChart2, Loader2, AlertCircle, MessageCircle, Clock, Flame, MessageSquare, TrendingDown } from 'lucide-react'

interface Props {
  initialPosts: FeedPost[]
  currentUserId: string | null
}

type SortBy = 'newest' | 'top' | 'discussed' | 'controversial'

const SORT_OPTIONS: { value: SortBy; label: string; icon: React.ReactNode }[] = [
  { value: 'newest',       label: 'Newest',       icon: <Clock className="w-3.5 h-3.5" /> },
  { value: 'top',          label: 'Top',          icon: <Flame className="w-3.5 h-3.5" /> },
  { value: 'discussed',    label: 'Most Replied',  icon: <MessageSquare className="w-3.5 h-3.5" /> },
  { value: 'controversial',label: 'Controversial', icon: <TrendingDown className="w-3.5 h-3.5" /> },
]

const MAX_LENGTH = 500

export default function FeedClient({ initialPosts, currentUserId }: Props) {
  const [posts, setPosts]           = useState(initialPosts)
  const [sortBy, setSortBy]         = useState<SortBy>('newest')
  const [composing, setComposing]   = useState(false)
  const [content, setContent]       = useState('')
  const [isPoll, setIsPoll]         = useState(false)
  const [options, setOptions]       = useState(['', ''])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const supabase = createClient()

  const sorted = useMemo(() => {
    const copy = [...posts]
    switch (sortBy) {
      case 'newest':
        return copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      case 'top':
        return copy.sort((a, b) => {
          const aL = a.feed_reactions?.filter(r => r.reaction === 'like').length ?? 0
          const bL = b.feed_reactions?.filter(r => r.reaction === 'like').length ?? 0
          return bL - aL
        })
      case 'discussed':
        return copy.sort((a, b) => (b.feed_replies?.[0]?.count ?? 0) - (a.feed_replies?.[0]?.count ?? 0))
      case 'controversial':
        return copy.sort((a, b) => {
          const score = (p: FeedPost) => {
            const likes    = p.feed_reactions?.filter(r => r.reaction === 'like').length    ?? 0
            const dislikes = p.feed_reactions?.filter(r => r.reaction === 'dislike').length ?? 0
            return Math.min(likes, dislikes) * 2 + Math.abs(likes - dislikes)
          }
          return score(b) - score(a)
        })
    }
  }, [posts, sortBy])

  function reset() {
    setContent('')
    setIsPoll(false)
    setOptions(['', ''])
    setError('')
    setComposing(false)
  }

  async function submit() {
    const trimmed = content.trim()
    if (!trimmed || !currentUserId) return

    const check = containsSlur(trimmed)
    if (check.blocked) { setError(check.message!); return }

    if (isPoll) {
      const valid = options.map(o => o.trim()).filter(Boolean)
      if (valid.length < 2) { setError('Add at least 2 poll options.'); return }
      for (const opt of valid) {
        const c = containsSlur(opt)
        if (c.blocked) { setError(c.message!); return }
      }
    }

    setSubmitting(true)
    setError('')

    const type = isPoll ? 'poll' : 'post'
    const { data: post, error: postErr } = await supabase
      .from('feed_posts')
      .insert({ user_id: currentUserId, content: trimmed, type })
      .select('*, profiles!user_id(id, username, avatar_url, is_developer)')
      .single()

    if (postErr || !post) {
      setError(postErr?.message ?? 'Failed to post.')
      setSubmitting(false)
      return
    }

    let pollOptions: any[] = []
    if (isPoll) {
      const valid = options.map(o => o.trim()).filter(Boolean)
      const { data: opts } = await supabase
        .from('feed_poll_options')
        .insert(valid.map((text, i) => ({ post_id: post.id, text, position: i })))
        .select('id, text, position')
      pollOptions = (opts ?? []).map(o => ({ ...o, feed_poll_votes: [{ count: 0 }] }))
    }

    const newPost: FeedPost = {
      ...post,
      feed_poll_options: pollOptions,
      feed_replies: [{ count: 0 }],
      feed_reactions: [],
    }

    setPosts(prev => [newPost, ...prev])
    reset()
    setSubmitting(false)
  }

  function setOption(i: number, val: string) {
    setOptions(prev => prev.map((o, idx) => idx === i ? val : o))
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Compose ─────────────────────────────────────── */}
      {currentUserId && (
        <div
          className="rounded-2xl p-4"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {!composing ? (
            <button
              onClick={() => setComposing(true)}
              className="w-full text-left text-sm px-4 py-3 rounded-xl transition-colors"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: '#8A8F98',
              }}
            >
              What&apos;s on your mind about cars?
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                maxLength={MAX_LENGTH}
                rows={3}
                autoFocus
                placeholder="What's on your mind about cars?"
                className="input resize-none"
              />

              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-xs font-mono"
                  style={{ color: content.length > MAX_LENGTH * 0.9 ? '#f87171' : '#8A8F98' }}
                >
                  {content.length}/{MAX_LENGTH}
                </span>
                <button
                  type="button"
                  onClick={() => setIsPoll(p => !p)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    background: isPoll ? 'rgba(94,106,210,0.15)' : 'rgba(255,255,255,0.04)',
                    color: isPoll ? '#818cf8' : '#8A8F98',
                    border: isPoll ? '1px solid rgba(94,106,210,0.30)' : '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  Poll
                </button>
              </div>

              {isPoll && (
                <div className="flex flex-col gap-2 pl-1">
                  {options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={opt}
                        onChange={e => setOption(i, e.target.value)}
                        placeholder={`Option ${i + 1}`}
                        maxLength={100}
                        className="input flex-1"
                        style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setOptions(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-[#8A8F98] hover:text-[#f87171] transition-colors p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {options.length < 4 && (
                    <button
                      type="button"
                      onClick={() => setOptions(prev => [...prev, ''])}
                      className="text-xs text-[#5E6AD2] hover:text-[#818cf8] transition-colors flex items-center gap-1 mt-0.5 ml-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Add option
                    </button>
                  )}
                </div>
              )}

              {error && (
                <div
                  className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-lg"
                  style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex items-center gap-2 justify-end">
                <button type="button" onClick={reset} className="btn-secondary text-sm py-2 px-4">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting || !content.trim()}
                  className="btn-primary text-sm py-2 px-5"
                >
                  {submitting
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <MessageCircle className="w-4 h-4" />
                  }
                  {submitting ? 'Posting…' : isPoll ? 'Post Poll' : 'Post'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Sort bar ────────────────────────────────────── */}
      {posts.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200"
              style={{
                background: sortBy === opt.value ? 'rgba(94,106,210,0.15)' : 'rgba(255,255,255,0.04)',
                color:      sortBy === opt.value ? '#818cf8' : '#8A8F98',
                border:     sortBy === opt.value ? '1px solid rgba(94,106,210,0.30)' : '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Feed ────────────────────────────────────────── */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center text-center py-24">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: 'rgba(94,106,210,0.08)', border: '1px solid rgba(94,106,210,0.15)' }}
          >
            <MessageCircle className="w-7 h-7 text-[#5E6AD2]" />
          </div>
          <p className="text-lg font-semibold text-[#EDEDEF] mb-2">No posts yet</p>
          <p className="text-sm" style={{ color: '#8A8F98' }}>
            {currentUserId ? 'Start the conversation above.' : 'Sign in to be the first to post.'}
          </p>
        </div>
      ) : (
        sorted.map((post, i) => (
          <FeedPostCard key={post.id} post={post} currentUserId={currentUserId} index={i} />
        ))
      )}
    </div>
  )
}
