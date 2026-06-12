'use client'

import Image from 'next/image'
import { MapPin, Clock, Users, RefreshCw, Navigation, ShieldCheck, DollarSign, Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { formatKm } from '@/lib/utils'
import type { CarEvent } from '@/lib/types'

interface Props {
  event: CarEvent
  distance?: number
  index?: number
  isOwner?: boolean
}

function nextOccurrence(startTime: string, rule: string): Date {
  const start = new Date(startTime)
  const now   = new Date()
  const h = start.getHours()
  const m = start.getMinutes()

  if (rule.includes('FREQ=DAILY')) {
    const d = new Date(); d.setHours(h, m, 0, 0)
    if (d <= now) d.setDate(d.getDate() + 1)
    return d
  }

  if (rule.includes('FREQ=WEEKLY')) {
    const DAY: Record<string, number> = { SU:0, MO:1, TU:2, WE:3, TH:4, FR:5, SA:6 }
    const byday = rule.match(/BYDAY=([A-Z,]+)/)?.[1]
    const days = byday
      ? byday.split(',').map(d => DAY[d] ?? -1).filter(d => d >= 0)
      : [start.getDay()]
    let earliest: Date | null = null
    for (const day of days) {
      const d = new Date(); d.setHours(h, m, 0, 0)
      let diff = (day - d.getDay() + 7) % 7
      if (diff === 0 && d <= now) diff = 7
      d.setDate(d.getDate() + diff)
      if (!earliest || d < earliest) earliest = d
    }
    return earliest ?? start
  }

  if (rule.includes('FREQ=MONTHLY')) {
    const day = start.getDate()
    const d = new Date(); d.setDate(day); d.setHours(h, m, 0, 0)
    if (d <= now) { d.setMonth(d.getMonth() + 1); d.setDate(day) }
    return d
  }

  return start
}

function recurrenceLabel(rule: string): string {
  const days: Record<string, string> = {
    MO: 'Mon', TU: 'Tue', WE: 'Wed', TH: 'Thu', FR: 'Fri', SA: 'Sat', SU: 'Sun',
  }
  if (rule.includes('FREQ=WEEKLY')) {
    const m = rule.match(/BYDAY=([A-Z,]+)/)
    if (m) return `Every ${m[1].split(',').map(d => days[d] || d).join(', ')}`
    return 'Weekly'
  }
  if (rule.includes('FREQ=MONTHLY')) return 'Monthly'
  if (rule.includes('FREQ=DAILY')) return 'Daily'
  return 'Recurring'
}

export default function EventCard({ event, distance, index = 0, isOwner = false }: Props) {
  const ref      = useRef<HTMLDivElement>(null)
  const router   = useRouter()
  const supabase = createClient()

  const [pos, setPos]         = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)
  const [menu, setMenu]       = useState<{ x: number; y: number } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting]           = useState(false)

  // Close menu on any outside click
  useEffect(() => {
    if (!menu) return
    function close() { setMenu(null); setConfirmDelete(false) }
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [menu])

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top })
  }

  function onContextMenu(e: React.MouseEvent<HTMLDivElement>) {
    if (!isOwner) return
    e.preventDefault()
    const x = Math.min(e.clientX, window.innerWidth - 170)
    const y = Math.min(e.clientY, window.innerHeight - 110)
    setMenu({ x, y })
    setConfirmDelete(false)
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation()
    setMenu(null)
    router.push(`/events/${event.id}/edit`)
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    await supabase.from('car_events').delete().eq('id', event.id)
    setMenu(null)
    router.refresh()
  }

  const isFull =
    typeof event.attendee_count === 'number' &&
    event.max_capacity !== null &&
    event.max_capacity !== undefined &&
    event.attendee_count >= event.max_capacity

  return (
    <>
      <div
        ref={ref}
        onMouseMove={onMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onContextMenu={onContextMenu}
        className="card relative overflow-hidden group transition-transform duration-300 hover:-translate-y-1.5"
        style={{
          animation: 'card-enter 0.45s var(--ease-expo) both',
          animationDelay: `${index * 60}ms`,
          cursor: isOwner ? 'context-menu' : 'default',
        }}
      >
        {/* Spotlight */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl z-10 transition-opacity duration-300"
          style={{
            opacity: hovered ? 1 : 0,
            background: `radial-gradient(280px circle at ${pos.x}px ${pos.y}px, rgba(249,115,22,0.12), transparent 70%)`,
          }}
        />

        {/* Cover image */}
        <div className="aspect-video relative overflow-hidden rounded-t-2xl bg-[#0a0a0c]">
          {event.cover_image_url ? (
            <Image src={event.cover_image_url} alt={event.title} fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl opacity-20 select-none">🏁</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {event.is_recurring && event.recurrence_rule && (
                <span className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full tracking-wide"
                  style={{ background: 'rgba(249,115,22,0.20)', color: '#FB923C', backdropFilter: 'blur(8px)', border: '1px solid rgba(249,115,22,0.30)' }}>
                  <RefreshCw className="w-2.5 h-2.5" />
                  {recurrenceLabel(event.recurrence_rule)}
                </span>
              )}
              {event.is_verified && (
                <span className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(34,197,94,0.18)', color: '#4ade80', backdropFilter: 'blur(8px)', border: '1px solid rgba(34,197,94,0.35)' }}>
                  <ShieldCheck className="w-2.5 h-2.5" />
                  Verified
                </span>
              )}
              {event.requires_payment && (
                <span className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(234,179,8,0.18)', color: '#fbbf24', backdropFilter: 'blur(8px)', border: '1px solid rgba(234,179,8,0.30)' }}>
                  <DollarSign className="w-2.5 h-2.5" />
                  $1 RSVP
                </span>
              )}
            </div>
            {distance !== undefined && (
              <span className="flex items-center gap-1 text-[10px] font-mono font-medium px-2.5 py-1 rounded-full ml-auto"
                style={{ background: 'rgba(5,5,6,0.75)', color: '#FB923C', backdropFilter: 'blur(8px)', border: '1px solid rgba(249,115,22,0.25)' }}>
                <Navigation className="w-2.5 h-2.5" />
                {formatKm(distance)}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-[#F5F0EB] text-base leading-tight tracking-tight">{event.title}</h3>

          {event.profiles && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <button
                type="button"
                onClick={e => { e.preventDefault(); e.stopPropagation(); router.push(`/profile/${event.profiles!.username}`) }}
                className="text-[11px] text-[#8C8680] font-mono hover:text-[#F97316] transition-colors bg-transparent border-none p-0 cursor-pointer"
              >
                @{event.profiles.username}
              </button>
              {event.profiles.is_developer && <DevBadge />}
            </div>
          )}

          <div className="mt-3 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-[#8C8680] text-xs">
              <Clock className="w-3 h-3 text-[#F97316] shrink-0" />
              <span className="text-[#F5F0EB] font-medium">
                {format(
                  event.is_recurring && event.recurrence_rule
                    ? nextOccurrence(event.start_time, event.recurrence_rule)
                    : new Date(event.start_time),
                  'EEE, MMM d · h:mm a'
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[#8C8680] text-xs">
              <MapPin className="w-3 h-3 text-[#F97316] shrink-0" />
              <span className="truncate">{event.location_name}</span>
            </div>
            {typeof event.attendee_count === 'number' && (
              <div className="flex items-center gap-2 text-[#8C8680] text-xs">
                <Users className="w-3 h-3 text-[#F97316] shrink-0" />
                {event.max_capacity != null ? (
                  <span style={{ color: isFull ? '#f87171' : '#8C8680' }}>
                    {event.attendee_count}/{event.max_capacity} {isFull ? '· Full' : 'going'}
                  </span>
                ) : (
                  <span>{event.attendee_count} {event.attendee_count === 1 ? 'person' : 'people'} going</span>
                )}
              </div>
            )}
            {event.min_rating_required != null && (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: '#fbbf24' }}>
                <span>★</span>
                <span>{event.min_rating_required}+ rating recommended</span>
              </div>
            )}
          </div>

          {/* Owner hint */}
          {isOwner && (
            <p className="mt-3 text-[10px] font-mono" style={{ color: 'rgba(249,115,22,0.5)' }}>
              right-click to edit or delete
            </p>
          )}
        </div>
      </div>

      {/* Context menu — rendered via portal to escape transform stacking context */}
      {menu && createPortal(
        <div
          style={{
            position: 'fixed',
            top: menu.y,
            left: menu.x,
            zIndex: 99999,
            minWidth: 160,
            background: 'rgba(18,18,20,0.97)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 12,
            padding: '6px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(20px)',
          }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={handleEdit}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 text-left"
            style={{ color: '#F5F0EB' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(249,115,22,0.15)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Pencil className="w-3.5 h-3.5 text-[#FB923C]" />
            Edit event
          </button>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 text-left disabled:opacity-50"
            style={{ color: confirmDelete ? '#f87171' : '#8C8680' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.12)'
              e.currentTarget.style.color = '#f87171'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = confirmDelete ? '#f87171' : '#8C8680'
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deleting ? 'Deleting…' : confirmDelete ? 'Tap again to confirm' : 'Delete event'}
          </button>
        </div>,
        document.body
      )}
    </>
  )
}

function DevBadge() {
  return (
    <span
      className="inline-flex items-center text-[9px] font-mono font-bold px-1.5 py-0.5 rounded tracking-widest uppercase"
      style={{ background: 'rgba(249,115,22,0.15)', color: '#FB923C', border: '1px solid rgba(249,115,22,0.30)' }}
      title="Developer"
    >
      ⚡ DEV
    </span>
  )
}
