-- LoveQuest Phase 7: couple spaces + invite codes + single JSONB app state sync.
-- Apply via Supabase SQL Editor or: supabase db push
--
-- Design: one row per couple in couple_app_state (state jsonb), not per-feature tables.
-- Safe to re-run: IF NOT EXISTS, CREATE OR REPLACE, DROP POLICY IF EXISTS.
--
-- Relationship to Phase 5 (20260521120000):
--   If you already ran Phase 5 multi-table migration, this file still works:
--   - Reuses public.couples / public.couple_members when present
--   - Adds public.couple_app_state (Phase 5 used couple_stats.app_state for partial data)
--   - Phase 5 granular tables (food_*, chores, etc.) are NOT required for Phase 7 sync
--   - Greenfield: run ONLY this file OR run Phase 5 then this file

-- ===========================================================================
-- 1. Extensions
-- ===========================================================================

create extension if not exists pgcrypto;

-- ===========================================================================
-- 2. couples (owner_id, invite_code, couple_name, created_at)
-- ===========================================================================

create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  invite_code text not null,
  couple_name text,
  created_at timestamptz not null default timezone('utc', now())
);

-- Phase 5 compatibility: created_by → owner_id, display_name → couple_name
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'couples' and column_name = 'created_by'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'couples' and column_name = 'owner_id'
  ) then
    alter table public.couples add column owner_id uuid references auth.users (id) on delete cascade;
    update public.couples set owner_id = created_by where owner_id is null;
    alter table public.couples alter column owner_id set not null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'couples' and column_name = 'display_name'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'couples' and column_name = 'couple_name'
  ) then
    alter table public.couples add column couple_name text;
    update public.couples set couple_name = display_name where couple_name is null;
  end if;
end $$;

create unique index if not exists couples_invite_code_lower_idx on public.couples (lower(invite_code));
create index if not exists couples_owner_id_idx on public.couples (owner_id);

-- ===========================================================================
-- 3. couple_members (max 2 per couple)
-- ===========================================================================

create table if not exists public.couple_members (
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'partner')),
  joined_at timestamptz not null default timezone('utc', now()),
  primary key (couple_id, user_id)
);

create index if not exists couple_members_user_id_idx on public.couple_members (user_id);

-- One couple per user (MVP)
create unique index if not exists couple_members_one_couple_per_user_idx
  on public.couple_members (user_id);

-- ===========================================================================
-- 4. couple_app_state (single JSONB blob per couple)
-- ===========================================================================

