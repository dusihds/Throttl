import Link from 'next/link'
import { PlusCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import EventsClient from '@/components/EventsClient'
import type { CarEvent } from '@/lib/types'

export const revalidate = 60

export default async function EventsPage() {
  const supabase = await createClient()

  const now = new Date().toISOString()
  const { data: events } = await supabase
    .from('car_events')
    .select('*, profiles!user_id(id, username, avatar_url, is_developer), event_attendees(count)')
    .or(`start_time.gte.${now},is_recurring.eq.true`)
    .order('start_time', { ascending: true })
    .limit(100)

  const { data: { user } } = await supabase.auth.getUser()
  const currentUserId = user?.id ?? null

  const enriched = (events ?? []).map((e: any) => ({
    ...e,
    attendee_count: e.event_attendees?.[0]?.count ?? 0,
  })) as CarEvent[]

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-[11px] font-mono text-[#5E6AD2] uppercase tracking-widest mb-2">Community meetups</p>
          <h1 className="text-3xl font-bold text-[#EDEDEF] tracking-tight">Car Events</h1>
        </div>
        <Link href="/events/new" className="btn-primary text-sm py-2.5 px-5">
          <PlusCircle className="w-4 h-4" />
          Create Event
        </Link>
      </div>

      <EventsClient events={enriched} currentUserId={currentUserId} />
    </div>
  )
}
