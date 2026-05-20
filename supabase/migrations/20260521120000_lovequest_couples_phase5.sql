-- LoveQuest Phase 5: couple spaces, invite codes, shared data tables + RLS.
-- Apply via Supabase SQL Editor or: supabase db push
-- Does NOT modify legacy cats / cat_members tables.
-- Safe to re-run: IF NOT EXISTS, DROP POLICY IF EXISTS, CREATE OR REPLACE.

-- ===========================================================================
-- 1. Extensions
-- ===========================================================================

create extension if not exists pgcrypto;

-- gen_random_uuid() provided by pgcrypto (Supabase / Postgres 13+)

-- ===========================================================================
-- 2. Tables (all tables before any function that references them)
-- ===========================================================================

-- couples
create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  invite_code text not null,
  display_name text,
  partner_a_label text,
  partner_b_label text,
  partner_a_emoji text default '💗',
  partner_b_emoji text default '💙',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists couples_invite_code_lower_idx on public.couples (lower(invite_code));
create index if not exists couples_created_by_idx on public.couples (created_by);

-- couple_members (max 2 per couple — trigger added after helper functions)
create table if not exists public.couple_members (
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'partner')),
  partner_slot text check (partner_slot in ('A', 'B')),
  joined_at timestamptz not null default timezone('utc', now()),
  primary key (couple_id, user_id)
);

create index if not exists couple_members_user_id_idx on public.couple_members (user_id);

