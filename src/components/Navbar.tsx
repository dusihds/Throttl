'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Car, Calendar, Home, User, PlusCircle, Menu, X, MessageCircle, Newspaper, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const NAV = [
  { href: '/',        label: 'Home',    icon: Home,          bottomNav: true },
  { href: '/spots',   label: 'Spots',   icon: Car,           bottomNav: true },
  { href: '/events',  label: 'Events',  icon: Calendar,      bottomNav: true },
  { href: '/feed',    label: 'Feed',    icon: MessageCircle, bottomNav: true },
  { href: '/news',    label: 'News',    icon: Newspaper,     bottomNav: false },
  { href: '/search',  label: 'Search',  icon: Search,        bottomNav: false },
  { href: '/profile', label: 'Profile', icon: User,          bottomNav: true },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => { setMenuOpen(false) }, [pathname])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <>
      {/* ── Desktop top nav ───────────────────────────────────── */}
      <header
        className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-14 items-center px-6 gap-8"
        style={{
          background: 'rgba(5,5,6,0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg mr-2 shrink-0">
          <span className="text-[#5E6AD2]">
            <Car className="w-5 h-5" />
          </span>
          <span className="text-[#EDEDEF] tracking-tight">Throttl</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1 flex-1">
          {NAV.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: active ? 'rgba(94,106,210,0.15)' : 'transparent',
                  color: active ? '#5E6AD2' : '#8A8F98',
                  border: active ? '1px solid rgba(94,106,210,0.25)' : '1px solid transparent',
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = '#EDEDEF'
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = '#8A8F98'
                }}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <>
              <Link href="/spots/new" className="btn-primary text-sm py-2 px-4">
                <PlusCircle className="w-4 h-4" />
                Log Spot
              </Link>
              <button
                onClick={signOut}
                className="text-sm text-[#8A8F98] hover:text-[#EDEDEF] transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.05]"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link href="/auth" className="btn-primary text-sm py-2 px-4">
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* ── Mobile header ────────────────────────────────────── */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4"
        style={{
          background: 'rgba(5,5,6,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Link href="/" className="flex items-center gap-2 font-bold text-base">
          <Car className="w-4 h-4 text-[#5E6AD2]" />
          <span className="text-[#EDEDEF]">Throttl</span>
        </Link>
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="p-2 rounded-lg text-[#8A8F98] hover:text-[#EDEDEF] hover:bg-white/[0.06] transition-all"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* ── Mobile dropdown menu ─────────────────────────────── */}
      {menuOpen && (
        <div
          className="md:hidden fixed top-14 left-0 right-0 z-40 p-4 flex flex-col gap-1"
          style={{
            background: 'rgba(5,5,6,0.96)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: active ? 'rgba(94,106,210,0.12)' : 'transparent',
                  color: active ? '#5E6AD2' : '#8A8F98',
                  border: active ? '1px solid rgba(94,106,210,0.2)' : '1px solid transparent',
                }}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
          <div className="mt-2 pt-3 border-t border-white/[0.06]">
            {user ? (
              <button
                onClick={signOut}
                className="w-full text-center text-sm text-[#8A8F98] hover:text-[#EDEDEF] py-2.5 transition-colors"
              >
                Sign out
              </button>
            ) : (
              <Link href="/auth" className="btn-primary w-full py-3 text-sm">
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Mobile bottom nav ────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex safe-area-inset-bottom"
        style={{
          background: 'rgba(5,5,6,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {NAV.filter(n => n.bottomNav).map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium tracking-wide transition-colors duration-200"
              style={{ color: active ? '#5E6AD2' : '#8A8F98' }}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
