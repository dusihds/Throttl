'use client'

import { useState, useEffect } from 'react'
import {
  ThumbsUp, ThumbsDown, MessageCircle,
  ChevronDown, ChevronUp, Loader2, Send, AlertCircle, BarChart2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { containsSlur } from '@/lib/filter'
import { formatDistanceToNow } from 'date-fns'
import type { FeedPost, FeedReply } from '@/lib/types'

interface Props {
  post: FeedPost
  currentUserId: string | null
  index?: number
}

export default function FeedPostCard({ post, currentUserId, index = 0 }: Props) {
  const supabase = createClient()

  // ── Reactions ──────────────────────────────────────────
  const initLikes    = post.feed_reactions?.filter(r => r.reaction === 'like').length    ?? 0
  const initDislikes = post.feed_reactions?.filter(r => r.reaction === 'dislike').length ?? 0
  const initUserRx   = (post.feed_reactions?.find(r => r.user_id === currentUserId)?.reaction ?? null) as 'like' | 'dislike' | null

  const [likes, setLikes]             = useState(initLikes)
  const [dislikes, setDislikes]       = useState(initDislikes)
  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(initUserRx)
  const [rxPending, setRxPending]     = useState<'like' | 'dislike' | null>(null)

  // ── Poll ───────────────────────────────────────────────
  const initCounts = Object.fromEntries(
    (post.feed_poll_options ?? []).map(o => [o.id, o.feed_poll_votes?.[0]?.count ?? 0])
  )
  const [pollCounts, setPollCounts]   = useState<Record<string, number>>(initCounts)
  const [userVote, setUserVote]       = useState<string | null>(null)
  const [voting, setVoting]           = useState(false)

  useEffect(() => {
    if (post.type !== 'poll' || !currentUserId) return
    supabase
      .from('feed_poll_votes')
      .select('option_id')
      .eq('post_id', post.id)
      .eq('user_id', currentUserId)
      .maybeSingle()
      .then(({ data }) => { if (data) setUserVote(data.option_id) })
  }, [post.id, post.type, currentUserId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Replies ────────────────────────────────────────────
  const [replyCount, setReplyCount]       = useState(post.feed_replies?.[0]?.count ?? 0)
  const [showReplies, setShowReplies]     = useState(false)
  const [replies, setReplies]             = useState<FeedReply[]>([])
  const [repliesLoaded, setRepliesLoaded] = useState(false)
  const [repliesLoading, setRepliesLoading] = useState(false)
  const [replyText, setReplyText]         = useState('')
  const [replySubmitting, setReplySubmitting] = useState(false)
  const [replyError, setReplyError]       = useState('')

  useEffect(() => {
    if (!showReplies || repliesLoaded) return
    setRepliesLoading(true)
    supabase
      .from('feed_replies')
      .select('*, profiles!user_id(id, username, avatar_url, is_developer), feed_reactions(id, reaction, user_id)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setReplies((data ?? []) as FeedReply[])
        setRepliesLoaded(true)
        setRepliesLoading(false)
      })
  }, [showReplies, repliesLoaded, post.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ───────────────────────────────────────────

  async function react(reaction: 'like' | 'dislike') {
    if (!currentUserId || rxPending) return
    setRxPending(reaction)

    if (userReaction === reaction) {
      await supabase
        .from('feed_reactions')
        .delete()
        .eq('user_id', currentUserId)
        .eq('target_id', post.id)
        .eq('target_type', 'post')
      setUserReaction(null)
      reaction === 'like' ? setLikes(n => n - 1) : setDislikes(n => n - 1)
    } else {
      await supabase
        .from('feed_reactions')
        .upsert(
          { user_id: currentUserId, target_id: post.id, target_type: 'post', reaction },
          { onConflict: 'user_id,target_id,target_type' }
        )
      if (userReaction === 'like') setLikes(n => n - 1)
      if (userReaction === 'dislike') setDislikes(n => n - 1)
      setUserReaction(reaction)
      reaction === 'like' ? setLikes(n => n + 1) : setDislikes(n => n + 1)
    }
    setRxPending(null)
  }

  async function vote(optionId: string) {
    if (!currentUserId || voting || userVote !== null) return
    setVoting(true)
    const { error } = await supabase
      .from('feed_poll_votes')
      .insert({ post_id: post.id, option_id: optionId, user_id: currentUserId })
    if (!error) {
      setUserVote(optionId)
      setPollCounts(prev => ({ ...prev, [optionId]: (prev[optionId] ?? 0) + 1 }))
    }
    setVoting(false)
  }

  async function submitReply() {
    const trimmed = replyText.trim()
    if (!trimmed || !currentUserId) return
    const check = containsSlur(trimmed)
    if (check.blocked) { setReplyError(check.message!); return }

    setReplySubmitting(true)
    setReplyError('')
    const { data: reply, error } = await supabase
      .from('feed_replies')
      .insert({ post_id: post.id, user_id: currentUserId, content: trimmed })
      .select('*, profiles!user_id(id, username, avatar_url, is_developer)')
      .single()

    if (error || !reply) {
      setReplyError(error?.message ?? 'Failed to post reply.')
    } else {
      setReplies(prev => [...prev, { ...reply, feed_reactions: [] } as FeedReply])
      setReplyCount(n => n + 1)
      setReplyText('')
    }
    setReplySubmitting(false)
  }

  const totalVotes = Object.values(pollCounts).reduce((a, b) => a + b, 0)
  const hasVoted   = userVote !== null

  // ── Render ─────────────────────────────────────────────

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.35)',
        animation: 'card-enter 0.45s var(--ease-expo) both',
        animationDelay: `${index * 55}ms`,
      }}
    >
      {/* Author */}
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: 'rgba(94,106,210,0.18)', color: '#818cf8', border: '1px solid rgba(94,106,210,0.28)' }}
        >
          {post.profiles?.username?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <a href={`/profile/${post.profiles?.username ?? ''}`} className="text-sm font-semibold text-[#EDEDEF] hover:text-[#818cf8] transition-colors">@{post.profiles?.username ?? 'unknown'}</a>
            {post.profiles?.is_developer && <DevBadge />}
          </div>
          <span className="text-[11px] font-mono" style={{ color: '#8A8F98' }}>
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </span>
        </div>
        {post.type === 'poll' && (
          <div
            className="flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded-full shrink-0"
            style={{ background: 'rgba(94,106,210,0.10)', color: '#818cf8', border: '1px solid rgba(94,106,210,0.22)' }}
          >
            <BarChart2 className="w-3 h-3" />
            poll
          </div>
        )}
      </div>

      {/* Content */}
      <p className="text-sm text-[#EDEDEF] leading-relaxed whitespace-pre-wrap break-words mb-3">
        {post.content}
      </p>

      {/* Poll options */}
      {post.type === 'poll' && post.feed_poll_options && (
        <div className="flex flex-col gap-2 mb-4">
          {[...post.feed_poll_options]
            .sort((a, b) => a.position - b.position)
            .map(option => {
              const count   = pollCounts[option.id] ?? 0
              const pct     = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
              const isVoted = userVote === option.id
              const canVote = !hasVoted && !!currentUserId && !voting

              return (
                <button
                  key={option.id}
                  onClick={() => vote(option.id)}
                  disabled={!canVote}
                  className="relative w-full text-left px-4 py-3 rounded-xl text-sm overflow-hidden transition-all duration-200"
                  style={{
                    background: isVoted ? 'rgba(94,106,210,0.16)' : hasVoted ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.04)',
                    border: isVoted ? '1px solid rgba(94,106,210,0.38)' : '1px solid rgba(255,255,255,0.07)',
                    color: hasVoted ? (isVoted ? '#818cf8' : '#8A8F98') : '#EDEDEF',
                    cursor: canVote ? 'pointer' : 'default',
                  }}
                >
                  {hasVoted && (
                    <div
                      className="absolute inset-y-0 left-0 rounded-xl transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: isVoted ? 'rgba(94,106,210,0.12)' : 'rgba(255,255,255,0.03)',
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-between">
                    <span>{option.text}</span>
                    {hasVoted && (
                      <span className="text-xs font-mono ml-2 shrink-0" style={{ color: isVoted ? '#818cf8' : '#8A8F98' }}>
                        {pct}%
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          {hasVoted && (
            <p className="text-[11px] font-mono text-center" style={{ color: '#8A8F98' }}>
              {totalVotes} vote{totalVotes !== 1 ? 's' : ''} total
            </p>
          )}
          {!currentUserId && !hasVoted && (
            <p className="text-[11px] text-center" style={{ color: '#8A8F98' }}>Sign in to vote</p>
          )}
        </div>
      )}

      {/* Action bar */}
      <div
        className="flex items-center gap-1 pt-2.5"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <ReactionBtn
          active={userReaction === 'like'}
          pending={rxPending === 'like'}
          icon={<ThumbsUp className="w-3.5 h-3.5" />}
          count={likes}
          disabled={!currentUserId}
          onClick={() => react('like')}
        />
        <ReactionBtn
          active={userReaction === 'dislike'}
          pending={rxPending === 'dislike'}
          icon={<ThumbsDown className="w-3.5 h-3.5" />}
          count={dislikes}
          disabled={!currentUserId}
          onClick={() => react('dislike')}
        />
        <button
          onClick={() => setShowReplies(s => !s)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg ml-1 transition-all"
          style={{
            background: showReplies ? 'rgba(255,255,255,0.06)' : 'transparent',
            color: '#8A8F98',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#EDEDEF')}
          onMouseLeave={e => (e.currentTarget.style.color = '#8A8F98')}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>{replyCount}</span>
          {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Replies */}
      {showReplies && (
        <div
          className="mt-3 pt-3 flex flex-col gap-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          {repliesLoading ? (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="w-4 h-4 animate-spin text-[#5E6AD2]" />
            </div>
          ) : (
            replies.map(reply => (
              <ReplyCard key={reply.id} reply={reply} currentUserId={currentUserId} />
            ))
          )}

          {currentUserId && (
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-start gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                  style={{ background: 'rgba(94,106,210,0.12)', color: '#818cf8', border: '1px solid rgba(94,106,210,0.22)' }}
                >
                  ·
                </div>
                <textarea
                  value={replyText}
                  onChange={e => { setReplyText(e.target.value); setReplyError('') }}
                  placeholder="Write a reply…"
                  rows={2}
                  maxLength={300}
                  className="input resize-none flex-1"
                  style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                />
              </div>
              {replyError && (
                <div
                  className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg ml-9"
                  style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}
                >
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {replyError}
                </div>
              )}
              <div className="flex justify-end">
                <button
                  onClick={submitReply}
                  disabled={replySubmitting || !replyText.trim()}
                  className="btn-primary text-xs py-1.5 px-4"
                >
                  {replySubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  Reply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── ReplyCard ─────────────────────────────────────────────────────────────

function ReplyCard({ reply, currentUserId }: { reply: FeedReply; currentUserId: string | null }) {
  const supabase = createClient()

  const initLikes    = reply.feed_reactions?.filter(r => r.reaction === 'like').length    ?? 0
  const initDislikes = reply.feed_reactions?.filter(r => r.reaction === 'dislike').length ?? 0
  const initUserRx   = (reply.feed_reactions?.find(r => r.user_id === currentUserId)?.reaction ?? null) as 'like' | 'dislike' | null

  const [likes, setLikes]             = useState(initLikes)
  const [dislikes, setDislikes]       = useState(initDislikes)
  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(initUserRx)
  const [rxPending, setRxPending]     = useState<'like' | 'dislike' | null>(null)

  async function react(reaction: 'like' | 'dislike') {
    if (!currentUserId || rxPending) return
    setRxPending(reaction)

    if (userReaction === reaction) {
      await supabase
        .from('feed_reactions')
        .delete()
        .eq('user_id', currentUserId)
        .eq('target_id', reply.id)
        .eq('target_type', 'reply')
      setUserReaction(null)
      reaction === 'like' ? setLikes(n => n - 1) : setDislikes(n => n - 1)
    } else {
      await supabase
        .from('feed_reactions')
        .upsert(
          { user_id: currentUserId, target_id: reply.id, target_type: 'reply', reaction },
          { onConflict: 'user_id,target_id,target_type' }
        )
      if (userReaction === 'like') setLikes(n => n - 1)
      if (userReaction === 'dislike') setDislikes(n => n - 1)
      setUserReaction(reaction)
      reaction === 'like' ? setLikes(n => n + 1) : setDislikes(n => n + 1)
    }
    setRxPending(null)
  }

  return (
    <div className="flex gap-2.5 pl-2">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
        style={{ background: 'rgba(255,255,255,0.05)', color: '#EDEDEF', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {reply.profiles?.username?.[0]?.toUpperCase() ?? '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <span className="text-xs font-semibold text-[#EDEDEF]">@{reply.profiles?.username ?? 'unknown'}</span>
          {reply.profiles?.is_developer && <DevBadge small />}
          <span className="text-[10px] font-mono" style={{ color: '#8A8F98' }}>
            {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className="text-xs text-[#EDEDEF] leading-relaxed whitespace-pre-wrap break-words mb-1.5">
          {reply.content}
        </p>
        <div className="flex items-center gap-0.5">
          <ReactionBtn
            active={userReaction === 'like'}
            pending={rxPending === 'like'}
            icon={<ThumbsUp className="w-3 h-3" />}
            count={likes}
            disabled={!currentUserId}
            onClick={() => react('like')}
            small
          />
          <ReactionBtn
            active={userReaction === 'dislike'}
            pending={rxPending === 'dislike'}
            icon={<ThumbsDown className="w-3 h-3" />}
            count={dislikes}
            disabled={!currentUserId}
            onClick={() => react('dislike')}
            small
          />
        </div>
      </div>
    </div>
  )
}

// ── ReactionBtn ───────────────────────────────────────────────────────────

function ReactionBtn({
  active, pending, icon, count, disabled, onClick, small,
}: {
  active: boolean
  pending: boolean
  icon: React.ReactNode
  count: number
  disabled: boolean
  onClick: () => void
  small?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || !!pending}
      className="flex items-center gap-1 rounded-lg transition-all duration-150"
      style={{
        padding: small ? '3px 7px' : '5px 10px',
        background: active ? 'rgba(94,106,210,0.14)' : 'transparent',
        color: active ? '#818cf8' : '#8A8F98',
        border: active ? '1px solid rgba(94,106,210,0.25)' : '1px solid transparent',
        cursor: disabled ? 'default' : 'pointer',
      }}
      onMouseEnter={e => { if (!disabled && !active) e.currentTarget.style.color = '#EDEDEF' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#8A8F98' }}
    >
      {pending
        ? <Loader2 className={`${small ? 'w-3 h-3' : 'w-3.5 h-3.5'} animate-spin`} />
        : icon
      }
      <span className={`font-mono ${small ? 'text-[10px]' : 'text-[11px]'}`}>{count}</span>
    </button>
  )
}

// ── DevBadge ──────────────────────────────────────────────────────────────

function DevBadge({ small }: { small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center font-mono font-bold rounded tracking-widest uppercase ${small ? 'text-[8px] px-1 py-0.5' : 'text-[9px] px-1.5 py-0.5'}`}
      style={{ background: 'rgba(94,106,210,0.15)', color: '#818cf8', border: '1px solid rgba(94,106,210,0.30)' }}
    >
      ⚡ DEV
    </span>
  )
}
