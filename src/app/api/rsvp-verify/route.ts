import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { session_id, event_id } = await req.json()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey || secretKey.includes('REPLACE_WITH')) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const stripe = new Stripe(secretKey)
  const session = await stripe.checkout.sessions.retrieve(session_id)

  if (session.payment_status !== 'paid') {
    return NextResponse.json({ error: 'Payment not completed' }, { status: 402 })
  }
  if (session.metadata?.user_id !== user.id || session.metadata?.event_id !== event_id) {
    return NextResponse.json({ error: 'Session mismatch' }, { status: 403 })
  }

  await supabase.from('event_attendees').upsert(
    { event_id, user_id: user.id, stripe_session_id: session_id, payment_status: 'paid' },
    { onConflict: 'event_id,user_id' }
  )

  return NextResponse.json({ success: true })
}
