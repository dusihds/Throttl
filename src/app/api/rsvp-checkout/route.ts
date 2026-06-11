import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { event_id, event_title } = await req.json()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: event } = await supabase
    .from('car_events')
    .select('max_capacity, event_attendees(count)')
    .eq('id', event_id)
    .single()

  if (event?.max_capacity) {
    const count = event.event_attendees?.[0]?.count ?? 0
    if (count >= event.max_capacity) {
      return NextResponse.json({ error: 'This event is full.' }, { status: 409 })
    }
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey || secretKey.includes('REPLACE_WITH')) {
    return NextResponse.json({ error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local.' }, { status: 500 })
  }

  const stripe = new Stripe(secretKey)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: `RSVP: ${event_title}`, description: 'Throttl event reservation fee' },
        unit_amount: 100,
      },
      quantity: 1,
    }],
    mode: 'payment',
    metadata: { event_id, user_id: user.id },
    success_url: `${appUrl}/events/${event_id}?rsvp=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/events/${event_id}`,
  })

  return NextResponse.json({ url: session.url })
}
