-- ================================================================
-- CarSpot — Supabase Schema
-- Run this in your Supabase SQL editor
-- ================================================================

-- ── Profiles ────────────────────────────────────────────────────
create table public.profiles (
  id           uuid references auth.users on delete cascade primary key,
  username     text unique not null,
  avatar_url   text,
  bio          text,
  is_developer boolean default false,
  created_at   timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- ── Auto-create profile on signup ────────────────────────────────
-- Reads chosen username from auth metadata (passed by the signup form).
-- Falls back to email-prefix if no username provided.
-- Appends a number suffix to resolve any collisions.
-- Sets is_developer=true for the owner email.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  chosen  text;
  base    text;
  final   text;
  n       int := 0;
begin
  chosen := trim(new.raw_user_meta_data->>'username');

  if chosen is not null and length(chosen) >= 1 then
    base := chosen;
  else
    base := regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g');
    if length(base) < 3 then base := 'user'; end if;
  end if;

  final := base;
  while exists (select 1 from public.profiles where username = final) loop
    n     := n + 1;
    final := base || n::text;
  end loop;

  insert into public.profiles (id, username, is_developer)
  values (
    new.id,
    final,
    new.email = 'viktormaras2011@gmail.com'
  );

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Car Spots ───────────────────────────────────────────────────
create table public.car_spots (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  make            text not null,
  model           text not null,
  year            int,
  color           text,
  location_name   text not null,
  lat             decimal,
  lng             decimal,
  estimated_worth decimal,
  photo_url       text,
  notes           text,
  spotted_at      timestamptz default now(),
  created_at      timestamptz default now()
);

alter table public.car_spots enable row level security;

create policy "Spots are viewable by everyone" on public.car_spots for select using (true);
create policy "Users can insert own spots"    on public.car_spots for insert with check (auth.uid() = user_id);
create policy "Users can update own spots"    on public.car_spots for update using (auth.uid() = user_id);
create policy "Users can delete own spots"    on public.car_spots for delete using (auth.uid() = user_id);

-- ── Car Events ──────────────────────────────────────────────────
create table public.car_events (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid references public.profiles(id) on delete cascade not null,
  title            text not null,
  description      text,
  location_name    text not null,
  lat              decimal,
  lng              decimal,
  start_time       timestamptz not null,
  end_time         timestamptz,
  is_recurring       boolean default false,
  recurrence_rule    text,
  cover_image_url    text,
  is_verified        boolean default false,
  organizer_contact  text,
  created_at         timestamptz default now()
);

alter table public.car_events enable row level security;

create policy "Events are viewable by everyone" on public.car_events for select using (true);
create policy "Users can insert own events"     on public.car_events for insert with check (auth.uid() = user_id);
create policy "Users can update own events"     on public.car_events for update using (auth.uid() = user_id);
create policy "Users can delete own events"     on public.car_events for delete using (auth.uid() = user_id);
create policy "Developers can update any event" on public.car_events
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and is_developer = true)
  );

