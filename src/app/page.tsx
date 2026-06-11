import Link from 'next/link'
import { Car, Calendar, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import SpotCard from '@/components/SpotCard'
import EventCard from '@/components/EventCard'
import ScrollHero from '@/components/ScrollHero'
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

      <ScrollHero
        spotCount={spots?.length ?? 0}
        eventCount={enrichedEvents.length}
        hasContent={hasContent}
      />

      {/* ── Section divider ──────────────────────────────────── */}
      <div className="glow-divider w-full" />

      {/* ── Recent Spots ─────────────────────────────────────── */}
      {spots && spots.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="ping-orange absolute inline-flex h-full w-full rounded-full bg-[#F97316] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F97316]" />
                </span>
                <p className="text-[11px] font-mono text-[#F97316] uppercase tracking-widest">Community</p>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#F5F0EB] tracking-tight flex items-center gap-2">
                <Car className="w-6 h-6 text-[#F97316]" />
                Recent Spots
              </h2>
            </div>
            <Link
              href="/spots"
              className="flex items-center gap-1.5 text-sm font-medium text-[#8C8680] hover:text-[#F97316] transition-colors duration-200"
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
        <div className="glow-divider w-full" />
      )}

      {/* ── Upcoming Events ───────────────────────────────────── */}
      {enrichedEvents.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="ping-orange absolute inline-flex h-full w-full rounded-full bg-[#F97316] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F97316]" />
                </span>
                <p className="text-[11px] font-mono text-[#F97316] uppercase tracking-widest">Meetups</p>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#F5F0EB] tracking-tight flex items-center gap-2">
                <Calendar className="w-6 h-6 text-[#F97316]" />
                Upcoming Events
              </h2>
            </div>
            <Link
              href="/events"
              className="flex items-center gap-1.5 text-sm font-medium text-[#8C8680] hover:text-[#F97316] transition-colors duration-200"
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
            style={{ background: 'rgba(249,115,22,0.10)', border: '1px solid rgba(249,115,22,0.20)' }}
          >
            <Car className="w-9 h-9 text-[#F97316]" />
          </div>
          <h3 className="text-xl font-bold text-[#F5F0EB] mb-2">No spots yet — be the first!</h3>
          <p className="text-[#8C8680] mb-8 max-w-xs">Log a car you spotted to kick off the Throttl community.</p>
          <Link href="/spots/new" className="btn-primary px-8 py-3">
            <Car className="w-4 h-4" />
            Log First Spot
          </Link>
        </div>
      )}
    </div>
  )
}
