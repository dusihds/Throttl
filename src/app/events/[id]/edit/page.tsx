'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Calendar, MapPin, Camera, X, ArrowLeft, RefreshCw, Loader2, Lock, Mail, Users, Star, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { geocode } from '@/lib/utils'

const DAYS = [
  { label: 'Sun', value: 'SU' }, { label: 'Mon', value: 'MO' },
  { label: 'Tue', value: 'TU' }, { label: 'Wed', value: 'WE' },
  { label: 'Thu', value: 'TH' }, { label: 'Fri', value: 'FR' },
  { label: 'Sat', value: 'SA' },
]

function buildRRule(freq: string, days: string[]): string {
  if (freq === 'WEEKLY') {
    const byday = days.length > 0 ? `;BYDAY=${days.join(',')}` : ''
    return `FREQ=WEEKLY${byday}`
  }
  return `FREQ=${freq}`
}

function parseRRule(rule: string | null): { freq: 'WEEKLY' | 'DAILY' | 'MONTHLY'; days: string[] } {
  if (!rule) return { freq: 'WEEKLY', days: [] }
  const freq = rule.includes('FREQ=DAILY') ? 'DAILY' : rule.includes('FREQ=MONTHLY') ? 'MONTHLY' : 'WEEKLY'
  const m = rule.match(/BYDAY=([A-Z,]+)/)
  return { freq, days: m ? m[1].split(',') : [] }
}

