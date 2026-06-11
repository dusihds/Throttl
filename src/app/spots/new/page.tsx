'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Car, MapPin, DollarSign, Camera, X, ArrowLeft, Loader2, Lock } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { geocode } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

const COLORS = ['Black', 'White', 'Silver', 'Grey', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Brown', 'Purple', 'Gold', 'Other']

export default function NewSpotPage() {
  const router   = useRouter()
  const supabase = createClient()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    make: '', model: '', year: '', color: '',
    location_name: '', estimated_worth: '', notes: '',
    spotted_at: new Date().toISOString().slice(0, 16),
  })
  const [photoFile, setPhotoFile]     = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [authChecked, setAuthChecked] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data.user)
      setAuthChecked(true)
    })
  }, [])

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })) }

  function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    // Geocode for potential future distance features
    const coords = await geocode(form.location_name)

    let photo_url: string | null = null
    if (photoFile) {
      const ext  = photoFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('photos').upload(path, photoFile)
      if (uploadErr) { setError('Photo upload failed: ' + uploadErr.message); setLoading(false); return }
      photo_url = supabase.storage.from('photos').getPublicUrl(path).data.publicUrl
    }

    const { error: insertErr } = await supabase.from('car_spots').insert({
      user_id:         user.id,
      make:            form.make.trim(),
      model:           form.model.trim(),
      year:            form.year ? parseInt(form.year) : null,
      color:           form.color || null,
      location_name:   form.location_name.trim(),
      lat:             coords?.lat ?? null,
      lng:             coords?.lng ?? null,
      estimated_worth: form.estimated_worth ? parseFloat(form.estimated_worth) : null,
      notes:           form.notes.trim() || null,
      spotted_at:      new Date(form.spotted_at).toISOString(),
      photo_url,
    })

    if (insertErr) { setError(insertErr.message); setLoading(false); return }
    router.push('/spots')
  }

  if (!authChecked) return null

  if (!currentUser) return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}
        >
          <Lock className="w-8 h-8 text-[#F97316]" />
        </div>
        <h2 className="text-2xl font-bold text-[#F5F0EB] tracking-tight mb-2">Sign in to log spots</h2>
        <p className="text-sm mb-8" style={{ color: '#8C8680' }}>To add spots you need to sign in first.</p>
        <Link href="/auth" className="btn-primary px-8 py-3">
          <Car className="w-4 h-4" />
          Sign In
        </Link>
      </div>
    </div>
  )

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Link href="/spots" className="inline-flex items-center gap-2 text-sm mb-8 transition-colors duration-200" style={{ color: '#8C8680' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#F5F0EB')}
        onMouseLeave={e => (e.currentTarget.style.color = '#8C8680')}
      >
        <ArrowLeft className="w-4 h-4" /> Back to Spots
      </Link>

      <p className="text-[11px] font-mono text-[#F97316] uppercase tracking-widest mb-2">New entry</p>
      <h1 className="text-3xl font-bold text-[#F5F0EB] tracking-tight mb-1">Log a Spot</h1>
      <p className="text-sm mb-8" style={{ color: '#8C8680' }}>Record a car you spotted in the wild.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Photo upload */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#8C8680' }}>Photo</label>
          {photoPreview ? (
            <div className="relative aspect-video rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
              <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                className="absolute top-3 right-3 p-1.5 rounded-full" style={{ background: 'rgba(5,5,6,0.80)', color: '#F5F0EB' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full aspect-video rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-200 group"
              style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.08)' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.35)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            >
              <Camera className="w-7 h-7 text-[#8C8680] group-hover:text-[#F97316] transition-colors" />
              <span className="text-sm text-[#8C8680] group-hover:text-[#F97316] transition-colors">Tap to add a photo</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#8C8680' }}>Make *</label>
            <input value={form.make} onChange={e => set('make', e.target.value)} required placeholder="Ferrari" className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#8C8680' }}>Model *</label>
            <input value={form.model} onChange={e => set('model', e.target.value)} required placeholder="F40" className="input" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#8C8680' }}>Year</label>
            <input type="number" value={form.year} onChange={e => set('year', e.target.value)}
              placeholder="1990" min={1886} max={new Date().getFullYear() + 1} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#8C8680' }}>Colour</label>
            <select value={form.color} onChange={e => set('color', e.target.value)} className="input">
              <option value="">— select —</option>
              {COLORS.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#8C8680' }}>
            <span className="inline-flex items-center gap-1.5"><MapPin className="w-3 h-3 text-[#F97316]" /> Location *</span>
          </label>
          <input value={form.location_name} onChange={e => set('location_name', e.target.value)} required
            placeholder="Rodeo Drive, Beverly Hills" className="input" />
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#8C8680' }}>
            <span className="inline-flex items-center gap-1.5"><DollarSign className="w-3 h-3 text-[#F97316]" /> Estimated Worth ($)</span>
          </label>
          <input type="number" value={form.estimated_worth} onChange={e => set('estimated_worth', e.target.value)}
            placeholder="1500000" min={0} className="input" />
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#8C8680' }}>Spotted At</label>
          <input type="datetime-local" value={form.spotted_at} onChange={e => set('spotted_at', e.target.value)} className="input" />
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#8C8680' }}>Notes / Condition / Mods</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
            placeholder="Lowered, wrapped, loud exhaust…" className="input resize-none" />
        </div>

        {error && (
          <p className="text-xs px-3 py-2.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base mt-1">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Car className="w-5 h-5" />}
          {loading ? 'Saving…' : 'Log This Spot'}
        </button>
      </form>
    </div>
  )
}
