'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { Car, CheckCircle, AlertCircle, Loader2, AtSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { validateUsername, DEV_EMAIL, EARLY_ACCESS_EMAIL } from '@/lib/utils'

type Mode = 'signin' | 'signup'

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA'

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaReady, setCaptchaReady] = useState(false)
  const widgetRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Username availability state
  const [usernameError, setUsernameError]       = useState('')
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState(false)

  const router   = useRouter()
  const supabase = createClient()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const renderWidget = useCallback(() => {
    const ts = (window as any).turnstile
    if (!ts || !containerRef.current || widgetRef.current) return
    widgetRef.current = ts.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: 'dark',
      callback: (token: string) => setCaptchaToken(token),
      'expired-callback': () => setCaptchaToken(null),
      'error-callback': () => setCaptchaToken(null),
    })
  }, [])

  // Mount/reset widget when switching to signup
  useEffect(() => {
    if (mode !== 'signup' || !captchaReady) return
    const ts = (window as any).turnstile
    if (widgetRef.current && ts) {
      ts.reset(widgetRef.current)
      setCaptchaToken(null)
    } else {
      renderWidget()
    }
  }, [mode, captchaReady, renderWidget])

  const isDevEmail         = email.toLowerCase().trim() === DEV_EMAIL
  const isEarlyAccessEmail = email.toLowerCase().trim() === EARLY_ACCESS_EMAIL

  // Real-time username availability check (debounced)
  useEffect(() => {
    if (mode !== 'signup') return

    const localError = validateUsername(username, email, isDevEmail, isEarlyAccessEmail)
    if (username.length === 0) {
      setUsernameError('')
      setUsernameAvailable(false)
      return
    }
    if (localError) {
      setUsernameError(localError)
      setUsernameAvailable(false)
      return
    }

    setUsernameChecking(true)
    setUsernameAvailable(false)
    setUsernameError('')

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle()

      setUsernameChecking(false)
      if (data) {
        setUsernameError('Username is already taken')
        setUsernameAvailable(false)
      } else {
        setUsernameError('')
        setUsernameAvailable(true)
      }
    }, 450)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [username, email, mode, isDevEmail])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (mode === 'signup') {
      const localError = validateUsername(username, email, isDevEmail, isEarlyAccessEmail)
      if (localError) { setUsernameError(localError); return }
      if (usernameChecking) return
      if (usernameError)    return
    }

    if (mode === 'signup' && !captchaToken) {
      setError('Please complete the captcha.')
      return
    }

    setLoading(true)

    if (mode === 'signup') {
      const verifyRes = await fetch('/api/verify-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: captchaToken }),
      })
      const { success: captchaOk } = await verifyRes.json()
      if (!captchaOk) {
        setError('Captcha verification failed. Please try again.')
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Passed to raw_user_meta_data; the DB trigger reads this to set the profile username.
          data: { username: username.trim() },
        },
      })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Account created! Check your email to confirm before signing in.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message.toLowerCase().includes('not confirmed') || error.message.toLowerCase().includes('email')) {
          setError('Please verify your email before signing in. Check your inbox.')
        } else {
          setError(error.message)
        }
      } else {
        router.push('/')
      }
    }

    setLoading(false)
  }

  function switchMode(m: Mode) {
    setMode(m)
    setError('')
    setSuccess('')
    setUsernameError('')
    setUsernameAvailable(false)
  }

  return (
    <>
    <Script
      src="https://challenges.cloudflare.com/turnstile/v0/api.js"
      strategy="lazyOnload"
      onLoad={() => { setCaptchaReady(true); renderWidget() }}
    />
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
            style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}
          >
            <Car className="w-7 h-7 text-[#F97316]" />
          </div>
          <h1 className="text-2xl font-bold text-[#F5F0EB] tracking-tight">Throttl</h1>
          <p className="text-sm mt-1.5" style={{ color: '#8C8680' }}>
            {mode === 'signin' ? 'Welcome back' : 'Join the community'}
          </p>
        </div>

        {/* Card */}
        <div
          className="card p-6"
          style={{ background: 'rgba(10,10,12,0.80)', backdropFilter: 'blur(20px)' }}
        >
          {/* Tab switcher */}
          <div
            className="flex rounded-xl overflow-hidden p-1 mb-6"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {(['signin', 'signup'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className="flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200"
                style={{
                  background: mode === m ? '#F97316' : 'transparent',
                  color: mode === m ? 'white' : '#8C8680',
                  boxShadow: mode === m ? '0 2px 8px rgba(249,115,22,0.35)' : 'none',
                }}
              >
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {success ? (
            <div
              className="flex flex-col items-center text-center gap-3 py-6 px-4 rounded-xl"
              style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.20)' }}
            >
              <CheckCircle className="w-8 h-8 text-[#F97316]" />
              <p className="text-sm text-[#F5F0EB] leading-relaxed">{success}</p>
              <button
                onClick={() => switchMode('signin')}
                className="text-sm font-medium text-[#F97316] hover:text-[#FB923C] transition-colors"
              >
                Back to Sign In →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* Email */}
              <div>
                <label className="block text-[10px] font-mono font-medium mb-1.5 uppercase tracking-widest" style={{ color: '#8C8680' }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="input"
                />
                {isDevEmail && mode === 'signup' && (
                  <p className="text-[11px] font-mono mt-1.5" style={{ color: '#FB923C' }}>
                    ⚡ Developer account — username length restrictions lifted
                  </p>
                )}
                {isEarlyAccessEmail && !isDevEmail && mode === 'signup' && (
                  <p className="text-[11px] font-mono mt-1.5" style={{ color: '#7dd3fc' }}>
                    ✦ Early Access — 2-character minimum username
                  </p>
                )}
              </div>

              {/* Username (signup only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-[10px] font-mono font-medium mb-1.5 uppercase tracking-widest" style={{ color: '#8C8680' }}>Username</label>
                  <div className="relative">
                    <AtSign
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                      style={{ color: '#8C8680' }}
                    />
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                      required
                      placeholder="yourhandle"
                      maxLength={30}
                      className="input pl-9 pr-9"
                      style={{
                        borderColor: usernameError
                          ? 'rgba(239,68,68,0.5)'
                          : usernameAvailable
                          ? 'rgba(94,210,130,0.5)'
                          : undefined,
                      }}
                    />
                    {/* Status icon */}
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      {usernameChecking && <Loader2 className="w-3.5 h-3.5 text-[#8C8680] animate-spin" />}
                      {!usernameChecking && usernameAvailable && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
                      {!usernameChecking && usernameError && username.length > 0 && <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                    </div>
                  </div>

                  {usernameError && (
                    <p className="text-[11px] mt-1.5" style={{ color: '#f87171' }}>{usernameError}</p>
                  )}
                  {!usernameError && usernameAvailable && (
                    <p className="text-[11px] mt-1.5" style={{ color: '#4ade80' }}>@{username} is available</p>
                  )}
                  {!isDevEmail && !isEarlyAccessEmail && (
                    <p className="text-[11px] mt-1.5" style={{ color: '#8C8680' }}>
                      Min 3 characters · letters, numbers, underscores only
                    </p>
                  )}
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-[10px] font-mono font-medium mb-1.5 uppercase tracking-widest" style={{ color: '#8C8680' }}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="input"
                />
                {mode === 'signup' && (
                  <p className="text-[11px] mt-1.5" style={{ color: '#8C8680' }}>Minimum 6 characters</p>
                )}
              </div>

              {/* Email verification note (signup) */}
              {mode === 'signup' && (
                <div
                  className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl text-xs leading-relaxed"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#8C8680' }}
                >
                  <CheckCircle className="w-3.5 h-3.5 text-[#F97316] shrink-0 mt-0.5" />
                  <span>We'll send a confirmation link to your email. You must verify before signing in.</span>
                </div>
              )}

              {/* Captcha (signup only) */}
              {mode === 'signup' && (
                <div className="flex justify-center">
                  <div ref={containerRef} />
                </div>
              )}

              {error && (
                <div
                  className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs"
                  style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (mode === 'signup' && (!!usernameError || usernameChecking || !usernameAvailable || !captchaToken))}
                className="btn-primary w-full py-3 mt-1"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {!loading && (mode === 'signin' ? 'Sign In' : 'Create Account')}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#8C8680' }}>
          By signing up you agree to our{' '}
          <a href="/privacy" className="text-[#F97316] hover:text-[#FB923C] transition-colors underline underline-offset-2">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
    </>
  )
}
