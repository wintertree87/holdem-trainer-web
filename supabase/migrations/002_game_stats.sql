-- Game stats table for bot match results
create table if not exists game_stats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  tier text not null,
  result text not null,  -- 'hero', 'bot', 'tie'
  hero_final_stack real not null,
  bot_final_stack real not null,
  hands_played int not null,
  xp_earned int default 0,
  created_at timestamptz default now()
);

-- Index for user queries
create index if not exists idx_game_stats_user on game_stats(user_id);

-- RLS policies
alter table game_stats enable row level security;

create policy "Users can view own game stats"
  on game_stats for select
  using (auth.uid() = user_id);

create policy "Users can insert own game stats"
  on game_stats for insert
  with check (auth.uid() = user_id);