create table if not exists public.couple_app_state (
  couple_id uuid primary key references public.couples (id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references auth.users (id) on delete set null
);

create index if not exists couple_app_state_updated_at_idx
  on public.couple_app_state (couple_id, updated_at desc);

-- Expected state shape (documented in docs/phase7-couple-sync-plan.md):
-- {
--   "version": 1,
--   "couple": { "nameA", "nameB", "emojiA", "emojiB" },
--   "dinner": { ... },
--   "housework": { ... },
--   "tasks": { ... },
--   "flirtGames": { ... },
--   "datePlanner": { ... },
--   "anniversaries": { ... },
--   "rewards": { ... },
--   "rpg": { ... },
--   "completionHistory": [ ... ],
--   "activity": [ ... ]
-- }

-- ===========================================================================
-- 5. Triggers
-- ===========================================================================

create or replace function public.lovequest_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists couple_app_state_set_updated_at on public.couple_app_state;
create trigger couple_app_state_set_updated_at
  before update on public.couple_app_state
  for each row
  execute function public.lovequest_set_updated_at();

-- ===========================================================================
-- 6. Helper functions (SECURITY DEFINER — avoid RLS recursion)
-- ===========================================================================

create or replace function public.is_couple_member(p_couple_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.couple_members cm
    where cm.couple_id = p_couple_id
      and cm.user_id = auth.uid()
  );
$$;

create or replace function public.is_couple_owner(p_couple_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.couple_members cm
    where cm.couple_id = p_couple_id
      and cm.user_id = auth.uid()
      and cm.role = 'owner'
  );
$$;

create or replace function public.couple_member_count(p_couple_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.couple_members cm
  where cm.couple_id = p_couple_id;
$$;

create or replace function public.my_couple_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select cm.couple_id
  from public.couple_members cm
  where cm.user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.is_couple_member(uuid) from public;
grant execute on function public.is_couple_member(uuid) to authenticated;

revoke all on function public.is_couple_owner(uuid) from public;
grant execute on function public.is_couple_owner(uuid) to authenticated;

revoke all on function public.couple_member_count(uuid) from public;
grant execute on function public.couple_member_count(uuid) to authenticated;

revoke all on function public.my_couple_id() from public;
grant execute on function public.my_couple_id() to authenticated;

create or replace function public.enforce_couple_member_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.couple_member_count(new.couple_id) >= 2 then
    raise exception 'couple_full';
  end if;
  return new;
end;
$$;

drop trigger if exists couple_members_limit on public.couple_members;
create trigger couple_members_limit
  before insert on public.couple_members
  for each row
  execute function public.enforce_couple_member_limit();

-- ===========================================================================
-- 7. RPC — invite & couple lifecycle (frontend uses anon key only)
-- ===========================================================================

create or replace function public.generate_invite_code(len int default 6)
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  out text := '';
  i int;
begin
  for i in 1..len loop
    out := out || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return out;
end;
$$;

-- Create space + owner member + empty app state row
create or replace function public.create_couple_space(
  p_couple_name text default null
)
returns table (out_couple_id uuid, out_invite_code text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_couple_id uuid;
  v_code text;
  v_attempts int := 0;
  v_empty_state jsonb := jsonb_build_object('version', 1);
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if public.my_couple_id() is not null then
    raise exception 'already_in_couple';
  end if;

  loop
    v_attempts := v_attempts + 1;
    v_code := public.generate_invite_code(6);
    exit when not exists (
      select 1 from public.couples c where lower(c.invite_code) = lower(v_code)
    );
    if v_attempts > 20 then
      raise exception 'invite_code_generation_failed';
    end if;
  end loop;

  -- Support Phase 5 schema (created_by / display_name) and Phase 7 (owner_id / couple_name)
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'couples' and column_name = 'created_by'
  ) then
    insert into public.couples (created_by, owner_id, invite_code, display_name, couple_name)
    values (
      v_uid,
      v_uid,
      v_code,
      nullif(trim(p_couple_name), ''),
      nullif(trim(p_couple_name), '')
    )
    returning id into v_couple_id;
  else
    insert into public.couples (owner_id, invite_code, couple_name)
    values (v_uid, v_code, nullif(trim(p_couple_name), ''))
    returning id into v_couple_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'couple_members' and column_name = 'partner_slot'
  ) then
    insert into public.couple_members (couple_id, user_id, role, partner_slot)
    values (v_couple_id, v_uid, 'owner', 'A');
  else
    insert into public.couple_members (couple_id, user_id, role)
    values (v_couple_id, v_uid, 'owner');
  end if;

  insert into public.couple_app_state (couple_id, state, updated_by)
  values (v_couple_id, v_empty_state, v_uid)
  on conflict (couple_id) do nothing;

  return query select v_couple_id, v_code;
end;
$$;

revoke all on function public.create_couple_space(text) from public;
grant execute on function public.create_couple_space(text) to authenticated;

-- Join by invite code (partner role, max 2)
create or replace function public.accept_couple_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_couple_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select c.id into v_couple_id
  from public.couples c
  where lower(trim(c.invite_code)) = lower(trim(p_code))
  limit 1;

  if v_couple_id is null then
    raise exception 'invalid_invite';
  end if;

  if exists (
    select 1
    from public.couple_members cm
    where cm.couple_id = v_couple_id and cm.user_id = v_uid
  ) then
    return v_couple_id;
  end if;

  if public.couple_member_count(v_couple_id) >= 2 then
    raise exception 'couple_full';
  end if;

  if public.my_couple_id() is not null then
    raise exception 'already_in_couple';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'couple_members' and column_name = 'partner_slot'
  ) then
    insert into public.couple_members (couple_id, user_id, role, partner_slot)
    values (v_couple_id, v_uid, 'partner', 'B');
  else
    insert into public.couple_members (couple_id, user_id, role)
    values (v_couple_id, v_uid, 'partner');
  end if;

  return v_couple_id;
end;
$$;

revoke all on function public.accept_couple_invite(text) from public;
grant execute on function public.accept_couple_invite(text) to authenticated;

