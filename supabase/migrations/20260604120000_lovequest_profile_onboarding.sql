-- LoveQuest: user profile row (display name + onboarding flag).
-- Greenfield LoveQuest DBs may never have run legacy cat migrations — bootstrap profiles here.
-- Safe to re-run.

-- ===========================================================================
-- 1. profiles table (minimal; 1:1 with auth.users)
-- ===========================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  has_completed_onboarding boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now())
);

-- Column added when table existed from an older migration without onboarding flag
alter table public.profiles
  add column if not exists has_completed_onboarding boolean not null default false;

create index if not exists profiles_updated_at_idx on public.profiles (updated_at desc);

comment on table public.profiles is
  'LoveQuest per-user settings; 1:1 with auth.users.';
comment on column public.profiles.has_completed_onboarding is
  'LoveQuest onboarding seen; source of truth when user is authenticated.';

-- ===========================================================================
-- 2. RLS
-- ===========================================================================

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

grant select, insert, update on table public.profiles to authenticated;

-- ===========================================================================
-- 3. updated_at trigger
-- ===========================================================================

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_profiles_updated_at();

-- ===========================================================================
-- 4. Auto row on signup
-- ===========================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  dn text;
begin
  dn := nullif(
    trim(
      coalesce(
        new.raw_user_meta_data->>'display_name',
        new.raw_user_meta_data->>'full_name',
        split_part(new.email, '@', 1)
      )
    ),
    ''
  );
  insert into public.profiles (id, display_name)
  values (new.id, dn)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ===========================================================================
-- 5. Backfill existing auth users
-- ===========================================================================

insert into public.profiles (id, display_name)
select
  u.id,
  nullif(
    trim(
      coalesce(
        u.raw_user_meta_data->>'display_name',
        u.raw_user_meta_data->>'full_name',
        split_part(u.email, '@', 1)
      )
    ),
    ''
  )
from auth.users u
on conflict (id) do nothing;
