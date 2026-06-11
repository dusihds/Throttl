'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function DeleteSpotButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete() {
    setLoading(true)
    await supabase.from('car_spots').delete().eq('id', id)
    router.push('/spots')
  }

  if (confirming) {
    return (
      <div className="flex gap-2 shrink-0">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-50"
          style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
        >
          {loading ? 'Deleting…' : 'Confirm'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#8C8680', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 shrink-0"
      style={{ background: 'rgba(255,255,255,0.04)', color: '#8C8680', border: '1px solid rgba(255,255,255,0.07)' }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(239,68,68,0.10)'
        e.currentTarget.style.color = '#f87171'
        e.currentTarget.style.borderColor = 'rgba(239,68,68,0.20)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
        e.currentTarget.style.color = '#8C8680'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
      }}
    >
      <Trash2 className="w-4 h-4" />
      Delete
    </button>
  )
}
