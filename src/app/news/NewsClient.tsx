'use client'

import { useState, useEffect, useMemo } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ExternalLink, Newspaper, Star } from 'lucide-react'
import type { NewsItem, NewsCategory } from '@/lib/news'
import { CATEGORY_META } from '@/lib/news'

type Filter = 'all' | 'cars' | 'motorsport' | NewsCategory

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as NewsCategory[]

function useFavourites() {
  const [favs, setFavs] = useState<NewsCategory[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('news-favourites')
      if (stored) setFavs(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  function toggle(cat: NewsCategory) {
    setFavs(prev => {
      const next = prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
      try { localStorage.setItem('news-favourites', JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }

  return { favs, toggle }
}

export default function NewsClient({ articles }: { articles: NewsItem[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const { favs, toggle: toggleFav } = useFavourites()

  const visible = useMemo(() => {
    if (filter === 'all') return articles
    if (filter === 'cars') return articles.filter(a => CATEGORY_META[a.category].group === 'cars')
    if (filter === 'motorsport') return articles.filter(a => CATEGORY_META[a.category].group === 'motorsport')
    return articles.filter(a => a.category === filter)
  }, [articles, filter])

  // sort: favoured categories bubble to top
  const displayed = useMemo(() => {
    if (favs.length === 0) return visible
    return [...visible].sort((a, b) => {
      const aFav = favs.includes(a.category) ? 0 : 1
      const bFav = favs.includes(b.category) ? 0 : 1
      return aFav - bFav
    })
  }, [visible, favs])

  const counts = useMemo<Record<string, number>>(() => ({
    all:        articles.length,
    cars:       articles.filter(a => CATEGORY_META[a.category].group === 'cars').length,
    motorsport: articles.filter(a => CATEGORY_META[a.category].group === 'motorsport').length,
    ...Object.fromEntries(ALL_CATEGORIES.map(c => [c, articles.filter(a => a.category === c).length])),
  }), [articles])

  return (
    <div>
      {/* ── Top-level group filter ──────────────────────── */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {([
          { value: 'all',        label: 'All' },
          { value: 'cars',       label: 'Cars' },
          { value: 'motorsport', label: 'Motorsport' },
        ] as { value: Filter; label: string }[]).map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200"
            style={{
              background: filter === opt.value ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.04)',
              color:      filter === opt.value ? '#FB923C' : '#8C8680',
              border:     filter === opt.value ? '1px solid rgba(249,115,22,0.30)' : '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {opt.label}
            <span
              className="text-xs font-mono px-1.5 py-0.5 rounded-full"
              style={{
                background: filter === opt.value ? 'rgba(249,115,22,0.20)' : 'rgba(255,255,255,0.06)',
                color:      filter === opt.value ? '#FB923C' : '#8C8680',
              }}
            >
              {counts[opt.value]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Subcategory chips ────────────────────────────── */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#8C8680' }}>Filter:</span>
        {ALL_CATEGORIES.map(cat => {
          const meta = CATEGORY_META[cat]
          const active = filter === cat
          const isFav  = favs.includes(cat)
          if (counts[cat] === 0) return null
          return (
            <div key={cat} className="flex items-center gap-0.5">
              <button
                onClick={() => setFilter(active ? 'all' : cat)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-l-lg transition-all duration-200"
                style={{
                  background:   active ? meta.color.bg : 'rgba(255,255,255,0.04)',
                  color:        active ? meta.color.text : '#8C8680',
                  borderTop:    `1px solid ${active ? meta.color.border : 'rgba(255,255,255,0.07)'}`,
                  borderBottom: `1px solid ${active ? meta.color.border : 'rgba(255,255,255,0.07)'}`,
                  borderLeft:   `1px solid ${active ? meta.color.border : 'rgba(255,255,255,0.07)'}`,
                  borderRight:  'none',
                }}
              >
                {meta.emoji} {meta.label}
                <span className="font-mono text-[10px]">{counts[cat]}</span>
              </button>
              <button
                onClick={() => toggleFav(cat)}
                title={isFav ? 'Remove from favourites' : 'Add to favourites'}
                className="flex items-center justify-center px-2 py-1.5 rounded-r-lg transition-all duration-200"
                style={{
                  background: isFav ? 'rgba(250,204,21,0.15)' : 'rgba(255,255,255,0.04)',
                  color:      isFav ? '#facc15' : '#8C8680',
                  border:     `1px solid ${isFav ? 'rgba(250,204,21,0.30)' : 'rgba(255,255,255,0.07)'}`,
                }}
              >
                <Star className="w-3 h-3" fill={isFav ? 'currentColor' : 'none'} />
              </button>
            </div>
          )
        })}
      </div>

      {favs.length > 0 && (
        <p className="text-[11px] font-mono mb-6" style={{ color: '#facc15' }}>
          ★ {favs.map(f => CATEGORY_META[f].label).join(', ')} pinned to top
        </p>
      )}

      {/* ── Grid ─────────────────────────────────────────── */}
      {displayed.length === 0 ? (
        <div className="flex flex-col items-center text-center py-24">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)' }}
          >
            <Newspaper className="w-7 h-7 text-[#F97316]" />
          </div>
          <p className="text-lg font-semibold text-[#F5F0EB] mb-2">No articles right now</p>
          <p className="text-sm" style={{ color: '#8C8680' }}>Feeds refresh every 30 minutes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayed.map((article, i) => (
            <NewsCard key={`${article.link}-${i}`} article={article} isFav={favs.includes(article.category)} />
          ))}
        </div>
      )}
    </div>
  )
}

function NewsCard({ article, isFav }: { article: NewsItem; isFav: boolean }) {
  const meta = CATEGORY_META[article.category]
  const [imgFailed, setImgFailed] = useState(false)

  let timeAgo = ''
  try {
    if (article.pubDate) timeAgo = formatDistanceToNow(new Date(article.pubDate), { addSuffix: true })
  } catch { /* invalid date */ }

  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="news-card group flex flex-col rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
        border: isFav ? `1px solid ${meta.color.border}` : '1px solid rgba(255,255,255,0.07)',
        boxShadow: isFav ? `0 2px 20px rgba(0,0,0,0.35), 0 0 0 1px ${meta.color.border}` : '0 2px 20px rgba(0,0,0,0.35)',
        textDecoration: 'none',
      }}
    >
      {/* Image */}
      <div className="aspect-video relative overflow-hidden bg-[#0a0a0c] shrink-0">
        {article.image && !imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{
              background: `linear-gradient(135deg, ${meta.color.bg} 0%, rgba(6,5,4,0.95) 100%)`,
            }}
          >
            <span className="text-5xl" style={{ filter: 'drop-shadow(0 0 16px rgba(249,115,22,0.35))' }}>{meta.emoji}</span>
            <span className="text-[10px] font-mono uppercase tracking-[0.18em]" style={{ color: meta.color.text, opacity: 0.7 }}>{article.source}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <span
          className="absolute top-3 left-3 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full"
          style={{ background: meta.color.bg, color: meta.color.text, border: `1px solid ${meta.color.border}`, backdropFilter: 'blur(8px)' }}
        >
          {meta.emoji} {meta.label}
        </span>
        {isFav && (
          <span className="absolute top-3 right-3 text-[10px] px-2 py-1 rounded-full font-mono"
            style={{ background: 'rgba(250,204,21,0.15)', color: '#facc15', border: '1px solid rgba(250,204,21,0.30)', backdropFilter: 'blur(8px)' }}>
            ★
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-mono font-medium" style={{ color: meta.color.text }}>{article.source}</span>
          {timeAgo && <span className="text-[11px] font-mono shrink-0" style={{ color: '#8C8680' }}>{timeAgo}</span>}
        </div>
        <h3 className="text-sm font-semibold text-[#F5F0EB] leading-snug mb-2 line-clamp-3 group-hover:text-white transition-colors">
          {article.title}
        </h3>
        {article.description && (
          <p className="text-xs leading-relaxed line-clamp-2 mb-3" style={{ color: '#8C8680' }}>
            {article.description}
          </p>
        )}
        <div className="mt-auto flex items-center gap-1 text-xs font-medium" style={{ color: meta.color.text }}>
          Read more <ExternalLink className="w-3 h-3" />
        </div>
      </div>
    </a>
  )
}
