'use client'

import { useState, useRef } from 'react'
import { Camera, Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  avatarUrl: string | null
  bio: string | null
  username: string
}

export default function ProfileEditor({ userId, avatarUrl: initAvatar, bio: initBio, username }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [avatar, setAvatar]         = useState(initAvatar)
  const [bio, setBio]               = useState(initBio ?? '')
  const [uploading, setUploading]   = useState(false)
  const [savingBio, setSavingBio]   = useState(false)
  const [saved, setSaved]           = useState(false)

  async function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext  = file.name.split('.').pop() ?? 'jpg'
    const path = `${userId}/avatar.${ext}`
    await supabase.storage.from('photos').upload(path, file, { upsert: true })
    const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path)
    const busted = `${publicUrl}?t=${Date.now()}`
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId)
    setAvatar(busted)
    setUploading(false)
    router.refresh()
  }

  async function saveBio() {
    setSavingBio(true)
    await supabase.from('profiles').update({ bio: bio.trim() || null }).eq('id', userId)
    setSavingBio(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  const bioChanged = bio.trim() !== (initBio ?? '').trim()

  return (
    <div className="flex items-start gap-4">
      {/* Avatar upload */}
      <div
        className="relative group cursor-pointer shrink-0"
        onClick={() => fileRef.current?.click()}
        style={{ width: 72, height: 72 }}
      >
        <div
          className="w-full h-full rounded-2xl overflow-hidden flex items-center justify-center text-2xl font-black"
          style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)', color: '#FB923C', position: 'relative' }}
        >
          {avatar ? (
            <Image src={avatar} alt={username} fill sizes="72px" className="object-cover" unoptimized={avatar.includes('?t=')} />
          ) : (
            username[0]?.toUpperCase()
          )}
        </div>
        <div
          className="absolute inset-0 rounded-2xl flex items-center justify-center transition-opacity duration-200 opacity-0 group-hover:opacity-100"
          style={{ background: 'rgba(0,0,0,0.55)' }}
        >
          {uploading
            ? <Loader2 className="w-5 h-5 text-white animate-spin" />
            : <Camera className="w-5 h-5 text-white" />
          }
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
      </div>

      {/* Bio */}
      <div className="flex-1 flex flex-col gap-2">
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          placeholder="Write a short bio…"
          maxLength={160}
          rows={2}
          className="input resize-none text-sm"
          style={{ padding: '8px 12px' }}
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono" style={{ color: '#8C8680' }}>{bio.length}/160</span>
          <button
            onClick={saveBio}
            disabled={savingBio || !bioChanged}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: saved ? 'rgba(34,197,94,0.12)' : 'rgba(249,115,22,0.12)',
              color:      saved ? '#4ade80' : '#FB923C',
              border:     `1px solid ${saved ? 'rgba(34,197,94,0.25)' : 'rgba(249,115,22,0.25)'}`,
              opacity:    !bioChanged && !saved ? 0.45 : 1,
              cursor:     !bioChanged ? 'default' : 'pointer',
            }}
          >
            {savingBio ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            {saved ? 'Saved!' : 'Save bio'}
          </button>
        </div>
      </div>
    </div>
  )
}
