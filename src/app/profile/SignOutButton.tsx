'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <button
      onClick={signOut}
      className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl transition-all duration-200"
      style={{ background: 'rgba(255,255,255,0.04)', color: '#8A8F98', border: '1px solid rgba(255,255,255,0.07)' }}
      onMouseEnter={e => {
        e.currentTarget.style.color = '#EDEDEF'
        e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = '#8A8F98'
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
      }}
    >
      <LogOut className="w-4 h-4" />
      Sign Out
    </button>
  )
}
