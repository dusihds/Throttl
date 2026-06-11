-- ─────────────────────────────────────────────────────────────────────────
-- Throttl — Bot Feed Seed
-- Run this once in your Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Safe to re-run (uses ON CONFLICT DO NOTHING)
-- ─────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  b1  uuid := 'aaaaaaaa-0001-4000-8000-000000000001';
  b2  uuid := 'aaaaaaaa-0002-4000-8000-000000000002';
  b3  uuid := 'aaaaaaaa-0003-4000-8000-000000000003';
  b4  uuid := 'aaaaaaaa-0004-4000-8000-000000000004';
  b5  uuid := 'aaaaaaaa-0005-4000-8000-000000000005';
  b6  uuid := 'aaaaaaaa-0006-4000-8000-000000000006';
  b7  uuid := 'aaaaaaaa-0007-4000-8000-000000000007';
  b8  uuid := 'aaaaaaaa-0008-4000-8000-000000000008';
  b9  uuid := 'aaaaaaaa-0009-4000-8000-000000000009';
  b10 uuid := 'aaaaaaaa-0010-4000-8000-000000000010';
BEGIN

  -- ── 1. Auth users ────────────────────────────────────────────────────
  INSERT INTO auth.users
    (id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
     aud, role, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token)
  VALUES
    (b1,  'burnout_king@throttl.bot',  crypt('Throttl_bot!1', gen_salt('bf')), now(), now()-'60 days'::interval,  now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', '', ''),
    (b2,  'jdm_collector@throttl.bot', crypt('Throttl_bot!2', gen_salt('bf')), now(), now()-'55 days'::interval,  now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', '', ''),
    (b3,  'porsche_pete@throttl.bot',  crypt('Throttl_bot!3', gen_salt('bf')), now(), now()-'50 days'::interval,  now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', '', ''),
    (b4,  'v8_supremacy@throttl.bot',  crypt('Throttl_bot!4', gen_salt('bf')), now(), now()-'48 days'::interval,  now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', '', ''),
    (b5,  'euro_hauler@throttl.bot',   crypt('Throttl_bot!5', gen_salt('bf')), now(), now()-'42 days'::interval,  now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', '', ''),
    (b6,  'rotary_revival@throttl.bot',crypt('Throttl_bot!6', gen_salt('bf')), now(), now()-'38 days'::interval,  now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', '', ''),
    (b7,  'trackday_addict@throttl.bot',crypt('Throttl_bot!7', gen_salt('bf')), now(), now()-'35 days'::interval, now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', '', ''),
    (b8,  'daily_gt3@throttl.bot',     crypt('Throttl_bot!8', gen_salt('bf')), now(), now()-'30 days'::interval,  now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', '', ''),
    (b9,  'lowrider_levi@throttl.bot', crypt('Throttl_bot!9', gen_salt('bf')), now(), now()-'28 days'::interval,  now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', '', ''),
    (b10, 'skid_factory@throttl.bot',  crypt('Throttl_bot!0', gen_salt('bf')), now(), now()-'25 days'::interval,  now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', '', '')
  ON CONFLICT (id) DO NOTHING;

  -- ── 2. Profiles ───────────────────────────────────────────────────────
  INSERT INTO public.profiles (id, username, bio, is_developer, created_at)
  VALUES
    (b1,  'burnout_king',    'S2000 AP2 owner. Wet roads are my playground.',                               false, now()-'60 days'::interval),
    (b2,  'jdm_collector',   'R32, EK9, AE86 sitting in my garage. Send help.',                            false, now()-'55 days'::interval),
    (b3,  'porsche_pete',    '997.2 GT3 RS daily. Yes really.',                                            false, now()-'50 days'::interval),
    (b4,  'v8_supremacy',    'LS-swapped everything. American iron forever.',                               false, now()-'48 days'::interval),
    (b5,  'euro_hauler',     'E46 M3 guy. Trying to keep it stock before I ruin it.',                     false, now()-'42 days'::interval),
    (b6,  'rotary_revival',  'FD3S RX-7 daily. Apex seals are fine, I promise.',                          false, now()-'38 days'::interval),
    (b7,  'trackday_addict', 'Track only E92 M3. Nurburgring next summer.',                               false, now()-'35 days'::interval),
    (b8,  'daily_gt3',       'They told me to get a practical car. I got a GT3.',                          false, now()-'30 days'::interval),
    (b9,  'lowrider_levi',   '1964 Impala SS. Hydraulics on point.',                                      false, now()-'28 days'::interval),
    (b10, 'skid_factory',    'Anything sideways. AE86 | R33 | MX-5 NB.',                                  false, now()-'25 days'::interval)
  ON CONFLICT (id) DO NOTHING;

  -- ── 3. Feed posts ─────────────────────────────────────────────────────
  INSERT INTO public.feed_posts (user_id, content, type, created_at)
  VALUES
    -- burnout_king
    (b1, 'Took the S2000 out in the rain tonight. Wet tarmac + VTEC = absolute religion. This car still gives me butterflies after 4 years.', 'post', now()-'3 hours'::interval),
    (b1, 'Hot take: the S2000 AP2 is the most underrated driver''s car ever made. Discuss.', 'post', now()-'5 days'::interval),
    (b1, 'People really out here buying Supra MK5 for 80k when you can get a used AP1 for 30 and feel MORE alive. Make it make sense.', 'post', now()-'12 days'::interval),

    -- jdm_collector
    (b2, 'Just picked up an AE86 Trueno in factory white. Yes the body is rough, yes I don''t care, yes I''m starting a two-year restore. Send blessings.', 'post', now()-'6 hours'::interval),
    (b2, 'EK9 Type R or DC2 Type R? These two have been living in my garage for a month and I still can''t decide which gets the engine rebuild first.', 'post', now()-'3 days'::interval),
    (b2, 'The JDM tax is getting ridiculous. R32 GT-R asking price up 40% in two years. These aren''t investments lads, drive your cars.', 'post', now()-'9 days'::interval),

    -- porsche_pete
    (b3, 'Drove 600km to a track day, lapped 40 times, drove 600km home. GT3 RS didn''t complain once. I''m the one who needs a physio.', 'post', now()-'1 hour'::interval),
    (b3, 'People who buy Porsche and never take them to a track make me genuinely sad. These cars were born on tarmac not Instagram feeds.', 'post', now()-'4 days'::interval),
    (b3, 'Ran a 7:48 at the Ring last week in the GT3 RS. Not record territory but I''ll take it. Anyone else been up recently?', 'post', now()-'14 days'::interval),

    -- v8_supremacy
    (b4, 'LS swap complete on the old FJ40. 550whp Land Cruiser is something this world wasn''t ready for. The neighbours are very much not ready for it either.', 'post', now()-'2 hours'::interval),
    (b4, 'Unpopular opinion: a supercharged Corvette C6 Z06 is the best bang-per-dollar sports car available right now. Nothing at $35k gets close.', 'post', now()-'6 days'::interval),
    (b4, 'V8 NA > everything else. Fight me in the comments. I have all day and four litres of displacement.', 'post', now()-'18 days'::interval),

    -- euro_hauler
    (b5, 'M54 rebuild done. The E46 M3 is officially running better than the day it left Munich in 2003. I might cry.', 'post', now()-'4 hours'::interval),
    (b5, 'Spotted a mint condition E30 M3 in the wild today, original paint, matching numbers. Owner said he bought it new. Some people deserve good things.', 'post', now()-'2 days'::interval),

    -- rotary_revival
    (b6, 'New apex seals fitted. FD3S is alive again. Honestly the sound on cold start never gets old — like an angry weed whacker from the future.', 'post', now()-'30 minutes'::interval),
    (b6, 'The rotary engine is the most fascinating thing in automotive history and everyone abandoned it before it reached its potential. Fight me Mazda.', 'post', now()-'7 days'::interval),
    (b6, 'Day 34 of convincing my girlfriend the RX-7 is "reliable enough" for road trips. She found my bag of spare spark plugs. Negotiations have broken down.', 'post', now()-'16 days'::interval),

    -- trackday_addict
    (b7, 'Track day tomorrow. Front brake pads look thin. Going anyway. See you all on the other side.', 'post', now()-'8 hours'::interval),
    (b7, 'Reminder that your road tyres are holding you back more than your power figure. Switched to Cup2s and dropped 4 seconds a lap. Tyres > everything.', 'post', now()-'5 days'::interval),

    -- daily_gt3
    (b8, 'Took the GT3 to Tesco. Parked across two spaces. Zero regrets. The car deserves it.', 'post', now()-'45 minutes'::interval),
    (b8, 'Third oil service this year. Worth every penny. If your car doesn''t need servicing every 5,000km you''re not driving it hard enough.', 'post', now()-'11 days'::interval),

    -- lowrider_levi
    (b9, 'All-hydraulics meeting this Saturday in the warehouse district. 8PM. If you know you know. '64 Impala will be there in full bounce mode.', 'post', now()-'3 hours'::interval),
    (b9, 'The lowrider scene never left, the rest of the world just stopped paying attention. Come to a show and try not to have your jaw on the floor.', 'post', now()-'8 days'::interval),

    -- skid_factory
    (b10,'Busted diff in the AE86. Perfect excuse to fit an LSD. Every mechanical failure is just a forced upgrade in disguise.', 'post', now()-'90 minutes'::interval),
    (b10,'Nothing in life prepares you for the first time you get a car truly sideways at speed and it just... sits there. Throttle, angle, grip. Pure.', 'post', now()-'20 days'::interval)
  ;

END $$;

-- ── Verify ──────────────────────────────────────────────────────────────────
SELECT p.username, COUNT(fp.id) AS posts
FROM profiles p
LEFT JOIN feed_posts fp ON fp.user_id = p.id
WHERE p.id BETWEEN 'aaaaaaaa-0001-4000-8000-000000000001'
                AND 'aaaaaaaa-0010-4000-8000-000000000010'
GROUP BY p.username
ORDER BY p.username;
