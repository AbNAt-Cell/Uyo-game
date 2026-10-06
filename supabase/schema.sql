create extension if not exists pgcrypto;

create table if not exists public.landmarks (
  id text primary key,
  slug text unique not null,
  name text not null,
  category text not null default 'place',
  description text not null default '',
  game_x double precision not null default 0,
  game_y double precision not null default 0,
  lat double precision,
  lng double precision,
  osm_type text,
  osm_id text,
  google_place_id text,
  asset_key text not null default 'default',
  interaction text not null default 'network',
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_key text default 'starter',
  role text not null default 'player',
  created_at timestamptz not null default now()
);

create table if not exists public.player_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  cash bigint not null default 43500,
  energy int not null default 82 check (energy between 0 and 100),
  mood int not null default 74 check (mood between 0 and 100),
  reputation int not null default 0 check (reputation between 0 and 100),
  network int not null default 6,
  location_id text references public.landmarks(id),
  x double precision not null default 0,
  y double precision not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount bigint not null,
  reason text not null,
  ref_type text,
  ref_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.city_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  landmark_id text references public.landmarks(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  modifiers jsonb not null default '{}'::jsonb,
  enabled boolean not null default true
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id),
  name text not null,
  category text not null,
  landmark_id text references public.landmarks(id),
  cash bigint not null default 0,
  reputation int not null default 0,
  enabled boolean not null default true
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin'
);

alter table public.landmarks enable row level security;
alter table public.player_state enable row level security;
alter table public.ledger enable row level security;
alter table public.businesses enable row level security;

create policy "public reads published landmarks" on public.landmarks for select using (enabled = true);
create policy "players read own state" on public.player_state for select using (auth.uid() = user_id);
create policy "players update own state" on public.player_state for update using (auth.uid() = user_id);
create policy "players read own ledger" on public.ledger for select using (auth.uid() = user_id);
