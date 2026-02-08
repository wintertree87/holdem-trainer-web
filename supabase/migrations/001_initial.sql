-- Profiles
create table if not exists profiles (
  id uuid references auth.users primary key,
  display_name text,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Lesson progress
create table if not exists lesson_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  lesson_id text not null,
  crown int default 0,
  best_accuracy real default 0,
  attempts int default 0,
  last_attempt date,
  unique(user_id, lesson_id)
);

-- User XP
create table if not exists user_xp (
  user_id uuid references profiles(id) on delete cascade primary key,
  total int default 0
);

-- Practice stats
create table if not exists practice_stats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  mode text not null,
  correct int default 0,
  wrong int default 0,
  unique(user_id, mode)
);

-- Daily hands
create table if not exists daily_hands (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  date date not null,
  count int default 0,
  unique(user_id, date)
);

-- Wrong notes
create table if not exists wrong_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  hand text not null,
  position text not null,
  vs_position text,
  mode text not null,
  my_answer text not null,
  correct_answer text not null,
  created_at timestamptz default now()
);

-- RLS policies
alter table profiles enable row level security;
alter table lesson_progress enable row level security;
alter table user_xp enable row level security;
alter table practice_stats enable row level security;
alter table daily_hands enable row level security;
alter table wrong_notes enable row level security;

create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Users can read own lessons" on lesson_progress for select using (auth.uid() = user_id);
create policy "Users can insert own lessons" on lesson_progress for insert with check (auth.uid() = user_id);
create policy "Users can update own lessons" on lesson_progress for update using (auth.uid() = user_id);

create policy "Users can read own xp" on user_xp for select using (auth.uid() = user_id);
create policy "Users can insert own xp" on user_xp for insert with check (auth.uid() = user_id);
create policy "Users can update own xp" on user_xp for update using (auth.uid() = user_id);

create policy "Users can read own stats" on practice_stats for select using (auth.uid() = user_id);
create policy "Users can insert own stats" on practice_stats for insert with check (auth.uid() = user_id);
create policy "Users can update own stats" on practice_stats for update using (auth.uid() = user_id);

create policy "Users can read own daily" on daily_hands for select using (auth.uid() = user_id);
create policy "Users can insert own daily" on daily_hands for insert with check (auth.uid() = user_id);
create policy "Users can update own daily" on daily_hands for update using (auth.uid() = user_id);

create policy "Users can read own wrong notes" on wrong_notes for select using (auth.uid() = user_id);
create policy "Users can insert own wrong notes" on wrong_notes for insert with check (auth.uid() = user_id);
create policy "Users can delete own wrong notes" on wrong_notes for delete using (auth.uid() = user_id);
