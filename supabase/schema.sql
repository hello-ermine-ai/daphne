-- Sessions: track time spent in app
create table if not exists sessions (
  id uuid default gen_random_uuid() primary key,
  started_at timestamptz default now(),
  ended_at timestamptz,
  subject text
);

-- Attempts: every question Daphne answers
create table if not exists attempts (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references sessions(id),
  subject text not null,
  question text not null,
  user_answer text not null,
  correct boolean not null,
  difficulty int default 1,
  stars_earned int default 0,
  created_at timestamptz default now()
);

-- Progress: current level and stats per subject
create table if not exists progress (
  id uuid default gen_random_uuid() primary key,
  subject text unique not null,
  difficulty int default 1,
  consecutive_correct int default 0,
  consecutive_wrong int default 0,
  total_correct int default 0,
  total_attempts int default 0,
  total_stars int default 0,
  updated_at timestamptz default now()
);

-- Streak: one row per day Daphne uses the app
create table if not exists daily_usage (
  id uuid default gen_random_uuid() primary key,
  date date unique default current_date,
  minutes_spent int default 0,
  attempts_count int default 0
);

-- RPC helpers for atomic increments
create or replace function increment_daily_usage(p_date date, p_minutes int)
returns void language plpgsql as $$
begin
  insert into daily_usage (date, minutes_spent, attempts_count)
    values (p_date, p_minutes, 0)
    on conflict (date) do update
      set minutes_spent = daily_usage.minutes_spent + p_minutes;
end;
$$;

create or replace function increment_daily_attempts(p_date date)
returns void language plpgsql as $$
begin
  insert into daily_usage (date, minutes_spent, attempts_count)
    values (p_date, 0, 1)
    on conflict (date) do update
      set attempts_count = daily_usage.attempts_count + 1;
end;
$$;

-- Seed initial progress rows for each subject
insert into progress (subject, difficulty) values
  ('Math', 1),
  ('Spelling', 1),
  ('Reading', 1)
on conflict (subject) do nothing;
