'use client'

import { useState } from 'react'
import { MapPin, Navigation, AlertCircle, Loader2, X, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import EventCard from './EventCard'
import { haversineKm, formatKm } from '@/lib/utils'
import type { CarEvent } from '@/lib/types'

type GeoState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'

const DISTANCE_OPTIONS = [
  { label: 'Any distance', value: null },
  { label: 'Within 10 km',  value: 10 },
  { label: 'Within 25 km',  value: 25 },
  { label: 'Within 50 km',  value: 50 },
  { label: 'Within 100 km', value: 100 },
]

interface Props {
  events: CarEvent[]
  currentUserId?: string | null
}

export default function EventsClient({ events, currentUserId }: Props) {
  const [geoState, setGeoState] = useState<GeoState>('idle')
  const [userLat, setUserLat]   = useState<number | null>(null)
  const [userLng, setUserLng]   = useState<number | null>(null)
  const [maxKm, setMaxKm]       = useState<number | null>(null)
  const [showReason, setShowReason] = useState(false)

  function requestLocation() {
    if (!navigator.geolocation) {
      setGeoState('unavailable')
      return
    }
    setGeoState('requesting')
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLat(pos.coords.latitude)
        setUserLng(pos.coords.longitude)
        setGeoState('granted')
        setMaxKm(25) // sensible default once location is known
      },
      () => setGeoState('denied'),
      { timeout: 10_000, maximumAge: 60_000 }
    )
  }

  function clearLocation() {
    setGeoState('idle')
    setUserLat(null)
    setUserLng(null)
    setMaxKm(null)
    setShowReason(false)
  }

  // Attach distance to each event and filter
  const eventsWithDistance = events.map(e => ({
    ...e,
    distance: (userLat !== null && userLng !== null && e.lat !== null && e.lng !== null)
      ? haversineKm(userLat, userLng, Number(e.lat), Number(e.lng))
      : undefined,
  }))

  const filtered = (geoState === 'granted' && maxKm !== null)
    ? eventsWithDistance.filter(e => e.distance !== undefined && e.distance <= maxKm)
    : eventsWithDistance

  const sorted = geoState === 'granted'
    ? [...filtered].sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
    : filtered

  return (
    <div>
      {/* ── Filter Bar ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-8">

        {geoState === 'idle' && (
          <button
            onClick={() => setShowReason(true)}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl transition-all duration-200"
            style={{
              background: 'rgba(94,106,210,0.10)',
              color: '#818cf8',
              border: '1px solid rgba(94,106,210,0.22)',
            }}
          >
            <Navigation className="w-4 h-4" />
            Filter by distance
          </button>
        )}

        {geoState === 'requesting' && (
          <div className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl" style={{ color: '#8A8F98', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
            <Loader2 className="w-4 h-4 animate-spin text-[#5E6AD2]" />
            Locating you…
          </div>
        )}

        {geoState === 'granted' && (
          <>
            <div className="flex items-center gap-2 text-xs px-3.5 py-2 rounded-full font-mono" style={{ background: 'rgba(94,106,210,0.12)', color: '#818cf8', border: '1px solid rgba(94,106,210,0.22)' }}>
              <MapPin className="w-3 h-3" />
              Location active
            </div>

            {/* Distance selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {DISTANCE_OPTIONS.map(opt => (
                <button
                  key={String(opt.value)}
                  onClick={() => setMaxKm(opt.value)}
                  className="text-xs px-3.5 py-2 rounded-full font-medium transition-all duration-200"
                  style={{
                    background: maxKm === opt.value ? 'rgba(94,106,210,0.20)' : 'rgba(255,255,255,0.04)',
                    color: maxKm === opt.value ? '#818cf8' : '#8A8F98',
                    border: maxKm === opt.value ? '1px solid rgba(94,106,210,0.30)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              onClick={clearLocation}
              className="ml-auto flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-all duration-200"
              style={{ color: '#8A8F98', border: '1px solid rgba(255,255,255,0.07)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#EDEDEF')}
              onMouseLeave={e => (e.currentTarget.style.color = '#8A8F98')}
            >
              <X className="w-3 h-3" /> Clear
            </button>
          </>
        )}

        {(geoState === 'denied' || geoState === 'unavailable') && (
          <div className="flex items-center gap-2 text-xs px-3.5 py-2.5 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {geoState === 'denied'
              ? 'Location access was denied. Enable it in your browser settings.'
              : 'Geolocation is not supported by your browser.'}
            <button onClick={clearLocation} className="ml-1 underline underline-offset-2 hover:text-red-300 transition-colors">Dismiss</button>
          </div>
        )}
      </div>

      {/* ── Reason modal / callout ────────────────────────── */}
      {showReason && (
        <div
          className="rounded-2xl p-5 mb-6 flex flex-col gap-4"
          style={{ background: 'rgba(94,106,210,0.07)', border: '1px solid rgba(94,106,210,0.20)' }}
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(94,106,210,0.15)', border: '1px solid rgba(94,106,210,0.25)' }}>
              <Navigation className="w-4 h-4 text-[#5E6AD2]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#EDEDEF] mb-1">Why we need your location</p>
              <p className="text-sm leading-relaxed" style={{ color: '#8A8F98' }}>
                Throttl uses your device location <strong className="text-[#EDEDEF]">only in your browser</strong> to
                calculate how far each car event is from you and sort them by distance.{' '}
                <strong className="text-[#EDEDEF]">Your coordinates are never sent to or stored on our servers.</strong>{' '}
                You can clear your location at any time.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={requestLocation} className="btn-primary text-sm py-2.5 px-5">
              <Navigation className="w-4 h-4" />
              Allow location access
            </button>
            <button
              onClick={() => setShowReason(false)}
              className="btn-secondary text-sm py-2.5 px-5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Results count ─────────────────────────────────── */}
      {geoState === 'granted' && maxKm !== null && (
        <p className="text-xs font-mono mb-5" style={{ color: '#8A8F98' }}>
          {sorted.length} event{sorted.length !== 1 ? 's' : ''} within {maxKm} km of your location
        </p>
      )}

      {/* ── Event grid ───────────────────────────────────── */}
      {sorted.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map((event, i) => (
            <EventCard key={event.id} event={event} distance={event.distance} index={i} isOwner={!!currentUserId && event.user_id === currentUserId} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center text-center py-16">
          <MapPin className="w-10 h-10 mb-4" style={{ color: 'rgba(94,106,210,0.4)' }} />
          <p className="text-base font-semibold text-[#EDEDEF] mb-2">No events within {maxKm} km</p>
          <p className="text-sm mb-6" style={{ color: '#8A8F98' }}>Try a larger radius or{' '}
            <button onClick={() => setMaxKm(null)} className="text-[#5E6AD2] hover:text-[#818cf8] transition-colors underline underline-offset-2">
              show all events
            </button>.
          </p>
          <Link href="/events/new" className="btn-primary text-sm px-6 py-2.5">
            <PlusCircle className="w-4 h-4" />
            Create Event
          </Link>
        </div>
      )}
    </div>
  )
}
