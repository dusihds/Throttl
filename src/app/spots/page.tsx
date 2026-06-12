import Link from 'next/link'
import { PlusCircle, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import SpotCard from '@/components/SpotCard'
import type { CarSpot } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Car Spots — Throttl',
  description: 'Browse the latest car sightings logged by the Throttl community.',
}

export const revalidate = 60

export default async function SpotsPage() {
  const supabase = await createClient()
  const { data: spots } = await supabase
    .from('car_spots')
    .select('*, profiles(id, username, avatar_url)')
    .order('spotted_at', { ascending: false })
    .limit(50)

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-[11px] font-mono text-[#F97316] uppercase tracking-widest mb-2">Community sightings</p>
          <h1 className="text-3xl font-bold text-[#F5F0EB] tracking-tight">Car Spots</h1>
        </div>
        <Link href="/spots/new" className="btn-primary text-sm py-2.5 px-5">
          <PlusCircle className="w-4 h-4" />
          Log Spot
        </Link>
      </div>

      {spots && spots.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(spots as CarSpot[]).map((spot) => (
            <SpotCard key={spot.id} spot={spot} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center text-center py-24">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)' }}
          >
            <Search className="w-7 h-7 text-[#F97316]" />
          </div>
          <p className="text-lg font-semibold text-[#F5F0EB] mb-2">No spots logged yet</p>
          <p className="text-sm mb-8" style={{ color: '#8C8680' }}>Spotted something cool? Be the first to log it!</p>
          <Link href="/spots/new" className="btn-primary px-7 py-3">
            <PlusCircle className="w-4 h-4" />
            Log First Spot
          </Link>
        </div>
      )}
    </div>
  )
}
