import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MapPin, DollarSign, Calendar, FileText, Palette } from 'lucide-react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import type { CarSpot } from '@/lib/types'
import DeleteSpotButton from './DeleteSpotButton'

export const revalidate = 3600

export default async function SpotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: spot } = await supabase
    .from('car_spots')
    .select('*, profiles(id, username, avatar_url)')
    .eq('id', id)
    .single()

  if (!spot) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === (spot as CarSpot).user_id
  const s = spot as CarSpot

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/spots" className="inline-flex items-center gap-2 text-sm mb-8 transition-colors duration-200 text-[#8C8680] hover:text-[#F5F0EB]">
        <ArrowLeft className="w-4 h-4" /> Back to Spots
      </Link>

      {/* Photo */}
      <div className="aspect-video rounded-2xl overflow-hidden relative mb-6" style={{ background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.06)' }}>
        {s.photo_url ? (
          <Image src={s.photo_url} alt={`${s.make} ${s.model}`} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-10 select-none">🚗</div>
        )}
        {s.year && (
          <span
            className="absolute top-4 right-4 text-xs font-mono px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(5,5,6,0.80)', color: '#8C8680', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {s.year}
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#F5F0EB] tracking-tight">{s.make} {s.model}</h1>
          {s.profiles && <p className="text-sm font-mono mt-1" style={{ color: '#8C8680' }}>by @{s.profiles.username}</p>}
        </div>
        {isOwner && <DeleteSpotButton id={s.id} />}
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <DetailCard icon={<MapPin className="w-4 h-4 text-[#F97316]" />} label="Location" value={s.location_name} />
        <DetailCard icon={<Calendar className="w-4 h-4 text-[#F97316]" />} label="Spotted" value={format(new Date(s.spotted_at), 'EEE, MMM d yyyy · h:mm a')} />
        {s.color && <DetailCard icon={<Palette className="w-4 h-4 text-[#F97316]" />} label="Colour" value={s.color.charAt(0).toUpperCase() + s.color.slice(1)} />}
        {s.estimated_worth && <DetailCard icon={<DollarSign className="w-4 h-4 text-[#F97316]" />} label="Estimated Worth" value={`~$${s.estimated_worth.toLocaleString()}`} highlight />}
      </div>

      {s.notes && (
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest mb-3" style={{ color: '#8C8680' }}>
            <FileText className="w-3.5 h-3.5 text-[#F97316]" />
            Notes
          </div>
          <p className="text-sm text-[#F5F0EB] leading-relaxed">{s.notes}</p>
        </div>
      )}
    </div>
  )
}

function DetailCard({ icon, label, value, highlight = false }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: '#8C8680' }}>
        {icon}
        {label}
      </div>
      <p className={`text-sm font-semibold ${highlight ? 'text-[#FB923C]' : 'text-[#F5F0EB]'}`}>{value}</p>
    </div>
  )
}