export default function EditEventPage() {
  const { id } = useParams() as { id: string }
  const router   = useRouter()
  const supabase = createClient()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [ready, setReady]               = useState(false)
  const [isOrganizer, setIsOrganizer]   = useState(false)
  const [existingCover, setExistingCover] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '', description: '', location_name: '',
    start_time: '', end_time: '', organizer_contact: '',
    max_capacity: '', min_rating_required: '',
  })
  const [requiresPayment, setRequiresPayment]       = useState(false)
  const [isRecurring, setIsRecurring]               = useState(false)
  const [recurringStartTime, setRecurringStartTime] = useState('10:00')
  const [recurringEndTime, setRecurringEndTime]     = useState('')
  const [freq, setFreq]                 = useState<'WEEKLY' | 'DAILY' | 'MONTHLY'>('WEEKLY')
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [coverFile, setCoverFile]       = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [dragging, setDragging]         = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setReady(true); return }

      const { data: event } = await supabase
        .from('car_events')
        .select('*')
        .eq('id', id)
        .single()

      if (!event || event.user_id !== user.id) { setReady(true); return }

      setIsOrganizer(true)
      setExistingCover(event.cover_image_url ?? null)

      const toLocal = (iso: string | null) =>
        iso ? new Date(iso).toISOString().slice(0, 16) : ''

      setForm({
        title:               event.title ?? '',
        description:         event.description ?? '',
        location_name:       event.location_name ?? '',
        start_time:          toLocal(event.start_time),
        end_time:            toLocal(event.end_time),
        organizer_contact:   event.organizer_contact ?? '',
        max_capacity:        event.max_capacity != null ? String(event.max_capacity) : '',
        min_rating_required: event.min_rating_required != null ? String(event.min_rating_required) : '',
      })
      setRequiresPayment(event.requires_payment ?? false)
      const recurring = event.is_recurring ?? false
      setIsRecurring(recurring)
      if (recurring && event.start_time) {
        const t = new Date(event.start_time)
        setRecurringStartTime(`${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`)
      }
      if (recurring && event.end_time) {
        const t = new Date(event.end_time)
        setRecurringEndTime(`${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`)
      }
      const { freq: f, days } = parseRRule(event.recurrence_rule)
      setFreq(f)
      setSelectedDays(days)
      setReady(true)
    }
    load()
  }, [id])

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })) }
  function toggleDay(day: string) {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
  }
  function applyFile(file: File) {
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }
  function pickCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) applyFile(file)
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) applyFile(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (isRecurring && freq === 'WEEKLY' && selectedDays.length === 0) {
      setError('Pick at least one day for a weekly recurring event.')
      return
    }

    const maxCap = form.max_capacity ? parseInt(form.max_capacity, 10) : null
    if (maxCap !== null && (isNaN(maxCap) || maxCap < 1)) {
      setError('Max capacity must be a positive number.')
      return
    }

    const minRating = form.min_rating_required ? parseFloat(form.min_rating_required) : null
    if (minRating !== null && (isNaN(minRating) || minRating < 1 || minRating > 5)) {
      setError('Minimum rating must be between 1.0 and 5.0.')
      return
    }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    const coords = await geocode(form.location_name)

    let cover_image_url: string | null = existingCover
    if (coverFile) {
      const ext  = coverFile.name.split('.').pop()
      const path = `${user.id}/events/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('photos').upload(path, coverFile)
      if (uploadErr) { setError('Image upload failed: ' + uploadErr.message); setLoading(false); return }
      cover_image_url = supabase.storage.from('photos').getPublicUrl(path).data.publicUrl
    }

    const baseDate = new Date().toISOString().slice(0, 10)
    const startISO = isRecurring
      ? new Date(`${baseDate}T${recurringStartTime}`).toISOString()
      : new Date(form.start_time).toISOString()
    const endISO = isRecurring
      ? (recurringEndTime ? new Date(`${baseDate}T${recurringEndTime}`).toISOString() : null)
      : (form.end_time ? new Date(form.end_time).toISOString() : null)

    const { error: updateErr } = await supabase.from('car_events').update({
      title:               form.title.trim(),
      description:         form.description.trim() || null,
      location_name:       form.location_name.trim(),
      lat:                 coords?.lat ?? null,
      lng:                 coords?.lng ?? null,
      start_time:          startISO,
      end_time:            endISO,
      is_recurring:        isRecurring,
      recurrence_rule:     isRecurring ? buildRRule(freq, selectedDays) : null,
      cover_image_url,
      organizer_contact:   form.organizer_contact.trim() || null,
      max_capacity:        maxCap,
      min_rating_required: minRating,
      requires_payment:    requiresPayment,
    }).eq('id', id)

    if (updateErr) { setError(updateErr.message); setLoading(false); return }
    router.push(`/events/${id}`)
  }

  if (!ready) return null

  if (!isOrganizer) return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(94,106,210,0.12)', border: '1px solid rgba(94,106,210,0.25)' }}
        >
          <Lock className="w-8 h-8 text-[#5E6AD2]" />
        </div>
        <h2 className="text-2xl font-bold text-[#EDEDEF] tracking-tight mb-2">Not your event</h2>
        <p className="text-sm mb-8" style={{ color: '#8A8F98' }}>Only the organiser can edit this event.</p>
        <Link href={`/events/${id}`} className="btn-primary px-8 py-3">
          <ArrowLeft className="w-4 h-4" />
          Back to Event
        </Link>
      </div>
    </div>
  )

  const coverDisplay = coverPreview ?? existingCover

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Link href={`/events/${id}`} className="inline-flex items-center gap-2 text-sm mb-8 transition-colors duration-200" style={{ color: '#8A8F98' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#EDEDEF')}
        onMouseLeave={e => (e.currentTarget.style.color = '#8A8F98')}
      >
        <ArrowLeft className="w-4 h-4" /> Back to Event
      </Link>

      <p className="text-[11px] font-mono text-[#5E6AD2] uppercase tracking-widest mb-2">Edit event</p>
      <h1 className="text-3xl font-bold text-[#EDEDEF] tracking-tight mb-1">Edit Event</h1>
      <p className="text-sm mb-8" style={{ color: '#8A8F98' }}>Update the details for your event.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Cover image */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#8A8F98' }}>Cover Image</label>
          {coverDisplay ? (
            <div className="relative aspect-video rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <img src={coverDisplay} alt="preview" className="w-full h-full object-cover" />
              <button type="button" onClick={() => { setCoverFile(null); setCoverPreview(null); setExistingCover(null) }}
                className="absolute top-3 right-3 p-1.5 rounded-full" style={{ background: 'rgba(5,5,6,0.80)', color: '#EDEDEF' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragEnter={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className="w-full aspect-video rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-200"
              style={{
                background: dragging ? 'rgba(94,106,210,0.08)' : 'rgba(255,255,255,0.03)',
                border: `2px dashed ${dragging ? 'rgba(94,106,210,0.60)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <Camera className="w-7 h-7 transition-colors" style={{ color: dragging ? '#818cf8' : '#8A8F98' }} />
              <span className="text-sm transition-colors" style={{ color: dragging ? '#818cf8' : '#8A8F98' }}>
                {dragging ? 'Drop to upload' : 'Click or drag an image here'}
              </span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickCover} />
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#8A8F98' }}>Event Title *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} required placeholder="Sunday Morning Cruise" className="input" />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#8A8F98' }}>Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
            placeholder="All makes welcome. Meet at the car park…" className="input resize-none" />
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#8A8F98' }}>
            <span className="inline-flex items-center gap-1.5"><MapPin className="w-3 h-3 text-[#5E6AD2]" /> Location *</span>
          </label>
          <input value={form.location_name} onChange={e => set('location_name', e.target.value)} required
            placeholder="Sunset Strip Car Park, Los Angeles" className="input" />
        </div>

        {/* Start + End */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#8A8F98' }}>
              {isRecurring ? 'Start Time *' : 'Start *'}
            </label>
            {isRecurring ? (
              <input type="time" value={recurringStartTime} onChange={e => setRecurringStartTime(e.target.value)} required className="input text-sm" />
            ) : (
              <input type="datetime-local" value={form.start_time} onChange={e => set('start_time', e.target.value)} required className="input text-sm" />
            )}
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#8A8F98' }}>End (optional)</label>
            {isRecurring ? (
              <input type="time" value={recurringEndTime} onChange={e => setRecurringEndTime(e.target.value)} className="input text-sm" />
            ) : (
              <input type="datetime-local" value={form.end_time} onChange={e => set('end_time', e.target.value)} className="input text-sm" />
            )}
          </div>
        </div>

        {/* Recurring toggle */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(94,106,210,0.12)', border: '1px solid rgba(94,106,210,0.20)' }}>
                <RefreshCw className="w-4 h-4 text-[#5E6AD2]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#EDEDEF]">Recurring Event</p>
                <p className="text-xs" style={{ color: '#8A8F98' }}>Repeats on a schedule</p>
              </div>
            </div>
            <button type="button" onClick={() => setIsRecurring(r => !r)}
              className="w-12 h-6 rounded-full relative transition-colors duration-200 shrink-0"
              style={{ background: isRecurring ? '#5E6AD2' : 'rgba(255,255,255,0.10)' }}
            >
              <span className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
                style={{ left: isRecurring ? '28px' : '4px' }} />
            </button>
          </div>

          {isRecurring && (
            <div className="mt-5 pt-5 flex flex-col gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#8A8F98' }}>Frequency</label>
                <div className="flex gap-2">
                  {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map(f => (
                    <button key={f} type="button" onClick={() => setFreq(f)}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                      style={{
                        background: freq === f ? 'rgba(94,106,210,0.20)' : 'rgba(255,255,255,0.05)',
                        color: freq === f ? '#818cf8' : '#8A8F98',
                        border: freq === f ? '1px solid rgba(94,106,210,0.30)' : '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      {f.charAt(0) + f.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {freq === 'WEEKLY' && (
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#8A8F98' }}>Day(s) *</label>
                  <div className="flex gap-2 flex-wrap">
                    {DAYS.map(({ label, value }) => (
                      <button key={value} type="button" onClick={() => toggleDay(value)}
                        className="w-12 h-12 rounded-xl text-sm font-semibold transition-all duration-200"
                        style={{
                          background: selectedDays.includes(value) ? 'rgba(94,106,210,0.20)' : 'rgba(255,255,255,0.04)',
                          color: selectedDays.includes(value) ? '#818cf8' : '#8A8F98',
                          border: selectedDays.includes(value) ? '1px solid rgba(94,106,210,0.35)' : '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {selectedDays.length > 0 && (
                    <p className="text-[11px] font-mono text-[#5E6AD2] mt-2">
                      Every {selectedDays.map(d => DAYS.find(x => x.value === d)?.label).join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Organiser contact */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#8A8F98' }}>
            <span className="inline-flex items-center gap-1.5"><Mail className="w-3 h-3 text-[#5E6AD2]" /> Organiser Contact (optional)</span>
          </label>
          <input value={form.organizer_contact} onChange={e => set('organizer_contact', e.target.value)}
            placeholder="@throttl_username or email" className="input" />
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#8A8F98' }}>
            <span className="inline-flex items-center gap-1.5"><Users className="w-3 h-3 text-[#5E6AD2]" /> Max Cars (optional)</span>
          </label>
          <input
            type="number" min={1}
            value={form.max_capacity}
            onChange={e => set('max_capacity', e.target.value)}
            placeholder="Leave blank for unlimited"
            className="input"
          />
        </div>

        {/* Minimum rating */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#8A8F98' }}>
            <span className="inline-flex items-center gap-1.5"><Star className="w-3 h-3 text-[#5E6AD2]" /> Minimum Attendee Rating (optional)</span>
          </label>
          <input
            type="number" min={1} max={5} step={0.5}
            value={form.min_rating_required}
            onChange={e => set('min_rating_required', e.target.value)}
            placeholder="e.g. 3.5 — shown as a recommendation"
            className="input"
          />
        </div>

        {/* Paid RSVP toggle */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(234,179,8,0.10)', border: '1px solid rgba(234,179,8,0.20)' }}>
                <DollarSign className="w-4 h-4" style={{ color: '#fbbf24' }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#EDEDEF]">Charge $1 RSVP Fee</p>
                <p className="text-xs" style={{ color: '#8A8F98' }}>Require payment to reserve a spot</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRequiresPayment(p => !p)}
              className="w-12 h-6 rounded-full relative transition-colors duration-200 shrink-0"
              style={{ background: requiresPayment ? '#5E6AD2' : 'rgba(255,255,255,0.10)' }}
            >
              <span
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
                style={{ left: requiresPayment ? '28px' : '4px' }}
              />
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs px-3 py-2.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base mt-1">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calendar className="w-5 h-5" />}
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
