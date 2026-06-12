import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SECRET = 'throttl_seed_2026'

const BOTS = [
  { email: 'burnout_king@throttl.bot',     username: 'burnout_king',     bio: 'S2000 AP2 owner. Wet roads are my playground.' },
  { email: 'jdm_collector@throttl.bot',    username: 'jdm_collector',    bio: 'R32, EK9, AE86 sitting in my garage. Send help.' },
  { email: 'porsche_pete@throttl.bot',     username: 'porsche_pete',     bio: '997.2 GT3 RS daily. Yes really.' },
  { email: 'v8_supremacy@throttl.bot',     username: 'v8_supremacy',     bio: 'LS-swapped everything. American iron forever.' },
  { email: 'rotary_revival@throttl.bot',   username: 'rotary_revival',   bio: 'FD3S RX-7 daily. Apex seals are fine, I promise.' },
  { email: 'trackday_addict@throttl.bot',  username: 'trackday_addict',  bio: 'Track only E92 M3. Nurburgring next summer.' },
  { email: 'euro_hauler@throttl.bot',      username: 'euro_hauler',      bio: 'E46 M3 guy. Trying to keep it stock before I ruin it.' },
  { email: 'daily_gt3@throttl.bot',        username: 'daily_gt3',        bio: 'They told me to get a practical car. I got a GT3.' },
  { email: 'lowrider_levi@throttl.bot',    username: 'lowrider_levi',    bio: '1964 Impala SS. Hydraulics on point.' },
  { email: 'skid_factory@throttl.bot',     username: 'skid_factory',     bio: 'Anything sideways. AE86 | R33 | MX-5 NB.' },
]

const POSTS: { username: string; content: string; hoursAgo: number }[] = [
  { username: 'burnout_king',    hoursAgo: 1,   content: 'Took the S2000 out in the rain tonight. Wet tarmac + VTEC = absolute religion. This car still gives me butterflies after 4 years.' },
  { username: 'jdm_collector',   hoursAgo: 3,   content: 'Just picked up an AE86 Trueno in factory white. Yes the body is rough, yes I don\'t care, yes I\'m starting a two-year restore. Send blessings.' },
  { username: 'porsche_pete',    hoursAgo: 2,   content: 'Drove 600km to a track day, lapped 40 times, drove 600km home. GT3 RS didn\'t complain once. I\'m the one who needs a physio.' },
  { username: 'v8_supremacy',    hoursAgo: 4,   content: 'LS swap complete on the old FJ40. 550whp Land Cruiser is something this world wasn\'t ready for. The neighbours definitely aren\'t ready for it either.' },
  { username: 'rotary_revival',  hoursAgo: 0.5, content: 'New apex seals fitted. FD3S is alive again. The sound on cold start never gets old — like an angry weed whacker from the future.' },
  { username: 'trackday_addict', hoursAgo: 8,   content: 'Reminder that your road tyres are holding you back more than your power figure. Switched to Cup2s and dropped 4 seconds a lap. Tyres > everything.' },
  { username: 'euro_hauler',     hoursAgo: 5,   content: 'M54 rebuild done. The E46 M3 is running better than the day it left Munich in 2003. I might cry.' },
  { username: 'daily_gt3',       hoursAgo: 0.8, content: 'Took the GT3 to Tesco. Parked across two spaces. Zero regrets. The car deserves it.' },
  { username: 'lowrider_levi',   hoursAgo: 3.5, content: 'All-hydraulics meeting this Saturday in the warehouse district. 8PM. If you know you know. \'64 Impala will be there in full bounce mode.' },
  { username: 'skid_factory',    hoursAgo: 1.5, content: 'Busted diff in the AE86. Perfect excuse to fit an LSD. Every mechanical failure is just a forced upgrade in disguise.' },
  { username: 'burnout_king',    hoursAgo: 120, content: 'Hot take: the S2000 AP2 is the most underrated driver\'s car ever made. Prove me wrong.' },
  { username: 'jdm_collector',   hoursAgo: 72,  content: 'EK9 Type R or DC2 Type R? Two of these in my garage and I still can\'t decide which gets the engine rebuild first.' },
  { username: 'porsche_pete',    hoursAgo: 96,  content: 'People who buy Porsche and never take them to a track make me genuinely sad. These cars were born on tarmac not Instagram feeds.' },
  { username: 'v8_supremacy',    hoursAgo: 144, content: 'Unpopular opinion: a supercharged C6 Z06 is the best bang-per-dollar sports car available right now. Nothing at $35k gets close.' },
  { username: 'rotary_revival',  hoursAgo: 168, content: 'Day 34 of convincing my girlfriend the RX-7 is "reliable enough" for road trips. She found my bag of spare spark plugs. Negotiations have broken down.' },
  { username: 'trackday_addict', hoursAgo: 48,  content: 'Track day tomorrow. Front brake pads look thin. Going anyway. See you all on the other side.' },
  { username: 'euro_hauler',     hoursAgo: 55,  content: 'Spotted a mint E30 M3 in the wild today, original paint, matching numbers. Owner said he bought it new. Some people deserve good things.' },
  { username: 'daily_gt3',       hoursAgo: 264, content: 'Third oil service this year. Worth every penny. If your car doesn\'t need servicing every 5,000km you\'re not driving it hard enough.' },
  { username: 'lowrider_levi',   hoursAgo: 192, content: 'The lowrider scene never left, the rest of the world just stopped paying attention. Come to a show and try not to have your jaw on the floor.' },
  { username: 'skid_factory',    hoursAgo: 480, content: 'Nothing in life prepares you for the first time you get a car truly sideways at speed and it just... sits there. Throttle, angle, grip. Pure.' },
]

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const results: string[] = []

  // ── 1. Ensure bot users exist ─────────────────────────────────────────
  const userMap: Record<string, string> = {}

  for (const bot of BOTS) {
    // Try to find existing user
    const { data: existing } = await admin.auth.admin.listUsers()
    const found = existing?.users?.find(u => u.email === bot.email)

    let userId: string

    if (found) {
      userId = found.id
      results.push(`existing: ${bot.username}`)
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email: bot.email,
        password: 'Throttl_bot_9x!',
        email_confirm: true,
        user_metadata: { username: bot.username },
      })

      if (error || !data.user) {
        results.push(`error creating ${bot.username}: ${error?.message}`)
        continue
      }
      userId = data.user.id

      // Upsert profile
      await admin.from('profiles').upsert({
        id: userId,
        username: bot.username,
        bio: bot.bio,
        is_developer: false,
      }, { onConflict: 'id' })

      results.push(`created: ${bot.username}`)
    }

    userMap[bot.username] = userId
  }

  // ── 2. Insert posts that don't already exist ──────────────────────────
  let inserted = 0
  for (const p of POSTS) {
    const uid = userMap[p.username]
    if (!uid) continue

    const createdAt = new Date(Date.now() - p.hoursAgo * 3_600_000).toISOString()

    // Skip if this exact content already posted by this user
    const { data: existing } = await admin
      .from('feed_posts')
      .select('id')
      .eq('user_id', uid)
      .eq('content', p.content)
      .maybeSingle()

    if (existing) continue

    await admin.from('feed_posts').insert({
      user_id: uid,
      content: p.content,
      type: 'post',
      created_at: createdAt,
    })
    inserted++
  }

  results.push(`inserted ${inserted} posts`)
  return NextResponse.json({ ok: true, results })
}
