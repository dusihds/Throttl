import Link from 'next/link'
import { Car, Calendar, ArrowRight, MapPin, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import SpotCard from '@/components/SpotCard'
import EventCard from '@/components/EventCard'
import type { CarSpot, CarEvent } from '@/lib/types'

export const revalidate = 60

export default async function Home() {
  const supabase = await createClient()

  const [{ data: spots }, { data: events }] = await Promise.all([
    supabase
      .from('car_spots')
      .select('*, profiles(id, username, avatar_url)')
      .order('spotted_at', { ascending: false })
      .limit(6),
    supabase
      .from('car_events')
      .select('*, profiles!user_id(id, username, avatar_url), event_attendees(count)')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(4),
  ])

  const enrichedEvents = (events ?? []).map((e: any) => ({
    ...e,
    attendee_count: e.event_attendees?.[0]?.count ?? 0,
  }))

  const hasContent = (spots?.length ?? 0) > 0 || enrichedEvents.length > 0

  return (
    <div className="max-w-6xl mx-auto px-4">

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center text-center pt-20 pb-24 md:pt-28 md:pb-32">

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 text-xs font-mono font-medium px-4 py-2 rounded-full mb-8 tracking-widest uppercase"
          style={{
            background: 'rgba(94,106,210,0.10)',
            color: '#818cf8',
            border: '1px solid rgba(94,106,210,0.22)',
          }}
        >
          <Zap className="w-3 h-3" />
          For car enthusiasts · by car enthusiasts
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-none tracking-[-0.03em] mb-6">
          <span className="gradient-text block">Spot.</span>
          <span className="shimmer-text block">Share.</span>
          <span className="gradient-text block">Celebrate.</span>
        </h1>

        {/* Subtext */}
        <p
          className="text-base sm:text-lg md:text-xl max-w-md mx-auto mb-10 leading-relaxed"
          style={{ color: '#8A8F98' }}
        >
          Log every car you spot, track their worth, and find car meetups near you.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/spots/new" className="btn-primary text-base px-8 py-3.5">
            <Car className="w-5 h-5" />
            Log a Spot
          </Link>
          <Link href="/events" className="btn-secondary text-base px-8 py-3.5">
            <Calendar className="w-5 h-5" />
            Browse Events
          </Link>
        </div>

        {/* Stats row */}
        {hasContent && (
          <div className="flex items-center gap-8 mt-12">
            {[
              { icon: Car,      label: 'Spots logged',    val: spots?.length ?? 0 },
              { icon: Calendar, label: 'Events upcoming', val: enrichedEvents.length },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className="text-2xl font-black text-[#EDEDEF] tracking-tight">{val}</span>
                <span className="text-[11px] font-mono text-[#8A8F98] uppercase tracking-widest">{label}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Section divider ──────────────────────────────────── */}
      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)' }} />

      {/* ── Recent Spots ─────────────────────────────────────── */}
      {spots && spots.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[11px] font-mono text-[#5E6AD2] uppercase tracking-widest mb-2">Community</p>
              <h2 className="text-2xl md:text-3xl font-bold text-[#EDEDEF] tracking-tight flex items-center gap-2">
                <Car className="w-6 h-6 text-[#5E6AD2]" />
                Recent Spots
              </h2>
            </div>
            <Link
              href="/spots"
              className="flex items-center gap-1.5 text-sm font-medium text-[#8A8F98] hover:text-[#5E6AD2] transition-colors duration-200"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(spots as CarSpot[]).map((spot) => (
              <SpotCard key={spot.id} spot={spot} />
            ))}
          </div>
        </section>
      )}

      {/* ── Section divider ──────────────────────────────────── */}
      {spots && spots.length > 0 && enrichedEvents.length > 0 && (
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)' }} />
      )}

      {/* ── Upcoming Events ───────────────────────────────────── */}
      {enrichedEvents.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[11px] font-mono text-[#5E6AD2] uppercase tracking-widest mb-2">Meetups</p>
              <h2 className="text-2xl md:text-3xl font-bold text-[#EDEDEF] tracking-tight flex items-center gap-2">
                <Calendar className="w-6 h-6 text-[#5E6AD2]" />
                Upcoming Events
              </h2>
            </div>
            <Link
              href="/events"
              className="flex items-center gap-1.5 text-sm font-medium text-[#8A8F98] hover:text-[#5E6AD2] transition-colors duration-200"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {(enrichedEvents as CarEvent[]).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* ── Empty state ───────────────────────────────────────── */}
      {!hasContent && (
        <div className="flex flex-col items-center text-center py-28">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: 'rgba(94,106,210,0.10)', border: '1px solid rgba(94,106,210,0.20)' }}
          >
            <Car className="w-9 h-9 text-[#5E6AD2]" />
          </div>
          <h3 className="text-xl font-bold text-[#EDEDEF] mb-2">No spots yet — be the first!</h3>
          <p className="text-[#8A8F98] mb-8 max-w-xs">Log a car you spotted to kick off the Throttl community.</p>
          <Link href="/spots/new" className="btn-primary px-8 py-3">
            <Car className="w-4 h-4" />
            Log First Spot
          </Link>
        </div>
      )}
    </div>
  )
}
