'use client'

import { useState } from 'react'
import { ShieldCheck, ShieldOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function VerifyEventButton({ id, isVerified }: { id: string; isVerified: boolean }) {
  const [verified, setVerified] = useState(isVerified)
  const [loading, setLoading]   = useState(false)
  const supabase = createClient()

  async function toggle() {
    setLoading(true)
    const next = !verified
    const { error } = await supabase
      .from('car_events')
      .update({ is_verified: next })
      .eq('id', id)
    if (!error) setVerified(next)
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all duration-150"
      style={{
        background: verified ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
        color:      verified ? '#4ade80' : '#8A8F98',
        border:     verified ? '1px solid rgba(34,197,94,0.30)' : '1px solid rgba(255,255,255,0.08)',
      }}
      title="Developer: toggle verified status"
    >
      {loading
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : verified
          ? <ShieldCheck className="w-3.5 h-3.5" />
          : <ShieldOff className="w-3.5 h-3.5" />
      }
      {verified ? 'Verified' : 'Verify'}
    </button>
  )
}
