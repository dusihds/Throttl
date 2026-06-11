'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MapPin, DollarSign, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { useRef, useState } from 'react'
import type { CarSpot } from '@/lib/types'

interface Props { spot: CarSpot }

export default function SpotCard({ spot }: Props) {
  const ref = useRef<HTMLAnchorElement>(null)
  const [pos, setPos]       = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)

  function onMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top })
  }

  return (
    <Link
      ref={ref}
      href={`/spots/${spot.id}`}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="card block relative overflow-hidden group"
    >
      {/* Spotlight */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl z-10 transition-opacity duration-300"
        style={{
          opacity: hovered ? 1 : 0,
          background: `radial-gradient(280px circle at ${pos.x}px ${pos.y}px, rgba(249,115,22,0.12), transparent 70%)`,
        }}
      />

      {/* Photo */}
      <div className="aspect-video relative overflow-hidden rounded-t-2xl bg-[#0a0a0c]">
        {spot.photo_url ? (
          <Image src={spot.photo_url} alt={`${spot.make} ${spot.model}`} fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl opacity-20 select-none">🚗</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        <div className="absolute top-3 left-3 right-3 flex justify-between">
          {spot.color && (
            <span
              className="text-[10px] font-medium px-2.5 py-1 rounded-full capitalize tracking-wide"
              style={{ background: 'rgba(5,5,6,0.75)', color: '#F5F0EB', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {spot.color}
            </span>
          )}
          {spot.year && (
            <span
              className="text-[10px] font-mono font-medium px-2.5 py-1 rounded-full ml-auto"
              style={{ background: 'rgba(5,5,6,0.75)', color: '#8C8680', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {spot.year}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-[#F5F0EB] text-base leading-tight tracking-tight">
          {spot.make} {spot.model}
        </h3>

        {spot.profiles && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-[11px] text-[#8C8680] font-mono">@{spot.profiles.username}</p>
            {spot.profiles.is_developer && <DevBadge />}
          </div>
        )}

        <div className="mt-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-[#8C8680] text-xs">
            <MapPin className="w-3 h-3 text-[#F97316] shrink-0" />
            <span className="truncate">{spot.location_name}</span>
          </div>
          {spot.estimated_worth && (
            <div className="flex items-center gap-2 text-[#8C8680] text-xs">
              <DollarSign className="w-3 h-3 text-[#F97316] shrink-0" />
              <span className="text-[#F5F0EB] font-medium">~${spot.estimated_worth.toLocaleString()}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-[#8C8680] text-xs">
            <Calendar className="w-3 h-3 text-[#F97316] shrink-0" />
            <span>{format(new Date(spot.spotted_at), 'MMM d, yyyy')}</span>
          </div>
        </div>
      </div>
    </Link>
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
