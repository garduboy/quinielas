-- Run this in your Supabase SQL editor to set up the database

-- Matches (populated by your cron job from football-data.org)
create table matches (
  id          uuid primary key default gen_random_uuid(),
  external_id text unique,           -- ID from football-data.org
  home_team   text not null,
  away_team   text not null,
  league      text not null,
  kickoff     timestamptz not null,
  home_score  int,
  away_score  int,
  status      text default 'upcoming' check (status in ('upcoming','live','finished')),
  created_at  timestamptz default now()
);

-- User predictions (one per user per match)
create table predictions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users not null,
  match_id      uuid references matches not null,
  pick          text not null check (pick in ('home','draw','away')),
  points_earned int,
  created_at    timestamptz default now(),
  unique (user_id, match_id)   -- one pick per match per user
);

-- Leaderboard view (auto-calculated)
create view leaderboard as
  select
    p.user_id,
    u.raw_user_meta_data->>'display_name' as display_name,
    coalesce(sum(p.points_earned), 0)     as total_points,
    count(*) filter (where p.points_earned > 0) as correct_picks,
    count(*)                               as total_picks
  from predictions p
  join auth.users u on u.id = p.user_id
  group by p.user_id, display_name
  order by total_points desc;

-- Row-level security: users can only see/edit their own predictions
alter table predictions enable row level security;

create policy "Users can read own predictions"
  on predictions for select
  using (auth.uid() = user_id);

create policy "Users can insert own predictions"
  on predictions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own predictions before kickoff"
  on predictions for update
  using (
    auth.uid() = user_id
    and (select kickoff from matches where id = match_id) > now()
  );

-- Matches are readable by everyone in the pool
alter table matches enable row level security;
create policy "Matches are public" on matches for select using (true);

-- Permissions (run these if you get "permission denied" errors)
grant select on matches to anon;
grant select on matches to authenticated;
grant all on predictions to authenticated;
grant select on leaderboard to anon;
grant select on leaderboard to authenticated;