-- food_options
create table if not exists public.food_options (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  client_id text,
  label text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists food_options_couple_idx on public.food_options (couple_id, sort_order);

-- food_decisions
create table if not exists public.food_decisions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  client_id text,
  decision_date date not null,
  label text not null,
  saved_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists food_decisions_couple_date_idx
  on public.food_decisions (couple_id, decision_date desc);

-- chores
create table if not exists public.chores (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  client_id text,
  label text not null,
  emoji text not null default '🏠',
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists chores_couple_idx on public.chores (couple_id, sort_order);

-- chore_records
create table if not exists public.chore_records (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  client_id text,
  chore_id uuid references public.chores (id) on delete set null,
  task_label text not null,
  emoji text not null default '🏠',
  partner_slot text not null check (partner_slot in ('A', 'B')),
  points int not null default 10,
  completed_at timestamptz not null default timezone('utc', now()),
  completed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists chore_records_couple_completed_idx
  on public.chore_records (couple_id, completed_at desc);

-- love_task_records
create table if not exists public.love_task_records (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  client_id text,
  task_date date not null,
  template_id text not null,
  label text not null,
  emoji text not null default '💕',
  done boolean not null default false,
  completed_at timestamptz,
  completed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (couple_id, task_date, client_id)
);

create index if not exists love_task_records_couple_date_idx
  on public.love_task_records (couple_id, task_date desc);

-- date_idea_records
create table if not exists public.date_idea_records (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  client_id text,
  idea_id text not null,
  title text not null,
  emoji text not null default '💑',
  cost text not null check (cost in ('low', 'mid', 'high')),
  duration text not null check (duration in ('1h', 'half', 'full')),
  completed_date date not null,
  completed_time text,
  completed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists date_idea_records_couple_date_idx
  on public.date_idea_records (couple_id, completed_date desc);

-- couple_stats
create table if not exists public.couple_stats (
  couple_id uuid primary key references public.couples (id) on delete cascade,
  heart_points int not null default 50 check (heart_points between 0 and 100),
  compatibility int not null default 60 check (compatibility between 0 and 100),
  xp int not null default 0 check (xp >= 0),
  level int not null default 1 check (level >= 1),
  housework_points int not null default 0 check (housework_points >= 0),
  date_achievements int not null default 0 check (date_achievements >= 0),
  app_state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references auth.users (id) on delete set null
);

-- ===========================================================================
-- 3. Generic updated_at trigger (no dependency on couple_members)
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

drop trigger if exists couples_set_updated_at on public.couples;
create trigger couples_set_updated_at
  before update on public.couples
  for each row
  execute function public.lovequest_set_updated_at();

drop trigger if exists food_options_set_updated_at on public.food_options;
create trigger food_options_set_updated_at
  before update on public.food_options
  for each row
  execute function public.lovequest_set_updated_at();

drop trigger if exists chores_set_updated_at on public.chores;
create trigger chores_set_updated_at
  before update on public.chores
  for each row
  execute function public.lovequest_set_updated_at();

drop trigger if exists love_task_records_set_updated_at on public.love_task_records;
create trigger love_task_records_set_updated_at
  before update on public.love_task_records
  for each row
  execute function public.lovequest_set_updated_at();

drop trigger if exists couple_stats_set_updated_at on public.couple_stats;
create trigger couple_stats_set_updated_at
  before update on public.couple_stats
  for each row
  execute function public.lovequest_set_updated_at();

-- ===========================================================================
-- 4. Helper functions (after couple_members exists)
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

revoke all on function public.is_couple_member(uuid) from public;
grant execute on function public.is_couple_member(uuid) to authenticated;

revoke all on function public.is_couple_owner(uuid) from public;
grant execute on function public.is_couple_owner(uuid) to authenticated;

revoke all on function public.couple_member_count(uuid) from public;
grant execute on function public.couple_member_count(uuid) to authenticated;

-- Member limit trigger (depends on couple_member_count)
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
-- 5. RPC functions (after tables + helpers)
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

create or replace function public.create_couple_space(
  p_display_name text default null,
  p_partner_a_label text default null,
  p_partner_b_label text default null
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
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if exists (select 1 from public.couple_members cm where cm.user_id = v_uid) then
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

  insert into public.couples (
    created_by,
    invite_code,
    display_name,
    partner_a_label,
    partner_b_label
  )
  values (
    v_uid,
    v_code,
    nullif(trim(p_display_name), ''),
    nullif(trim(p_partner_a_label), ''),
    nullif(trim(p_partner_b_label), '')
  )
  returning id into v_couple_id;

  insert into public.couple_members (couple_id, user_id, role, partner_slot)
  values (v_couple_id, v_uid, 'owner', 'A');

  insert into public.couple_stats (couple_id, updated_by)
  values (v_couple_id, v_uid);

  return query select v_couple_id, v_code;
end;
$$;

revoke all on function public.create_couple_space(text, text, text) from public;
grant execute on function public.create_couple_space(text, text, text) to authenticated;

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

  if exists (select 1 from public.couple_members cm where cm.user_id = v_uid) then
    raise exception 'already_in_couple';
  end if;

  insert into public.couple_members (couple_id, user_id, role, partner_slot)
  values (v_couple_id, v_uid, 'partner', 'B');

  return v_couple_id;
end;
$$;

revoke all on function public.accept_couple_invite(text) from public;
grant execute on function public.accept_couple_invite(text) to authenticated;

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

-- ===========================================================================
-- 6. RLS (enable + policies — after helper functions exist)
-- ===========================================================================

alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.food_options enable row level security;
alter table public.food_decisions enable row level security;
alter table public.chores enable row level security;
alter table public.chore_records enable row level security;
alter table public.love_task_records enable row level security;
alter table public.date_idea_records enable row level security;
alter table public.couple_stats enable row level security;

-- couples
drop policy if exists "couples_select_member" on public.couples;
create policy "couples_select_member"
  on public.couples for select to authenticated
  using (public.is_couple_member(id));

drop policy if exists "couples_insert_creator" on public.couples;
create policy "couples_insert_creator"
  on public.couples for insert to authenticated
  with check (created_by = auth.uid());

drop policy if exists "couples_update_member" on public.couples;
create policy "couples_update_member"
  on public.couples for update to authenticated
  using (public.is_couple_member(id))
  with check (public.is_couple_member(id));

-- couple_members
drop policy if exists "couple_members_select" on public.couple_members;
create policy "couple_members_select"
  on public.couple_members for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_couple_member(couple_id)
  );

drop policy if exists "couple_members_insert_self" on public.couple_members;
create policy "couple_members_insert_self"
  on public.couple_members for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "couple_members_delete_owner" on public.couple_members;
create policy "couple_members_delete_owner"
  on public.couple_members for delete to authenticated
  using (public.is_couple_owner(couple_id) and role = 'partner');

-- child tables
drop policy if exists "food_options_all_member" on public.food_options;
create policy "food_options_all_member"
  on public.food_options for all to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

drop policy if exists "food_decisions_all_member" on public.food_decisions;
create policy "food_decisions_all_member"
  on public.food_decisions for all to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

drop policy if exists "chores_all_member" on public.chores;
create policy "chores_all_member"
  on public.chores for all to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

drop policy if exists "chore_records_all_member" on public.chore_records;
create policy "chore_records_all_member"
  on public.chore_records for all to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

drop policy if exists "love_task_records_all_member" on public.love_task_records;
create policy "love_task_records_all_member"
  on public.love_task_records for all to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

drop policy if exists "date_idea_records_all_member" on public.date_idea_records;
create policy "date_idea_records_all_member"
  on public.date_idea_records for all to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

drop policy if exists "couple_stats_all_member" on public.couple_stats;
create policy "couple_stats_all_member"
  on public.couple_stats for all to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

-- ===========================================================================
-- 7. Grants
-- ===========================================================================

grant select, insert, update, delete on table public.couples to authenticated;
grant select, insert, update, delete on table public.couple_members to authenticated;
grant select, insert, update, delete on table public.food_options to authenticated;
grant select, insert, update, delete on table public.food_decisions to authenticated;
grant select, insert, update, delete on table public.chores to authenticated;
grant select, insert, update, delete on table public.chore_records to authenticated;
grant select, insert, update, delete on table public.love_task_records to authenticated;
grant select, insert, update, delete on table public.date_idea_records to authenticated;
grant select, insert, update, delete on table public.couple_stats to authenticated;

-- LoveQuest does not use public.profiles. Member identity uses auth.users via couple_members.user_id.