-- Owner regenerates invite code
create or replace function public.regenerate_couple_invite(p_couple_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_code text;
  v_attempts int := 0;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if not public.is_couple_owner(p_couple_id) then
    raise exception 'forbidden';
  end if;

  loop
    v_attempts := v_attempts + 1;
    v_code := public.generate_invite_code(6);
    exit when not exists (
      select 1 from public.couples c where lower(c.invite_code) = lower(v_code)
    );
    if v_attempts > 20 then
      raise exception 'invite_code_generation_failed';
    end if;
  end loop;

  update public.couples c
  set invite_code = v_code
  where c.id = p_couple_id;

  return v_code;
end;
$$;

revoke all on function public.regenerate_couple_invite(uuid) from public;
grant execute on function public.regenerate_couple_invite(uuid) to authenticated;

-- Optimistic save: reject if server row is newer than client base timestamp
create or replace function public.save_couple_app_state(
  p_couple_id uuid,
  p_state jsonb,
  p_base_updated_at timestamptz default null
)
returns table (out_ok boolean, out_updated_at timestamptz, out_conflict boolean)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_now timestamptz := timezone('utc', now());
  v_current timestamptz;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if not public.is_couple_member(p_couple_id) then
    raise exception 'forbidden';
  end if;

  select s.updated_at into v_current
  from public.couple_app_state s
  where s.couple_id = p_couple_id
  for update;

  if v_current is null then
    insert into public.couple_app_state (couple_id, state, updated_at, updated_by)
    values (p_couple_id, coalesce(p_state, '{}'::jsonb), v_now, v_uid);
    return query select true, v_now, false;
    return;
  end if;

  if p_base_updated_at is not null and v_current > p_base_updated_at then
    return query select false, v_current, true;
    return;
  end if;

  update public.couple_app_state s
  set
    state = coalesce(p_state, '{}'::jsonb),
    updated_at = v_now,
    updated_by = v_uid
  where s.couple_id = p_couple_id;

  return query select true, v_now, false;
end;
$$;

revoke all on function public.save_couple_app_state(uuid, jsonb, timestamptz) from public;
grant execute on function public.save_couple_app_state(uuid, jsonb, timestamptz) to authenticated;

-- ===========================================================================
-- 8. RLS — members only; no service role on client
-- ===========================================================================

alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.couple_app_state enable row level security;

-- couples: members read; insert via RPC only (revoke direct insert in app)
drop policy if exists "couples_select_member" on public.couples;
create policy "couples_select_member"
  on public.couples for select to authenticated
  using (public.is_couple_member(id));

drop policy if exists "couples_update_owner" on public.couples;
create policy "couples_update_owner"
  on public.couples for update to authenticated
  using (public.is_couple_owner(id))
  with check (public.is_couple_owner(id));

-- couple_members
drop policy if exists "couple_members_select" on public.couple_members;
create policy "couple_members_select"
  on public.couple_members for select to authenticated
  using (user_id = auth.uid() or public.is_couple_member(couple_id));

-- Direct insert allowed only for self (RPC also inserts); delete: owner removes partner only
drop policy if exists "couple_members_insert_self" on public.couple_members;
create policy "couple_members_insert_self"
  on public.couple_members for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "couple_members_delete_owner" on public.couple_members;
create policy "couple_members_delete_owner"
  on public.couple_members for delete to authenticated
  using (public.is_couple_owner(couple_id) and role = 'partner');

-- couple_app_state: read/write for members
drop policy if exists "couple_app_state_select_member" on public.couple_app_state;
create policy "couple_app_state_select_member"
  on public.couple_app_state for select to authenticated
  using (public.is_couple_member(couple_id));

drop policy if exists "couple_app_state_upsert_member" on public.couple_app_state;
create policy "couple_app_state_upsert_member"
  on public.couple_app_state for all to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

-- ===========================================================================
-- 9. Grants (authenticated / anon key from frontend — NOT service_role)
-- ===========================================================================

grant select on table public.couples to authenticated;
grant select on table public.couple_members to authenticated;
grant select, insert, update on table public.couple_app_state to authenticated;

-- Inserts to couples / couple_members: prefer RPC (security definer).
-- If you need direct insert for debugging, grant explicitly in a dev-only migration.