-- ── Event Attendees ─────────────────────────────────────────────
create table public.event_attendees (
  event_id   uuid references public.car_events(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (event_id, user_id)
);

alter table public.event_attendees enable row level security;

create policy "Attendees are viewable by everyone" on public.event_attendees for select using (true);
create policy "Users can manage own attendance"    on public.event_attendees for all using (auth.uid() = user_id);

-- ── Storage bucket for photos ───────────────────────────────────
insert into storage.buckets (id, name, public) values ('photos', 'photos', true);

create policy "Anyone can view photos" on storage.objects
  for select using (bucket_id = 'photos');

create policy "Authenticated users can upload photos" on storage.objects
  for insert with check (bucket_id = 'photos' and auth.role() = 'authenticated');

create policy "Users can delete own photos" on storage.objects
  for delete using (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- ── Community Feed ──────────────────────────────────────────────
create table public.feed_posts (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  content    text not null,
  type       text not null default 'post', -- 'post' | 'poll'
  created_at timestamptz default now()
);

alter table public.feed_posts enable row level security;
create policy "Feed posts are viewable by everyone" on public.feed_posts for select using (true);
create policy "Users can insert own posts"          on public.feed_posts for insert with check (auth.uid() = user_id);
create policy "Users can delete own posts"          on public.feed_posts for delete using (auth.uid() = user_id);

-- ── Poll Options ────────────────────────────────────────────────
create table public.feed_poll_options (
  id       uuid default gen_random_uuid() primary key,
  post_id  uuid references public.feed_posts(id) on delete cascade not null,
  text     text not null,
  position int  not null
);

alter table public.feed_poll_options enable row level security;
create policy "Poll options are viewable by everyone" on public.feed_poll_options for select using (true);
create policy "Users can insert options for own posts" on public.feed_poll_options
  for insert with check (
    exists (select 1 from public.feed_posts where id = post_id and user_id = auth.uid())
  );

-- ── Poll Votes (one per user per poll) ─────────────────────────
create table public.feed_poll_votes (
  post_id    uuid references public.feed_posts(id)        on delete cascade,
  option_id  uuid references public.feed_poll_options(id) on delete cascade,
  user_id    uuid references public.profiles(id)          on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

alter table public.feed_poll_votes enable row level security;
create policy "Poll votes are viewable by everyone" on public.feed_poll_votes for select using (true);
create policy "Users can cast own vote"             on public.feed_poll_votes for insert with check (auth.uid() = user_id);
create policy "Users can delete own vote"           on public.feed_poll_votes for delete using (auth.uid() = user_id);

-- ── Reactions (like / dislike on posts and replies) ─────────────
create table public.feed_reactions (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  target_id   uuid not null,
  target_type text not null, -- 'post' | 'reply'
  reaction    text not null, -- 'like' | 'dislike'
  created_at  timestamptz default now(),
  unique (user_id, target_id, target_type)
);

alter table public.feed_reactions enable row level security;
create policy "Reactions are viewable by everyone" on public.feed_reactions for select using (true);
create policy "Users can manage own reactions"     on public.feed_reactions for all  using (auth.uid() = user_id);

-- ── Replies ────────────────────────────────────────────────────
create table public.feed_replies (
  id         uuid default gen_random_uuid() primary key,
  post_id    uuid references public.feed_posts(id)   on delete cascade not null,
  user_id    uuid references public.profiles(id)     on delete cascade not null,
  content    text not null,
  created_at timestamptz default now()
);

alter table public.feed_replies enable row level security;
create policy "Replies are viewable by everyone" on public.feed_replies for select using (true);
create policy "Users can insert own replies"     on public.feed_replies for insert with check (auth.uid() = user_id);
create policy "Users can delete own replies"     on public.feed_replies for delete using (auth.uid() = user_id);

-- ── Migration: Event verification (run in SQL editor if table already exists) ──
-- alter table public.car_events add column if not exists is_verified boolean default false;
-- alter table public.car_events add column if not exists organizer_contact text;
-- create policy "Developers can update any event" on public.car_events
--   for update using (
--     exists (select 1 from public.profiles where id = auth.uid() and is_developer = true)
--   );

-- ── Migration: Event capacity + rating gate + payment ────────────────
-- Run these in Supabase SQL editor if table already exists:
-- alter table public.car_events add column if not exists max_capacity int;
-- alter table public.car_events add column if not exists min_rating_required decimal(2,1);
-- alter table public.car_events add column if not exists requires_payment boolean default false;
-- alter table public.event_attendees add column if not exists stripe_session_id text;
-- alter table public.event_attendees add column if not exists payment_status text default 'free';

-- ── Profile Reviews ──────────────────────────────────────────────────
create table public.profile_reviews (
  id           uuid default gen_random_uuid() primary key,
  reviewer_id  uuid references public.profiles(id) on delete cascade not null,
  reviewee_id  uuid references public.profiles(id) on delete cascade not null,
  event_id     uuid references public.car_events(id) on delete cascade not null,
  rating       int not null check (rating between 1 and 5),
  comment      text,
  created_at   timestamptz default now(),
  unique (reviewer_id, reviewee_id, event_id)
);

alter table public.profile_reviews enable row level security;
create policy "Reviews are viewable by everyone" on public.profile_reviews for select using (true);
create policy "Users can insert own reviews"    on public.profile_reviews for insert with check (auth.uid() = reviewer_id);

-- ── Migration: Early Access + profile updates ───────────────────────
-- alter table public.profiles add column if not exists is_early_access boolean default false;
--
-- Update handle_new_user to also flag early access email:
create or replace function public.handle_new_user()
returns trigger as $$
declare
  chosen  text;
  base    text;
  final   text;
  n       int := 0;
begin
  chosen := trim(new.raw_user_meta_data->>'username');

  if chosen is not null and length(chosen) >= 1 then
    base := chosen;
  else
    base := regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g');
    if length(base) < 3 then base := 'user'; end if;
  end if;

  final := base;
  while exists (select 1 from public.profiles where username = final) loop
    n     := n + 1;
    final := base || n::text;
  end loop;

  insert into public.profiles (id, username, is_developer, is_early_access)
  values (
    new.id,
    final,
    new.email = 'viktormaras2011@gmail.com',
    new.email = 'tanemscully@gmail.com'
  );

  return new;
end;
$$ language plpgsql security definer;
